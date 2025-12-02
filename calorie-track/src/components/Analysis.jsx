import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Analysis.css';

function Analysis({ entries }) {
  const CALORIE_GOAL = 2000; // Default daily goal
  
  const stats = useMemo(() => {
    const total = entries.reduce((sum, entry) => sum + entry.calories, 0);
    const remaining = CALORIE_GOAL - total;
    const percentage = Math.round((total / CALORIE_GOAL) * 100);
    
    // Calculate actual macros from entries (no estimation fallback)
    let protein = 0;
    let fat = 0;
    let carbs = 0;

    for (const entry of entries) {
      protein += (entry.protein || 0);
      fat += (entry.fat || 0);
      carbs += (entry.carbs || 0);
    }
    
    // Prepare chart data based on existing color scheme
    const chartData = [
      { 
        name: 'Protein', 
        value: Math.round(protein * 10) / 10, 
        color: 'rgba(255, 107, 107, 0.8)' 
      },
      { 
        name: 'Fat', 
        value: Math.round(fat * 10) / 10, 
        color: 'rgba(255, 217, 61, 0.8)' 
      },
      { 
        name: 'Carbs', 
        value: Math.round(carbs * 10) / 10, 
        color: 'rgba(107, 207, 127, 0.8)' 
      }
    ].filter(item => item.value > 0);
    
    return {
      total,
      remaining,
      percentage,
      protein: Math.round(protein * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      entryCount: entries.length,
      hasActualMacros: protein > 0 || fat > 0 || carbs > 0,
      chartData
    };
  }, [entries]);

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
          <div className="stat-subtext">Goal: {CALORIE_GOAL}</div>
          
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
          {stats.hasActualMacros && stats.chartData.length > 0 && (
            <div className="macronutrient-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {stats.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `${value}g`}
                    contentStyle={{ backgroundColor: '#333', borderColor: '#555', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
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
