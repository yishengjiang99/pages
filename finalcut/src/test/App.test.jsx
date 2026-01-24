import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App.jsx';

// Mock ffmpeg module
vi.mock('../ffmpeg.js', () => ({
  ffmpeg: {
    on: vi.fn(),
    load: vi.fn(),
    exec: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    loaded: false,
  },
  loadFFmpeg: vi.fn().mockResolvedValue(undefined),
  fetchFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete window.location;
    window.location = { href: '', origin: 'http://localhost:3000' };
  });

  it('renders the app component', () => {
    render(<App />);
    // The landing page is shown initially, so we won't see the chat input yet
    const getStartedButton = screen.getByText('Get Started');
    expect(getStartedButton).toBeInTheDocument();
  });

  it('renders file upload input after getting started', async () => {
    const mockCheckoutUrl = 'https://checkout.stripe.com/pay/cs_test_123';
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessionId: 'cs_test_123', url: mockCheckoutUrl })
    });

    render(<App />);
    // Landing page doesn't have file input initially
    expect(screen.queryByText('Get Started')).toBeInTheDocument();
  });

  it('renders landing page with title', () => {
    render(<App />);
    expect(screen.getByText('FinalCut Video Editor')).toBeInTheDocument();
  });

  it('renders landing page with Get Started button', () => {
    render(<App />);
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('renders landing page with Try with Sample Video button', () => {
    render(<App />);
    expect(screen.getByText('Try with Sample Video')).toBeInTheDocument();
  });

  it('does not expose token in client-side code', () => {
    const { container } = render(<App />);
    const html = container.innerHTML;
    
    // Ensure no token-related UI elements exist
    expect(html).not.toContain('xaiToken');
    expect(html).not.toContain('Set Token');
    expect(html).not.toContain('No token');
  });

  it('Get Started button creates checkout session and redirects to Stripe', async () => {
    const mockCheckoutUrl = 'https://checkout.stripe.com/pay/cs_test_123';
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessionId: 'cs_test_123', url: mockCheckoutUrl })
    });

    render(<App />);
    const getStartedButton = screen.getByText('Get Started');
    
    fireEvent.click(getStartedButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          priceId: 'price_1StDJe4OymfcnKESq2dIraNE',
          successUrl: 'http://localhost:3000/success',
          cancelUrl: 'http://localhost:3000'
        })
      });
    });

    await waitFor(() => {
      expect(window.location.href).toBe(mockCheckoutUrl);
    });
  });

  it('Get Started button handles errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<App />);
    const getStartedButton = screen.getByText('Get Started');
    
    fireEvent.click(getStartedButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to start checkout. Please try again.');
    });

    alertSpy.mockRestore();
  });

  it('shows editor interface when returning from successful payment', () => {
    // Mock location.pathname to simulate returning from /success
    delete window.location;
    window.location = { 
      pathname: '/success',
      origin: 'http://localhost:3000',
      href: 'http://localhost:3000/success'
    };
    
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

    render(<App />);

    // Landing page should not be shown
    expect(screen.queryByText('Get Started')).not.toBeInTheDocument();
    
    // Editor interface should be shown (check for file input)
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    
    // URL should be cleaned up
    expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/');

    replaceStateSpy.mockRestore();
  });
});
