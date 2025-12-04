import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom'; 
import UserSettings from '../UserSettings';

jest.mock('../../config', () => ({
  firebaseConfig: {
    apiKey: "test-key",
    authDomain: "test-domain",
    projectId: "test-project",
  }
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ 
    currentUser: { email: 'alice@example.com', uid: 'test-uid' } 
  })),
  updateProfile: jest.fn(),
  updateEmail: jest.fn(),
  updatePassword: jest.fn(),
}));

import { updateProfile, updateEmail, updatePassword } from 'firebase/auth';

const mockUser = { displayName: 'Alice', email: 'alice@example.com' };

describe('UserSettings component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders initial values and close button triggers onClose', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    
    render(<UserSettings user={mockUser} onClose={onClose} />);

    expect(screen.getByPlaceholderText('Enter display name')).toHaveValue('Alice');
    expect(screen.getByPlaceholderText('Enter email')).toHaveValue('alice@example.com');

    await user.click(screen.getByRole('button', { name: /✕/i }));
    expect(onClose).toHaveBeenCalled();
  });

  test('updates display name successfully and shows success message', async () => {
    const user = userEvent.setup();
    updateProfile.mockResolvedValue();

    render(<UserSettings user={mockUser} onClose={() => {}} />);

    const input = screen.getByPlaceholderText('Enter display name');
    const btn = screen.getByRole('button', { name: /update display name/i });

    await user.clear(input);
    await user.type(input, 'Bob');
    await user.click(btn);

    await waitFor(() => expect(updateProfile).toHaveBeenCalledWith(mockUser, { displayName: 'Bob' }));
    expect(screen.getByText('Display name updated successfully!')).toBeInTheDocument();
  });

  test('shows specific error when email update requires recent login', async () => {
    const user = userEvent.setup();
    const err = { code: 'auth/requires-recent-login', message: 'recent login required' };
    updateEmail.mockRejectedValue(err);

    render(<UserSettings user={mockUser} onClose={() => {}} />);

    const input = screen.getByPlaceholderText('Enter email');
    
    await user.clear(input);
    await user.type(input, 'new@example.com');
    await user.click(screen.getByRole('button', { name: /update email/i }));

    await waitFor(() => expect(updateEmail).toHaveBeenCalledWith(mockUser, 'new@example.com'));
    expect(await screen.findByText(/Please sign out and sign in again/i)).toBeInTheDocument();
  });

  test('password mismatch shows error and does not call updatePassword', async () => {
    const user = userEvent.setup();
    render(<UserSettings user={mockUser} onClose={() => {}} />);

    await user.type(screen.getByPlaceholderText('New password (min 6 characters)'), 'pass1');
    await user.type(screen.getByPlaceholderText('Confirm new password'), 'pass2');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(updatePassword).not.toHaveBeenCalled();
  });
});