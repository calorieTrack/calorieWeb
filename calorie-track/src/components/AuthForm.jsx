import React, { useState } from 'react';
import './AuthForm.css';

function AuthForm({ onSignUp, onSignIn, onResetPassword, showForgotPassword }) {
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    
    try {
      if (mode === 'signin') {
        const result = await onSignIn(email, password);
        if (!result?.success) {
          setError(result?.error || 'Sign in failed');
        }
      } else {
        await onSignUp(email, password, displayName);
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    
    if (!email) {
      setError('Please enter your email to reset your password.');
      return;
    }
    
    try {
      await onResetPassword?.(email);
      setInfo('Password reset email sent. Check your inbox.');
    } catch (err) {
      setError(err.message || 'Failed to send reset email.');
    }
  };

  return (
    <div className="auth-form">
      <h2>{mode === 'signin' ? 'Sign In' : 'Sign Up'}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="error">{error}</p>}
        {info && <p className="info">{info}</p>}
        {mode === 'signin' && showForgotPassword && onResetPassword && (
          <button type="button" className="link-button" onClick={handleForgotPassword}>
            Forgot password?
          </button>
        )}
        {mode === 'signup' && (
          <input
            type="text"
            placeholder="Display Name (optional)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        )}
        <button type="submit">{mode === 'signin' ? 'Sign In' : 'Sign Up'}</button>
      </form>
      <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        {mode === 'signin' ? 'Need an account?' : 'Already have an account?'}
      </button>
    </div>
  );
}

export default AuthForm;
