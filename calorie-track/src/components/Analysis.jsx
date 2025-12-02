import React, { useMemo } from 'react';
import './Analysis.css';


function Analysis({ entries, calorieGoal = 2000 }) {
  const stats = useMemo(() => {
    const total = entries.reduce((sum, entry) => sum + entry.calories, 0);
    const goal = Number(calorieGoal) > 0 ? Number(calorieGoal) : 2000;
    const remaining = goal - total;
    const percentage = goal > 0 ? Math.round((total / goal) * 100) : 0;
    
    // Calculate actual macros from entries (no estimation fallback)
    let protein = 0;
    let fat = 0;
    let carbs = 0;

    for (const entry of entries) {
      if (entry.protein !== null && entry.protein !== undefined) {
        protein += entry.protein;
        fat += (entry.fat || 0);
        carbs += (entry.carbs || 0);
      }
    }
    
    return {
      total,
      remaining,
      percentage,
      protein: Math.round(protein * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      entryCount: entries.length,
      hasActualMacros: protein > 0 || fat > 0 || carbs > 0
    };
  }, [entries, calorieGoal]); // Recalculate when entries or goal changes

  const getStatusColor = (percentage) => {
    if (percentage < 80) return '#ffc107'; // Yellow - under goal
    if (percentage <= 110) return '#28a745'; // Green - on track
    return '#dc3545'; // Red - over goal
  };

  return (
    <div className="analysis-section">
      <h2>Daily Analysis</h2>
      
      <div className="stats-grid">
        {/* Calorie Summary */}
        <div className="stat-card calorie-card">
          <div className="stat-header">Total Calories</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-subtext">Goal: {Number(calorieGoal) || 2000}</div>
          
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{
                width: `${Math.min(stats.percentage, 100)}%`,
                backgroundColor: getStatusColor(stats.percentage)
              }}
            />
          </div>
          
          <div className="stat-footer">
            {stats.remaining > 0 ? (
              <span className="remaining-positive">{stats.remaining} cal remaining</span>
            ) : (
              <span className="remaining-negative">{Math.abs(stats.remaining)} cal over</span>
            )}
          </div>
        </div>

        {/* Macro Breakdown */}
        <div className="stat-card macro-card">
          <div className="stat-header">Macronutrients</div>
          <div className="macro-row">
            <div className="macro-item">
              <span className="macro-label">Protein</span>
              <span className="macro-value">{stats.protein}g</span>
            </div>
            <div className="macro-item">
              <span className="macro-label">Fat</span>
              <span className="macro-value">{stats.fat}g</span>
            </div>
            <div className="macro-item">
              <span className="macro-label">Carbs</span>
              <span className="macro-value">{stats.carbs}g</span>
            </div>
          </div>
          {!stats.hasActualMacros && stats.entryCount > 0 && (
            <div className="macro-note">*Add entries with USDA search or manual macro data for tracking</div>
          )}
          {stats.hasActualMacros && (
            <div className="macro-note">*Based on entered nutrition data</div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="stat-card quick-stats">
          <div className="stat-header">Quick Stats</div>
          <div className="quick-stat-row">
            <span>Entries Today:</span>
            <span className="stat-value-small">{stats.entryCount}</span>
          </div>
          <div className="quick-stat-row">
            <span>Goal Progress:</span>
            <span className="stat-value-small">{stats.percentage}%</span>
          </div>
          <div className="quick-stat-row">
            <span>Status:</span>
            <span className={`status-badge ${stats.percentage < 80 ? 'under' : stats.percentage <= 110 ? 'on-track' : 'over'}`}>
              {stats.percentage < 80 ? 'Under Goal' : stats.percentage <= 110 ? 'On Track' : 'Over Goal'}
            </span>
          </div>
        </div>
      </div>

      {entries.length === 0 && (
        <div className="empty-message">
          No entries for this day. Add your first entry to see analysis!
        </div>
      )}
    </div>
  );
}

export default Analysis;
