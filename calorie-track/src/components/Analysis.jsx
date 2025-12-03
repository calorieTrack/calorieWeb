import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './Analysis.module.css';

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

  const [hoveredSlice, setHoveredSlice] = useState(null);

  return (
    <div className={styles.container}>
      <h2>Daily Analysis</h2>
      
      <div className={styles.statsGrid}>
        {/* Calorie Summary */}
        <div className={`${styles.statCard} ${styles.calorieCard}`}>
          <div className={styles.statHeader}>Total Calories</div>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statSubtext}>Goal: {CALORIE_GOAL}</div>
          
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              data-testid="progress-fill"
              style={{
                width: `${Math.min(stats.percentage, 100)}%`,
                backgroundColor: getStatusColor(stats.percentage)
              }}
            />
          </div>
          
          <div className={styles.statFooter}>
            {stats.remaining > 0 ? (
              <span className={styles.remainingPositive}>{stats.remaining} cal remaining</span>
            ) : (
              <span className={styles.remainingNegative}>{Math.abs(stats.remaining)} cal over</span>
            )}
          </div>
        </div>

        {/* Macro Breakdown */}
        <div className={`${styles.statCard} ${styles.macroCard}`}>
          <div className={styles.statHeader}>Macronutrients</div>
          <div className={styles.macroContent}>
            {stats.hasActualMacros && stats.chartData.length > 0 && (
              <div className={styles.macronutrientChartContainer}>
                <ResponsiveContainer width="100%" aspect={1.0}>
                  <PieChart>
                    <Pie
                      data={stats.chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                        {stats.chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            onMouseEnter={() => setHoveredSlice(entry.name)}
                            onMouseLeave={() => setHoveredSlice(null)}
                          />
                        ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => `${value}g`}
                      contentStyle={{ backgroundColor: '#333', borderColor: '#555', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className={styles.macroItemsWrapper}>
              {['Protein', 'Fat', 'Carbs'].map((name) => {
                const isHighlighted = hoveredSlice === name;
                return (
                  <div key={name} className={`${styles.macroItem} ${isHighlighted ? styles.highlight : ''}`}>
                    <span className={styles.macroLabel}>{name}</span>
                    <span className={styles.macroValue}>{stats[name.toLowerCase()]}g</span>
                  </div>
                );
              })}
            </div>
          </div>
          {!stats.hasActualMacros && stats.entryCount > 0 && (
            <div className={styles.macroNote}>*Add entries with USDA search or manual macro data for tracking</div>
          )}
          {stats.hasActualMacros && (
            <div className={styles.macroNote}>*Based on entered nutrition data</div>
          )}
        </div>

        {/* Quick Stats */}
        <div className={`${styles.statCard} ${styles.quickStats}`}>
          <div className={styles.statHeader}>Quick Stats</div>
          <div className={styles.quickStatRow}>
            <span>Entries Today:</span>
            <span className={styles.statValueSmall} data-testid="quick-entry-count">{stats.entryCount}</span>
          </div>
          <div className={styles.quickStatRow}>
            <span>Goal Progress:</span>
            <span className={styles.statValueSmall}>{stats.percentage}%</span>
          </div>
          <div className={styles.quickStatRow}>
            <span>Status:</span>
            <span 
              className={`${styles.statusBadge} ${stats.percentage < 80 ? styles.under : stats.percentage <= 110 ? styles.onTrack : styles.over}`}
              data-testid="status-badge"
            >
              {stats.percentage < 80 ? 'Under Goal' : stats.percentage <= 110 ? 'On Track' : 'Over Goal'}
            </span>
          </div>
        </div>
      </div>

      {entries.length === 0 && (
        <div className={styles.emptyMessage}>
          No entries for this day. Add your first entry to see analysis!
        </div>
      )}
    </div>
  );
}

export default Analysis;
