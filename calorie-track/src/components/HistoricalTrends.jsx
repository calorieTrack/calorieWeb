import React, { useState, useEffect } from 'react';
import { getSummary } from '../api';
import styles from './HistoricalTrends.module.css';

function HistoricalTrends({ calorieGoal }) {
  const [dateRange, setDateRange] = useState(7); // Default to 7 days
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState('calories'); // calories or macros

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - dateRange + 1);
  const formatDate = (date) => date.toISOString().slice(0, 10);

  const formatDateLabel = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return `${day}/${month}`;
  };

  useEffect(() => {
    loadTrendData();
  }, [dateRange]);

  const loadTrendData = async () => {
    setLoading(true);
    try {
      const data = await getSummary(formatDate(startDate), formatDate(endDate));
      
      // Create a complete date range with missing days filled as 0
      const dateMap = new Map();
      data.forEach(item => {
        dateMap.set(item.date, {
          date: item.date,
          totalCalories: item.totalCalories || 0,
          totalProtein: item.totalProtein || 0,
          totalFat: item.totalFat || 0,
          totalCarbs: item.totalCarbs || 0,
          entryCount: item.entryCount || 0
        });
      });

      // Fill missing dates
      const completeData = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = formatDate(d);
        if (dateMap.has(dateStr)) {
          completeData.push(dateMap.get(dateStr));
        } else {
          completeData.push({
            date: dateStr,
            totalCalories: 0,
            totalProtein: 0,
            totalFat: 0,
            totalCarbs: 0,
            entryCount: 0
          });
        }
      }

      setSummaryData(completeData);
    } catch (error) {
      console.error('Failed to load trend data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Simple bar chart implementation
  const renderChart = () => {
    if (summaryData.length === 0) return null;

    const maxCalories = Math.max(...summaryData.map(d => d.totalCalories), calorieGoal);
    const maxMacro = Math.max(
      ...summaryData.map(d => Math.max(d.totalProtein, d.totalFat, d.totalCarbs)),
      100
    );

    return (
      <div className={styles.chartContainer}>
        <div className={styles.chartHeader}>
          <h3>
            {chartType === 'calories' && 'Daily Calories'}
            {chartType === 'macros' && 'Daily Macronutrients'}
          </h3>
          <div className={styles.chartControls}>
            <button 
              className={chartType === 'calories' ? styles.active : ''}
              onClick={() => setChartType('calories')}
            >
              Calories
            </button>
            <button 
              className={chartType === 'macros' ? styles.active : ''}
              onClick={() => setChartType('macros')}
            >
              Macros
            </button>
            <button 
              className={chartType === 'combined' ? styles.active : ''}
              onClick={() => setChartType('combined')}
            >
              Combined
            </button>
          </div>
        </div>

        <div className={styles.chartArea}>
          {chartType === 'calories' && (
            <div className={styles.barChart}>
              {summaryData.map((day) => (
                <div key={day.date} className={styles.chartBarContainer}>
                  <div 
                    className={`${styles.chartBar} ${styles.caloriesBar}`}
                    style={{
                      height: `${(day.totalCalories / maxCalories) * 200}px`,
                      backgroundColor: day.totalCalories > calorieGoal ? '#dc3545' : 
                                     day.totalCalories > ((calorieGoal * 3) / 4) ? '#28a745' : 
                                     day.totalCalories > 0 ? '#ffc107' : '#e9ecef'
                    }}
                    title={`${day.totalCalories} calories on ${day.date}`}
                  >
                    <span className={styles.barValue}>{day.totalCalories}</span>
                  </div>
                  <div className={styles.chartLabel}>
                    {formatDateLabel(day.date)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {chartType === 'macros' && (
            <div className={styles.barChart}>
              {summaryData.map((day) => (
                <div key={day.date} className={styles.chartBarContainer}>
                  <div className={styles.stackedBar}>
                    <div 
                      className={`${styles.barSegment} ${styles.proteinBar}`}
                      style={{ height: `${(day.totalProtein / maxMacro) * 200}px` }}
                      title={`Protein: ${day.totalProtein}g`}
                    />
                    <div 
                      className={`${styles.barSegment} ${styles.fatBar}`}
                      style={{ height: `${(day.totalFat / maxMacro) * 200}px` }}
                      title={`Fat: ${day.totalFat}g`}
                    />
                    <div 
                      className={`${styles.barSegment} ${styles.carbsBar}`}
                      style={{ height: `${(day.totalCarbs / maxMacro) * 200}px` }}
                      title={`Carbs: ${day.totalCarbs}g`}
                    />
                  </div>
                  <div className={styles.chartLabel}>
                    {formatDateLabel(day.date)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {chartType === 'combined' && (
            <div className={styles.combinedChart}>
              {summaryData.map((day, index) => (
                <div key={day.date} className={styles.combinedBarContainer}>
                  <div className={styles.combinedBar}>
                    <div 
                      className={styles.caloriesLine}
                      style={{
                        height: `${(day.totalCalories / maxCalories) * 200}px`,
                        backgroundColor: '#007bff'
                      }}
                      title={`${day.totalCalories} calories`}
                    />
                  </div>
                  <div className={styles.macroIndicators}>
                    <div className={`${styles.macroDot} ${styles.proteinDot}`} title={`P: ${day.totalProtein}g`} />
                    <div className={`${styles.macroDot} ${styles.fatDot}`} title={`F: ${day.totalFat}g`} />
                    <div className={`${styles.macroDot} ${styles.carbsDot}`} title={`C: ${day.totalCarbs}g`} />
                  </div>
                  <div className={styles.chartLabel}>
                    {new Date(day.date).getDate()}/{new Date(day.date).getMonth() + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className={styles.chartLegend}>
          {chartType === 'calories' && (
            <div className={styles.legendItems}>
              <span className={styles.legendItem}>
                <span className={styles.legendColor} style={{ backgroundColor: '#28a745' }}></span>
                On Track
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendColor} style={{ backgroundColor: '#ffc107' }}></span>
                Under Goal (&lt;75% of goal)
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendColor} style={{ backgroundColor: '#dc3545' }}></span>
                Over Goal (&gt;{calorieGoal} cal)
              </span>
            </div>
          )}
          {chartType === 'macros' && (
            <div className={styles.legendItems}>
              <span className={styles.legendItem}>
                <span className={`${styles.legendColor} ${styles.proteinColor}`}></span>
                Protein
              </span>
              <span className={styles.legendItem}>
                <span className={`${styles.legendColor} ${styles.fatColor}`}></span>
                Fat
              </span>
              <span className={styles.legendItem}>
                <span className={`${styles.legendColor} ${styles.carbsColor}`}></span>
                Carbs
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Calculate summary stats
  const totalDays = summaryData.length;
  const daysWithEntries = summaryData.filter(d => d.entryCount > 0).length;
  const avgCalories = totalDays > 0 ? 
    Math.round(summaryData.reduce((sum, d) => sum + d.totalCalories, 0) / totalDays) : 0;
  const avgProtein = totalDays > 0 ? 
    Math.round((summaryData.reduce((sum, d) => sum + d.totalProtein, 0) / totalDays) * 10) / 10 : 0;

  return (
    <div className={styles.historicalTrends}>
      <div className={styles.trendsHeader}>
        <h2>📊 Historical Trends</h2>
        <div className={styles.dateRangeSelector}>
          <label htmlFor="dateRange">Time Period:</label>
          <select 
            id="dateRange"
            value={dateRange} 
            onChange={(e) => setDateRange(Number(e.target.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 2 weeks</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 2 months</option>
            <option value={90}>Last 3 months</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className={styles.loadingMessage}>Loading trend data...</div>
      )}

      {!loading && summaryData.length > 0 && (
        <>
          {/* Summary Stats */}
          <div className={styles.trendSummary}>
            <div className={styles.summaryStat}>
              <span className={styles.statLabel}>Tracking Days</span>
              <span className={styles.statValue}>{daysWithEntries}/{totalDays}</span>
            </div>
            <div className={styles.summaryStat}>
              <span className={styles.statLabel}>Avg Calories</span>
              <span className={styles.statValue}>{avgCalories}</span>
            </div>
            <div className={styles.summaryStat}>
              <span className={styles.statLabel}>Avg Protein</span>
              <span className={styles.statValue}>{avgProtein}g</span>
            </div>
          </div>

          {/* Chart */}
          {renderChart()}

          {/* Data Table */}
          <div className={styles.trendTable}>
            <h4>Detailed Data</h4>
            <div className={styles.tableContainer}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Calories</th>
                    <th>Protein</th>
                    <th>Fat</th>
                    <th>Carbs</th>
                    <th>Entries</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData.reverse().map(day => (
                    <tr key={day.date}>
                      <td>{new Date(day.date).toLocaleDateString()}</td>
                      <td>{day.totalCalories}</td>
                      <td>{day.totalProtein}g</td>
                      <td>{day.totalFat}g</td>
                      <td>{day.totalCarbs}g</td>
                      <td>{day.entryCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!loading && summaryData.length === 0 && (
        <div className={styles.emptyMessage}>
          No data available for the selected time period. Start tracking your meals to see trends!
        </div>
      )}
    </div>
  );
}

export default HistoricalTrends;