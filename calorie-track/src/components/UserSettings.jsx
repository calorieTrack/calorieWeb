import React, { useState, useEffect } from 'react';
import {
  updateProfile,
  updateEmail,
  updatePassword,
} from 'firebase/auth';
import { auth } from '../firebase';
import './UserSettings.css';

function UserSettings({ user, onClose, calorieGoal = 2000, onUpdateCalorieGoal }) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [email, setEmail] = useState(user.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [calorieGoalInput, setCalorieGoalInput] = useState(calorieGoal || '');

  useEffect(() => {
    setCalorieGoalInput(calorieGoal ?? '');
  }, [calorieGoal]);

  const handleUpdateDisplayName = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (displayName.trim()) {
        await updateProfile(user, { displayName: displayName.trim() });
        setMessage('Display name updated successfully!');
      }
    } catch (err) {
      setError('Failed to update display name: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (email.trim() && email !== user.email) {
        await updateEmail(user, email.trim());
        setMessage('Email updated successfully!');
      }
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        setError('Please sign out and sign in again before changing your email.');
      } else {
        setError('Failed to update email: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await updatePassword(user, newPassword);
      setMessage('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        setError('Please sign out and sign in again before changing your password.');
      } else {
        setError('Failed to update password: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCalorieGoalUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!onUpdateCalorieGoal) {
      setError('Calorie goal update is unavailable.');
      return;
    }

    const goalNumber = Number(calorieGoalInput);
    if (Number.isNaN(goalNumber) || goalNumber <= 0) {
      setError('Please enter a positive number.');
      return;
    }

    setLoading(true);

    try {
      await onUpdateCalorieGoal(goalNumber);
      setMessage('Calorie goal updated!');
    } catch (err) {
      setError(err.message || 'Failed to update calorie goal.');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setError('');
        setMessage('');
      }, 4000);
    }
  };

  return (
    <div className="user-settings-overlay">
      <div className="user-settings-modal">
        <div className="settings-header">
          <h2>User Settings</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {message && <div className="settings-message success">{message}</div>}
        {error && <div className="settings-message error">{error}</div>}

        <form className="settings-form">
          {/* Display Name Section */}
          <div className="settings-section">
            <h3>Display Name</h3>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter display name"
            />
            <button
              type="button"
              onClick={handleUpdateDisplayName}
              disabled={loading || !displayName.trim()}
            >
              Update Display Name
            </button>
          </div>

          {/* Email Section */}
          <div className="settings-section">
            <h3>Email</h3>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
            />
            <button
              type="button"
              onClick={handleUpdateEmail}
              disabled={loading || !email.trim() || email === user.email}
            >
              Update Email
            </button>
          </div>

          {/* Password Section */}
          <div className="settings-section">
            <h3>Change Password</h3>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 6 characters)"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
            <button
              type="button"
              onClick={handleUpdatePassword}
              disabled={loading || !newPassword.trim() || !confirmPassword.trim()}
            >
              Update Password
            </button>
          </div>

          {/* Calorie Goal Section */}
          <div className="settings-section">
            <h3>Daily Calorie Goal</h3>
              <input
                type="number"
                min="1"
                value={calorieGoalInput}
                onChange={(e) => setCalorieGoalInput(e.target.value)}
                placeholder="Enter daily calorie goal"
                className="calorie-goal-input"
              />
              <button
                type="submit"
                onClick={handleCalorieGoalUpdate}
                className="calorie-goal-button"
                disabled={loading || Number(calorieGoalInput) === Number(calorieGoal)}
              >
                Update Goal
              </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserSettings;
