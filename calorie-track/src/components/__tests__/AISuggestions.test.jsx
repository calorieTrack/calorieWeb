import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AISuggestions from '../AISuggestions';

// Mock the API module
jest.mock('../../api', () => ({
  getAISuggestions: jest.fn(),
}));

// Mock firebase/auth for the API client
jest.mock('../../config', () => ({
  API_URL: 'http://localhost:4000',
  firebaseConfig: {
    apiKey: "test-key",
    authDomain: "test-domain",
    projectId: "test-project",
  }
}));

jest.mock('../../firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: jest.fn(() => Promise.resolve('mock-token')),
    },
  },
}));

import { getAISuggestions } from '../../api';

describe('AISuggestions component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders AI Suggestions header and refresh button', async () => {
    getAISuggestions.mockResolvedValue('Test suggestions');
    
    render(<AISuggestions entries={[]} />);

    expect(screen.getByText(/AI Suggestions/i)).toBeInTheDocument();
    
    // Wait for initial load to complete, then check button
    await waitFor(() => {
      expect(screen.queryByText(/Loading suggestions/i)).not.toBeInTheDocument();
    });
    
    const refreshButton = screen.getByTitle(/Refresh suggestions/i);
    expect(refreshButton).toBeInTheDocument();
  });

  test('displays loading message while fetching suggestions', async () => {
    // Create a promise that we can control
    let resolvePromise;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    getAISuggestions.mockReturnValue(pendingPromise);

    render(<AISuggestions entries={[]} />);

    // Should show loading state
    expect(screen.getByText(/Loading suggestions/i)).toBeInTheDocument();
    
    // Resolve the promise
    resolvePromise('Test suggestions');
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/Loading suggestions/i)).not.toBeInTheDocument();
    });
  });

  test('fetches and displays suggestions on initial load', async () => {
    const mockSuggestions = 'test message';
    getAISuggestions.mockResolvedValue(mockSuggestions);

    render(<AISuggestions entries={[]} />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading suggestions/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(mockSuggestions)).toBeInTheDocument();
    expect(getAISuggestions).toHaveBeenCalledTimes(1);
  });

  test('displays "No suggestions available" when suggestions are empty', async () => {
    getAISuggestions.mockResolvedValue('');

    render(<AISuggestions entries={[]} />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading suggestions/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/No suggestions available/i)).toBeInTheDocument();
  });

  test('displays error message when API call fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    getAISuggestions.mockRejectedValue(new Error('API Error'));

    render(<AISuggestions entries={[]} />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading suggestions/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Failed to load suggestions. Please try again./i)).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch AI suggestions:', expect.any(Error));
    
    consoleErrorSpy.mockRestore();
  });

  test('handles null or undefined entries prop without errors', async () => {
    const mockSuggestions = 'test suggestions';
    getAISuggestions.mockResolvedValueOnce(mockSuggestions);

    // Test with null entries
    const { rerender, unmount } = render(<AISuggestions entries={null} />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading suggestions/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(mockSuggestions)).toBeInTheDocument();

    unmount();

    // Test with undefined entries
    getAISuggestions.mockResolvedValueOnce(mockSuggestions);
    render(<AISuggestions entries={undefined} />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading suggestions/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(mockSuggestions)).toBeInTheDocument();
  });

  test('refresh button fetches new suggestions when clicked', async () => {
    const user = userEvent.setup();
    const mockSuggestions1 = 'Initial suggestions';
    const mockSuggestions2 = 'Refreshed suggestions';
    
    // First call resolves immediately
    let resolveSecondPromise;
    const secondPromise = new Promise((resolve) => {
      resolveSecondPromise = resolve;
    });
    
    getAISuggestions
      .mockResolvedValueOnce(mockSuggestions1)
      .mockReturnValueOnce(secondPromise);

    render(<AISuggestions entries={[]} />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading suggestions/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(mockSuggestions1)).toBeInTheDocument();
    expect(getAISuggestions).toHaveBeenCalledTimes(1);

    const refreshButton = screen.getByTitle(/Refresh suggestions/i);
    await user.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByText(/Loading suggestions/i)).toBeInTheDocument();
    });

    resolveSecondPromise(mockSuggestions2);

    await waitFor(() => {
      expect(screen.queryByText(/Loading suggestions/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(mockSuggestions2)).toBeInTheDocument();
    expect(getAISuggestions).toHaveBeenCalledTimes(2);
  });

  test('refresh button is disabled during loading', async () => {
    const user = userEvent.setup();
    let resolveFirstPromise;
    const firstPromise = new Promise((resolve) => {
      resolveFirstPromise = resolve;
    });
    
    let resolveSecondPromise;
    const secondPromise = new Promise((resolve) => {
      resolveSecondPromise = resolve;
    });
    
    getAISuggestions
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(secondPromise);

    render(<AISuggestions entries={[]} />);

    const refreshButton = screen.getByTitle(/Refresh suggestions/i);
    
    // Button should be disabled during initial load
    expect(refreshButton).toBeDisabled();
    resolveFirstPromise('test suggestions 1');
    await waitFor(() => {
      expect(refreshButton).not.toBeDisabled();
    });
    await user.click(refreshButton);

    // Button should be disabled again during refresh
    await waitFor(() => {
      expect(refreshButton).toBeDisabled();
    });

    resolveSecondPromise('test suggestions 2');
    await waitFor(() => {
      expect(screen.queryByText(/Loading suggestions/i)).not.toBeInTheDocument();
      expect(refreshButton).not.toBeDisabled();
    });
  });

  test('handles multiple rapid refresh clicks gracefully', async () => {
    const user = userEvent.setup();
    const mockSuggestions = 'test suggestions';
    
    // Mock to resolve after a delay
    getAISuggestions.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockSuggestions), 100))
    );

    render(<AISuggestions entries={[]} />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText(/Loading suggestions/i)).not.toBeInTheDocument();
    }, { timeout: 2000 });

    const refreshButton = screen.getByTitle(/Refresh suggestions/i);
    
    // Click multiple times rapidly
    await user.click(refreshButton);
    await user.click(refreshButton);
    await user.click(refreshButton);

    // Should eventually show the final suggestions
    await waitFor(() => {
      expect(screen.getByText(mockSuggestions)).toBeInTheDocument();
    }, { timeout: 2000 });

    // Should have been called multiple times (initial + 3 clicks)
    expect(getAISuggestions.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  test('displays suggestions with proper formatting', async () => {
    const longSuggestions =
      'test message line 1\n\nbagels\ncream cheese\nthis is a very long message ' +
      'that should be displayed in multiple lines despite there being no newlines';
    getAISuggestions.mockResolvedValue(longSuggestions);

    render(<AISuggestions entries={[]} />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading suggestions/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/test message line 1/i)).toBeInTheDocument();
    expect(screen.getByText(/bagels/i)).toBeInTheDocument();
    expect(screen.getByText(/cream cheese/i)).toBeInTheDocument();
    expect(screen.getByText(/this is a very long message that should be displayed in multiple lines despite there being no newlines/i)).toBeInTheDocument();
  });
});

