import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AuthForm from '../AuthForm';

describe('AuthForm component', () => {
  const mockOnSignIn = jest.fn();
  const mockOnSignUp = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders sign in form by default', () => {
    render(<AuthForm onSignIn={mockOnSignIn} onSignUp={mockOnSignUp} />);

    expect(screen.getByRole('heading', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Need an account\?/i })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Display Name/i)).not.toBeInTheDocument();
  });

  test('switches between sign in and sign up modes when toggle button is clicked', async () => {
    const user = userEvent.setup();
    render(<AuthForm onSignIn={mockOnSignIn} onSignUp={mockOnSignUp} />);

    // Switch to sign up
    await user.click(screen.getByRole('button', { name: /Need an account\?/i }));
    expect(screen.getByRole('heading', { name: /Sign Up/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Display Name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Already have an account\?/i })).toBeInTheDocument();

    // Switch back to sign in
    await user.click(screen.getByRole('button', { name: /Already have an account\?/i }));
    expect(screen.getByRole('heading', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Display Name/i)).not.toBeInTheDocument();
  });

  test('form inputs update correctly when user types', async () => {
    const user = userEvent.setup();
    render(<AuthForm onSignIn={mockOnSignIn} onSignUp={mockOnSignUp} />);

    const emailInput = screen.getByPlaceholderText(/Email/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'mypassword');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('mypassword');

    await user.click(screen.getByRole('button', { name: /Need an account\?/i }));

    const displayNameInput = screen.getByPlaceholderText(/Display Name/i);
    await user.type(displayNameInput, 'Jane Smith');

    expect(displayNameInput).toHaveValue('Jane Smith');
  });

  test('calls onSignIn with email and password when sign in form is submitted', async () => {
    const user = userEvent.setup();
    render(<AuthForm onSignIn={mockOnSignIn} onSignUp={mockOnSignUp} />);

    const emailInput = screen.getByPlaceholderText(/Email/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    const submitButton = screen.getByRole('button', { name: /Sign In/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(mockOnSignIn).toHaveBeenCalledTimes(1);
    expect(mockOnSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(mockOnSignUp).not.toHaveBeenCalled();
  });

  test('calls onSignUp with email, password, and displayName when sign up form is submitted', async () => {
    const user = userEvent.setup();
    render(<AuthForm onSignIn={mockOnSignIn} onSignUp={mockOnSignUp} />);

    // Switch to sign up mode
    await user.click(screen.getByRole('button', { name: /Need an account\?/i }));

    const emailInput = screen.getByPlaceholderText(/Email/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    const displayNameInput = screen.getByPlaceholderText(/Display Name/i);
    const submitButton = screen.getByRole('button', { name: /Sign Up/i });

    await user.type(emailInput, 'newuser@example.com');
    await user.type(passwordInput, 'securepass456');
    await user.type(displayNameInput, 'John Doe');
    await user.click(submitButton);

    expect(mockOnSignUp).toHaveBeenCalledTimes(1);
    expect(mockOnSignUp).toHaveBeenCalledWith('newuser@example.com', 'securepass456', 'John Doe');
    expect(mockOnSignIn).not.toHaveBeenCalled();
  });

  test('calls onSignUp with empty displayName when display name is not provided', async () => {
    const user = userEvent.setup();
    render(<AuthForm onSignIn={mockOnSignIn} onSignUp={mockOnSignUp} />);

    // Switch to sign up mode
    await user.click(screen.getByRole('button', { name: /Need an account\?/i }));

    const emailInput = screen.getByPlaceholderText(/Email/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    const submitButton = screen.getByRole('button', { name: /Sign Up/i });

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(mockOnSignUp).toHaveBeenCalledWith('user@example.com', 'password123', '');
  });

  test('email and password inputs are required', () => {
    render(<AuthForm onSignIn={mockOnSignIn} onSignUp={mockOnSignUp} />);

    const emailInput = screen.getByPlaceholderText(/Email/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);

    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  test('form state is preserved when switching between modes', async () => {
    const user = userEvent.setup();
    render(<AuthForm onSignIn={mockOnSignIn} onSignUp={mockOnSignUp} />);

    const emailInput = screen.getByPlaceholderText(/Email/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    // Switch to sign up
    await user.click(screen.getByRole('button', { name: /Need an account\?/i }));
    expect(screen.getByPlaceholderText(/Email/i)).toHaveValue('test@example.com');
    expect(screen.getByPlaceholderText(/Password/i)).toHaveValue('password123');

    // Switch back to sign in
    await user.click(screen.getByRole('button', { name: /Already have an account\?/i }));
    expect(screen.getByPlaceholderText(/Email/i)).toHaveValue('test@example.com');
    expect(screen.getByPlaceholderText(/Password/i)).toHaveValue('password123');
  });
});

