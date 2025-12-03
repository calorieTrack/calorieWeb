import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './EntryList.css';

function EntryList({ entries, onEdit, onDelete }) {
  const totalCalories = entries.reduce((sum, entry) => sum + (entry.calories || 0), 0);

  return (
    <div className="entries">
      <h2>Today's Entries</h2>
      {entries.length === 0 ? (
        <p>No entries yet</p>
      ) : (
        <ul>
          {entries.map((entry) => (
            <li key={entry.id}>
              <div className="entry-content">
                <div className="entry-left">
                  <strong className="entry-name">{entry.name}</strong>
                  <span className="entry-quantity">{entry.quantity}</span>
                </div>
                {(entry.protein != null || entry.fat != null || entry.carbs != null) && (
                  <div className="entry-macros">
                    {entry.protein != null && <span className="macro protein">🥩 {entry.protein}g</span>}
                    {entry.fat != null && <span className="macro fat">🧈 {entry.fat}g</span>}
                    {entry.carbs != null && <span className="macro carbs">🌾 {entry.carbs}g</span>}
                  </div>
                )}
                <span className="entry-calories">{entry.calories} cal</span>
                <div className="entry-actions">
                  <button className="edit-btn" onClick={() => onEdit(entry.id)}>
                    Edit
                  </button>
                  <button className="delete-btn" onClick={() => onDelete(entry.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="total">
        <span>Total: {totalCalories} calories</span>
      </div>
    </div>
  );
}

export default EntryList;
