import React, { useState, useEffect } from 'react';
import { getSummary } from '../api';
import './HistoricalTrends.css';

function HistoricalTrends() {
  const [dateRange, setDateRange] = useState(7); // Default to 7 days
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState('calories'); // calories, macros, or combined

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - dateRange + 1);

  const formatDate = (date) => date.toISOString().slice(0, 10);

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

    const maxCalories = Math.max(...summaryData.map(d => d.totalCalories), 2000);
    const maxMacro = Math.max(
      ...summaryData.map(d => Math.max(d.totalProtein, d.totalFat, d.totalCarbs)),
      100
    );

    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3>
            {chartType === 'calories' && 'Daily Calories'}
            {chartType === 'macros' && 'Daily Macronutrients'}
            {chartType === 'combined' && 'Daily Overview'}
          </h3>
          <div className="chart-controls">
            <button 
              className={chartType === 'calories' ? 'active' : ''}
              onClick={() => setChartType('calories')}
            >
              Calories
            </button>
            <button 
              className={chartType === 'macros' ? 'active' : ''}
              onClick={() => setChartType('macros')}
            >
              Macros
            </button>
            <button 
              className={chartType === 'combined' ? 'active' : ''}
              onClick={() => setChartType('combined')}
            >
              Combined
            </button>
          </div>
        </div>

        <div className="chart-area">
          {chartType === 'calories' && (
            <div className="bar-chart">
              {summaryData.map((day, index) => (
                <div key={day.date} className="chart-bar-container">
                  <div 
                    className="chart-bar calories-bar"
                    style={{
                      height: `${(day.totalCalories / maxCalories) * 200}px`,
                      backgroundColor: day.totalCalories > 2000 ? '#dc3545' : 
                                     day.totalCalories > 1600 ? '#28a745' : 
                                     day.totalCalories > 0 ? '#ffc107' : '#e9ecef'
                    }}
                    title={`${day.totalCalories} calories on ${day.date}`}
                  >
                    <span className="bar-value">{day.totalCalories}</span>
                  </div>
                  <div className="chart-label">
                    {new Date(day.date).getDate()}/{new Date(day.date).getMonth() + 1}
                  </div>
                </div>
              ))}
            </div>
          )}

          {chartType === 'macros' && (
            <div className="bar-chart">
              {summaryData.map((day, index) => (
                <div key={day.date} className="chart-bar-container">
                  <div className="stacked-bar">
                    <div 
                      className="bar-segment protein-bar"
                      style={{ height: `${(day.totalProtein / maxMacro) * 200}px` }}
                      title={`Protein: ${day.totalProtein}g`}
                    />
                    <div 
                      className="bar-segment fat-bar"
                      style={{ height: `${(day.totalFat / maxMacro) * 200}px` }}
                      title={`Fat: ${day.totalFat}g`}
                    />
                    <div 
                      className="bar-segment carbs-bar"
                      style={{ height: `${(day.totalCarbs / maxMacro) * 200}px` }}
                      title={`Carbs: ${day.totalCarbs}g`}
                    />
                  </div>
                  <div className="chart-label">
                    {new Date(day.date).getDate()}/{new Date(day.date).getMonth() + 1}
                  </div>
                </div>
              ))}
            </div>
          )}

          {chartType === 'combined' && (
            <div className="combined-chart">
              {summaryData.map((day, index) => (
                <div key={day.date} className="combined-bar-container">
                  <div className="combined-bar">
                    <div 
                      className="calories-line"
                      style={{
                        height: `${(day.totalCalories / maxCalories) * 200}px`,
                        backgroundColor: '#007bff'
                      }}
                      title={`${day.totalCalories} calories`}
                    />
                  </div>
                  <div className="macro-indicators">
                    <div className="macro-dot protein-dot" title={`P: ${day.totalProtein}g`} />
                    <div className="macro-dot fat-dot" title={`F: ${day.totalFat}g`} />
                    <div className="macro-dot carbs-dot" title={`C: ${day.totalCarbs}g`} />
                  </div>
                  <div className="chart-label">
                    {new Date(day.date).getDate()}/{new Date(day.date).getMonth() + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="chart-legend">
          {chartType === 'calories' && (
            <div className="legend-items">
              <span className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#28a745' }}></span>
                On Track (1600-2000 cal)
              </span>
              <span className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#ffc107' }}></span>
                Under Goal (&lt;1600 cal)
              </span>
              <span className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#dc3545' }}></span>
                Over Goal (&gt;2000 cal)
              </span>
            </div>
          )}
          {chartType === 'macros' && (
            <div className="legend-items">
              <span className="legend-item">
                <span className="legend-color protein-color"></span>
                Protein
              </span>
              <span className="legend-item">
                <span className="legend-color fat-color"></span>
                Fat
              </span>
              <span className="legend-item">
                <span className="legend-color carbs-color"></span>
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
    <div className="historical-trends">
      <div className="trends-header">
        <h2>📊 Historical Trends</h2>
        <div className="date-range-selector">
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
        <div className="loading-message">Loading trend data...</div>
      )}

      {!loading && summaryData.length > 0 && (
        <>
          {/* Summary Stats */}
          <div className="trend-summary">
            <div className="summary-stat">
              <span className="stat-label">Tracking Days</span>
              <span className="stat-value">{daysWithEntries}/{totalDays}</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Avg Calories</span>
              <span className="stat-value">{avgCalories}</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Avg Protein</span>
              <span className="stat-value">{avgProtein}g</span>
            </div>
          </div>

          {/* Chart */}
          {renderChart()}

          {/* Data Table */}
          <div className="trend-table">
            <h4>Detailed Data</h4>
            <div className="table-container">
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
        <div className="empty-message">
          No data available for the selected time period. Start tracking your meals to see trends!
        </div>
      )}
    </div>
  );
}

export default HistoricalTrends;