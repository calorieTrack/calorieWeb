import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Make TextEncoder/TextDecoder available globally for jsdom environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock crypto.subtle.digest for Gravatar URL generation
const mockDigest = jest.fn();

// Set up crypto mock before importing the component
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: mockDigest,
    },
  },
  writable: true,
  configurable: true,
});

import UserHeader from '../UserHeader';

describe('UserHeader component', () => {
  const mockOnSignOut = jest.fn();
  const mockOnSettings = jest.fn();
  const mockOnTrends = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock: return a hash buffer that converts to hex
    const mockHashBuffer = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0]);
    mockDigest.mockResolvedValue(mockHashBuffer);
  });

  test('renders welcome message with display name', async () => {
    const mockUser = { displayName: 'Alice', email: 'alice@example.com' };
    render(
      <UserHeader 
        user={mockUser}
        onSignOut={mockOnSignOut}
        onSettings={mockOnSettings}
        onTrends={mockOnTrends}
      />
    );
    expect(await screen.findByText('Welcome, Alice')).toBeInTheDocument();
  });

  test('renders welcome message with email when displayName is missing', async () => {
    const mockUser = { email: 'jane@example.com' };
    render(
      <UserHeader 
        user={mockUser}
        onSignOut={mockOnSignOut}
        onSettings={mockOnSettings}
        onTrends={mockOnTrends}
      />
    );
    expect(await screen.findByText('Welcome, jane@example.com')).toBeInTheDocument();
  });

  test('renders all three action buttons', async () => {
    const mockUser = { displayName: 'Test User', email: 'test@example.com' };
    render(
      <UserHeader 
        user={mockUser}
        onSignOut={mockOnSignOut}
        onSettings={mockOnSettings}
        onTrends={mockOnTrends}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /trends/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    });
  });

  test('calls onSignOut callback when Sign Out button is clicked', async () => {
    const user = userEvent.setup();
    const mockUser = { displayName: 'Test User', email: 'test@example.com' };
    
    render(
      <UserHeader 
        user={mockUser}
        onSignOut={mockOnSignOut}
        onSettings={mockOnSettings}
        onTrends={mockOnTrends}
      />
    );

    const signOutButton = await screen.findByRole('button', { name: /sign out/i });
    await user.click(signOutButton);

    expect(mockOnSignOut).toHaveBeenCalledTimes(1);
    expect(mockOnSettings).not.toHaveBeenCalled();
    expect(mockOnTrends).not.toHaveBeenCalled();
  });

  test('calls onSettings callback when Settings button is clicked', async () => {
    const user = userEvent.setup();
    const mockUser = { displayName: 'Test User', email: 'test@example.com' };
    
    render(
      <UserHeader 
        user={mockUser}
        onSignOut={mockOnSignOut}
        onSettings={mockOnSettings}
        onTrends={mockOnTrends}
      />
    );

    const settingsButton = await screen.findByRole('button', { name: /settings/i });
    await user.click(settingsButton);

    expect(mockOnSettings).toHaveBeenCalledTimes(1);
    expect(mockOnSignOut).not.toHaveBeenCalled();
    expect(mockOnTrends).not.toHaveBeenCalled();
  });

  test('calls onTrends callback when Trends button is clicked', async () => {
    const user = userEvent.setup();
    const mockUser = { displayName: 'Test User', email: 'test@example.com' };
    
    render(
      <UserHeader 
        user={mockUser}
        onSignOut={mockOnSignOut}
        onSettings={mockOnSettings}
        onTrends={mockOnTrends}
      />
    );

    const trendsButton = await screen.findByRole('button', { name: /trends/i });
    await user.click(trendsButton);

    expect(mockOnTrends).toHaveBeenCalledTimes(1);
    expect(mockOnSignOut).not.toHaveBeenCalled();
    expect(mockOnSettings).not.toHaveBeenCalled();
  });

  test('generates Gravatar URL and displays avatar image', async () => {
    const mockUser = { displayName: 'Test User', email: 'test@example.com' };
    
    render(
      <UserHeader 
        user={mockUser}
        onSignOut={mockOnSignOut}
        onSettings={mockOnSettings}
        onTrends={mockOnTrends}
      />
    );

    await waitFor(() => {
      const avatar = screen.getByAltText('Profile');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveClass('user-avatar');
      expect(avatar).toHaveAttribute('src');
      expect(avatar.getAttribute('src')).toContain('gravatar.com/avatar/');
      expect(avatar.getAttribute('src')).toContain('d=identicon&s=50');
    });
    const [algo, dataArg] = mockDigest.mock.calls[0];
    expect(algo).toBe('SHA-256');
    expect(dataArg).toBeDefined();
    expect(dataArg.constructor.name).toBe('Uint8Array');
  });


  test('handles Gravatar generation error and uses fallback URL', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockDigest.mockRejectedValueOnce(new Error('Crypto API error'));
    const mockUser = { displayName: 'Test User', email: 'test@example.com' };
    
    render(
      <UserHeader 
        user={mockUser}
        onSignOut={mockOnSignOut}
        onSettings={mockOnSettings}
        onTrends={mockOnTrends}
      />
    );

    await waitFor(() => {
      const avatar = screen.getByAltText('Profile');
      expect(avatar).toBeInTheDocument();
      // Should use fallback URL with email directly
      expect(avatar.getAttribute('src')).toContain('gravatar.com/avatar/test@example.com');
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to generate Gravatar hash:', expect.any(Error));
    consoleWarnSpy.mockRestore();
  });

  test('Gravatar generator handles when email is empty', async () => {
    const mockUser = { displayName: 'Test User', email: '' };
    
    render(
      <UserHeader 
        user={mockUser}
        onSignOut={mockOnSignOut}
        onSettings={mockOnSettings}
        onTrends={mockOnTrends}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome, Test User')).toBeInTheDocument();
    });

    // Should not call digest for empty email
    expect(mockDigest).not.toHaveBeenCalled();
    expect(screen.queryByAltText('Profile')).not.toBeInTheDocument();
  });
})

