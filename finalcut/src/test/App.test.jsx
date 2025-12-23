import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App.jsx';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = vi.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('renders the app component', () => {
    render(<App />);
    expect(screen.getByText('No token')).toBeInTheDocument();
    expect(screen.getByText('Set xAI Token')).toBeInTheDocument();
  });

  it('shows token prompt when no token is set', () => {
    render(<App />);
    expect(screen.getByPlaceholderText('Enter xAI API token')).toBeInTheDocument();
  });

  it('saves token to localStorage when set', async () => {
    render(<App />);
    
    const input = screen.getByPlaceholderText('Enter xAI API token');
    const saveButton = screen.getByText('Save');
    
    fireEvent.change(input, { target: { value: 'test-token-123' } });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('xaiToken', 'test-token-123');
    });
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

  it('displays token set status when token exists', () => {
    localStorageMock.getItem.mockReturnValue('existing-token');
    render(<App />);
    expect(screen.getByText('Token set')).toBeInTheDocument();
  });
});
