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

const dummyReturn = {
  "suggestions": [
    {"name": "n1", "rationale": "r1"},
    {"name": "n2", "rationale": "r2"},
  ],
  "totals": {
    "totalCalories": 0,
    "totalProtein": 0,
    "totalFat": 0,
    "totalCarbs": 0,
    "days": 0
  },
  "note": "test note"
};

// Helper function to check for suggestion text
const expectSuggestionText = () => {
    expect(screen.getByText(new RegExp('n1', 'i'))).toBeInTheDocument();
    expect(screen.getByText(new RegExp('r1', 'i'))).toBeInTheDocument();
    expect(screen.getByText(new RegExp('n2', 'i'))).toBeInTheDocument();
    expect(screen.getByText(new RegExp('r2', 'i'))).toBeInTheDocument();
    return;
};

describe('AISuggestions component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementation
    getAISuggestions.mockReset();
  });

  test('renders AI Suggestions header and refresh button', async () => {
    getAISuggestions.mockResolvedValue(dummyReturn);
    
    render(<AISuggestions />);

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

    render(<AISuggestions/>);

    // Should show loading state
    expect(screen.getByText(/Loading suggestions/i)).toBeInTheDocument();
    
    // Resolve the promise
    resolvePromise(dummyReturn);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/Loading suggestions/i)).not.toBeInTheDocument();
    });
  });

  test('fetches and displays suggestions on initial load', async () => {
    getAISuggestions.mockResolvedValue(dummyReturn);

    render(<AISuggestions/>);

    await waitFor(() => {
      expect(screen.queryByText(/Loading suggestions/i)).not.toBeInTheDocument();
    });

    expectSuggestionText();
    expect(getAISuggestions).toHaveBeenCalledTimes(1);
  });

  test('displays "No suggestions available" when suggestions are empty', async () => {
    // Return an object without suggestions array or with empty array
    getAISuggestions.mockResolvedValue({});

    render(<AISuggestions/>);

    await waitFor(() => {
      expect(screen.queryByText(/Loading suggestions/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/No suggestions available/i)).toBeInTheDocument();
  });

  test('displays error message when API call fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('API Error');
    getAISuggestions.mockRejectedValue(error);

    render(<AISuggestions/>);

    await waitFor(() => {
      expect(screen.queryByText(/Loading suggestions/i)).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/Error: API Error/i)).toBeInTheDocument();
    });
    
    // Component logs err.message, not the Error object
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch AI suggestions:', 'API Error');
    
    consoleErrorSpy.mockRestore();
  });

  test('handles invalid response format without errors', async () => {
    // Test with undefined response
    getAISuggestions.mockResolvedValueOnce(undefined);

    render(<AISuggestions/>);
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading suggestions/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/No suggestions available/i)).toBeInTheDocument();
  });

  test('refresh button fetches new suggestions when clicked', async () => {
    const user = userEvent.setup();
    
    const refreshedReturn = {
      ...dummyReturn,
      suggestions: [
        {"name": "n3", "rationale": "r3"},
        {"name": "n4", "rationale": "r4"},
      ],
    };
    
    let resolveSecondPromise;
    const secondPromise = new Promise((resolve) => {
      resolveSecondPromise = resolve;
    });
    
    getAISuggestions
      .mockResolvedValueOnce(dummyReturn)
      .mockReturnValueOnce(secondPromise);

    render(<AISuggestions/>);

    await waitFor(() => {
      expect(screen.queryByText(/Loading suggestions/i)).not.toBeInTheDocument();
    });

    expectSuggestionText();
    expect(getAISuggestions).toHaveBeenCalledTimes(1);

    const refreshButton = screen.getByTitle(/Refresh suggestions/i);
    await user.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByText(/Loading suggestions/i)).toBeInTheDocument();
    });

    resolveSecondPromise(refreshedReturn);

    await waitFor(() => {
      expect(screen.queryByText(/Loading suggestions/i)).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(new RegExp('n3', 'i'))).toBeInTheDocument();
      expect(screen.getByText(new RegExp('r3', 'i'))).toBeInTheDocument();
      expect(screen.getByText(new RegExp('n4', 'i'))).toBeInTheDocument();
      expect(screen.getByText(new RegExp('r4', 'i'))).toBeInTheDocument();
    });
    expect(getAISuggestions).toHaveBeenCalledTimes(2);
  });

  test('refresh button is disabled during loading', async () => {
    const user = userEvent.setup();
    
    let resolveSecondPromise;
    const secondPromise = new Promise((resolve) => {
      resolveSecondPromise = resolve;
    });
    
    getAISuggestions
      .mockResolvedValueOnce(dummyReturn)
      .mockReturnValueOnce(secondPromise);

    render(<AISuggestions/>);

    const refreshButton = screen.getByTitle(/Refresh suggestions/i);
    
    // Wait for initial load to complete
    await waitFor(() => {
      expect(refreshButton).not.toBeDisabled();
    }, { timeout: 3000 });
    
    await user.click(refreshButton);

    // Button should be disabled during refresh
    await waitFor(() => {
      expect(refreshButton).toBeDisabled();
    }, { timeout: 3000 });

    resolveSecondPromise(dummyReturn);
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading suggestions/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });
    
    await waitFor(() => {
      expect(refreshButton).not.toBeDisabled();
    }, { timeout: 3000 });
  });

  test('handles multiple rapid refresh clicks gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock to resolve after a delay
    getAISuggestions.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(dummyReturn), 100))
    );

    render(<AISuggestions/>);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText(/Loading suggestions/i)).not.toBeInTheDocument();
    }, { timeout: 2000 });

    const refreshButton = screen.getByTitle(/Refresh suggestions/i);
    
    // Click multiple times rapidly
    await user.click(refreshButton);
    await user.click(refreshButton);
    await user.click(refreshButton);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/Loading suggestions/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify suggestions are displayed
    await waitFor(() => {
        expectSuggestionText();
    }, { timeout: 3000 });

    expect(getAISuggestions.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  test('displays suggestions with proper formatting', async () => {
    getAISuggestions.mockResolvedValue(dummyReturn);

    render(<AISuggestions/>);

    await waitFor(() => {
      expect(screen.queryByText(/Loading suggestions/i)).not.toBeInTheDocument();
    });

    expectSuggestionText();
  });
});

