import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App.jsx';

// Mock fetch
global.fetch = vi.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the app component', () => {
    render(<App />);
    expect(screen.getByPlaceholderText('Describe the video edit...')).toBeInTheDocument();
  });

  it('renders file upload input', () => {
    render(<App />);
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
  });

  it('renders chat input with placeholder', () => {
    render(<App />);
    expect(screen.getByPlaceholderText('Describe the video edit...')).toBeInTheDocument();
  });

  it('renders send button', () => {
    render(<App />);
    const sendButtons = screen.getAllByText('Send');
    expect(sendButtons.length).toBeGreaterThan(0);
  });

  it('send button is disabled when no video is uploaded', () => {
    render(<App />);
    const sendButton = screen.getByText('Send');
    expect(sendButton).toBeDisabled();
  });

  it('does not expose token in client-side code', () => {
    const { container } = render(<App />);
    const html = container.innerHTML;
    
    // Ensure no token-related UI elements exist
    expect(html).not.toContain('xaiToken');
    expect(html).not.toContain('Set Token');
    expect(html).not.toContain('No token');
  });
});
