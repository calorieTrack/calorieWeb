import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import {
  getEntries,
  createEntry,
  updateEntry,
  deleteEntry,
  registerUser,
  getCalorieGoal,
  updateCalorieGoal,
} from './api';
import AuthForm from './components/AuthForm';
import EntryForm from './components/EntryForm';
import EditEntryForm from './components/EditEntryForm';
import EntryList from './components/EntryList';
import UserHeader from './components/UserHeader';
import UserSettings from './components/UserSettings';
import DateSelector from './components/DateSelector';
import Analysis from './components/Analysis';
import HistoricalTrends from './components/HistoricalTrends';
import AISuggestions from './components/AISuggestions';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [showAuth, setShowAuth] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showTrends, setShowTrends] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Load today's entries
        await loadEntries(selectedDate);
        // Optional: register user in local DB
        try {
          await registerUser(currentUser.displayName);
        } catch (err) {
          console.warn('User already registered or error:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Load entries when date changes
  useEffect(() => {
    if (user) {
      loadEntries(selectedDate);
    }
  }, [selectedDate, user]);

  // Handles updating the user's calorie goal
  const saveUserCalorieGoal = async (newGoal) => {
    const goalNumber = Number(newGoal);
    if (Number.isNaN(goalNumber) || goalNumber <= 0) {
      throw new Error('Calorie goal must be a positive number');
    }

    await updateCalorieGoal(goalNumber);
    setCalorieGoal(goalNumber);
  };
  
  // Load calorie goal when user changes
  useEffect(() => {
    if (!user) return;

    const loadCalorieGoal = async () => {
      try {
        const data = await getCalorieGoal();
        const goal = typeof data === 'object' && data !== null
          ? (data.calorieGoal ?? 2000)
          : (data ?? 2000);
        setCalorieGoal(Number(goal) || 2000);
      } catch (error) {
        console.error('Failed to load calorie goal:', error);
        setCalorieGoal(2000);
      }
    };

    loadCalorieGoal();
  }, [user]);

  // Load entries for selected date
  const loadEntries = async (date) => {
    try {
      const data = await getEntries(date);
      setEntries(data);
    } catch (error) {
      console.error('Failed to load entries:', error);
      alert('Failed to load entries: ' + error.message);
    }
  };

  // Sign up
  const handleSignUp = async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update user profile with displayName
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      setShowAuth(false);
    } catch (error) {
      alert('Sign up failed: ' + error.message);
    }
  };

  // Sign in
  const handleSignIn = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowAuth(false);
    } catch (error) {
      alert('Sign in failed: ' + error.message);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    await signOut(auth);
  };

  // Add or update entry
  const handleSaveEntry = async (name, quantity, calories, protein, fat, carbs, editId = null) => {
    try {
      if (editId) {
        await updateEntry(editId, { name, quantity, calories, protein, fat, carbs, date: selectedDate });
      } else {
        await createEntry({ name, quantity, calories, protein, fat, carbs, date: selectedDate });
      }
      await loadEntries(selectedDate);
      setEditingId(null);
    } catch (error) {
      alert('Failed to save entry: ' + error.message);
    }
  };

  // Delete entry
  const handleDeleteEntry = async (id) => {
    if (window.confirm('Delete this entry?')) {
      try {
        await deleteEntry(id);
        await loadEntries(selectedDate);
      } catch (error) {
        alert('Failed to delete entry: ' + error.message);
      }
    }
  };

  if (loading) return <div className="app">Loading...</div>;

  if (!user) {
    return (
      <div className="app">
        <h1>Calorie Track</h1>
        {!showAuth ? (
          <button onClick={() => setShowAuth(true)}>Sign In / Sign Up</button>
        ) : (
          <AuthForm onSignUp={handleSignUp} onSignIn={handleSignIn} />
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <h1 onClick={() => setShowTrends(false)}
        style={{ cursor: 'pointer'}}
        >Calorie Track</h1>
      <UserHeader 
        user={user} 
        onSignOut={handleSignOut} 
        onSettings={() => setShowSettings(true)} 
        onTrends={() => setShowTrends(!showTrends)}
      />

      {showSettings && (
        <UserSettings
          user={user}
          calorieGoal={calorieGoal}
          onUpdateCalorieGoal={saveUserCalorieGoal}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showTrends ? (
        <HistoricalTrends user={user} calorieGoal={calorieGoal} />
      ) : (
        <>
          <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />

          <Analysis entries={entries} calorieGoal={calorieGoal} />

          {editingId ? (
            <EditEntryForm
              entry={entries.find((e) => e.id === editingId)}
              onSave={handleSaveEntry}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div className="entry-form-ai-container">
              <div className="entry-form-wrapper">
                <EntryForm onAdd={handleSaveEntry} />
              </div>
              <div className="ai-suggestions-wrapper">
                <AISuggestions entries={entries} />
              </div>
            </div>
          )}
          <EntryList
            entries={entries}
            onEdit={setEditingId}
            onDelete={handleDeleteEntry}
          />
        </>
      )}
    </div>
  );
}

export default App;
