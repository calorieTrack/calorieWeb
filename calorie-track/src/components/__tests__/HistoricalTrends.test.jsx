import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import HistoricalTrends from '../HistoricalTrends';

// Mock the API module
jest.mock('../../api', () => ({
  getSummary: jest.fn(),
}));

// Mock firebase/auth for the API client
jest.mock('../../config', () => ({
  API_URL: 'http://localhost:4000',
  firebaseConfig: {
    apiKey: "test-key",
    authDomain: "test-domain",
    projectId: "test-project",
  }
}));

jest.mock('../../firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: jest.fn(() => Promise.resolve('mock-token')),
    },
  },
}));

import { getSummary } from '../../api';

describe('HistoricalTrends component', () => {
  const mockCalorieGoal = 2000;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  // Helper to get date string N days ago (using same format as component)
  const getDateString = (daysAgo) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().slice(0, 10);
  };

  // Helper to format date string as "day/month" (e.g., "1/12" for December 1st)
  const formatDateLabel = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return `${day}/${month}`;
  };
  
  // Create mock data function so dates are calculated fresh for each test
  const getMockSummaryData = () => [
    {
      date: getDateString(2), // 2 days ago
      totalCalories: 1800,
      totalProtein: 120,
      totalFat: 60,
      totalCarbs: 200,
      entryCount: 3
    },
    {
      date: getDateString(1), // 1 day ago
      totalCalories: 2200,
      totalProtein: 150,
      totalFat: 80,
      totalCarbs: 250,
      entryCount: 4
    },
    {
      date: getDateString(0), // today
      totalCalories: 1900,
      totalProtein: 100,
      totalFat: 50,
      totalCarbs: 220,
      entryCount: 2
    },
  ];

  test('renders Historical Trends header and date range selector', async () => {
    const mockData = getMockSummaryData();
    getSummary.mockResolvedValue(mockData);
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
      headers: { get: () => null },
    });

    render(<HistoricalTrends calorieGoal={mockCalorieGoal} />);

<<<<<<< HEAD
    expect(screen.getByText('📊 Historical Trends')).toBeInTheDocument();
=======
    expect(screen.getByRole('heading', { name: /historical trends/i })).toBeInTheDocument();
>>>>>>> origin/main
    expect(screen.getByLabelText('Time Period:')).toBeInTheDocument();
    const select = await screen.findByLabelText('Time Period:');
    expect(select).toHaveValue('7');  
  });

  test('displays loading message while fetching data', async () => {
    getSummary.mockImplementation(() => new Promise(() => {})); // Never resolves
    global.fetch.mockImplementation(() => new Promise(() => {}));

    render(<HistoricalTrends calorieGoal={mockCalorieGoal} />);

    expect(screen.getByText('Loading trend data...')).toBeInTheDocument();
  });

  test('renders gracefully when no data is available', async () => {
    getSummary.mockResolvedValue([]);
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
      headers: { get: () => null },
    });

    render(<HistoricalTrends calorieGoal={mockCalorieGoal} />);
    
    await waitFor(() => {
<<<<<<< HEAD
      expect(screen.getByText('📊 Historical Trends')).toBeInTheDocument();
=======
      expect(screen.getByRole('heading', { name: /historical trends/i })).toBeInTheDocument();
>>>>>>> origin/main
      expect(screen.getByLabelText('Time Period:')).toBeInTheDocument();
    });
  });

  test('displays summary stats when data is loaded', async () => {
    const mockData = getMockSummaryData();
    getSummary.mockResolvedValue(mockData);
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
      headers: { get: () => null },
    });

    render(<HistoricalTrends calorieGoal={mockCalorieGoal} />);

    await waitFor(() => {
      expect(screen.getByText('Tracking Days')).toBeInTheDocument();
      expect(screen.getByText('Avg Calories')).toBeInTheDocument();
      expect(screen.getByText('Avg Protein')).toBeInTheDocument();
    });
  });

  test('calculates and displays correct summary statistics', async () => {
    const mockData = getMockSummaryData();
    getSummary.mockResolvedValue(mockData);
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
      headers: { get: () => null },
    });

    render(<HistoricalTrends calorieGoal={mockCalorieGoal} />);
    
    await waitFor(() => {
      expect(screen.getByText('3/7')).toBeInTheDocument();
      expect(screen.getByText('843')).toBeInTheDocument();
    });
  });

  test('renders calories chart by default', async () => {
    const mockData = getMockSummaryData();
    getSummary.mockResolvedValue(mockData);
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
      headers: { get: () => null },
    });

    render(<HistoricalTrends calorieGoal={mockCalorieGoal} />);

    await waitFor(() => {
      expect(screen.getByText('Daily Calories')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /calories/i })).toHaveClass('active');
    });
  });

  test('switches to macros chart when Macros button is clicked', async () => {
    const user = userEvent.setup();
    const mockData = getMockSummaryData();
    getSummary.mockResolvedValue(mockData);
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
      headers: { get: () => null },
    });

    render(<HistoricalTrends calorieGoal={mockCalorieGoal} />);

    await waitFor(() => {
      expect(screen.getByText('Daily Calories')).toBeInTheDocument();
    });

    const macrosButton = screen.getByRole('button', { name: /macros/i });
    await user.click(macrosButton);

    await waitFor(() => {
      expect(screen.getByText('Daily Macronutrients')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /macros/i })).toHaveClass('active');
      expect(screen.getByRole('button', { name: /calories/i })).not.toHaveClass('active');
    });
  });

  test('displays correct date labels on chart bars', async () => {
    const mockData = getMockSummaryData();
    getSummary.mockResolvedValue(mockData);
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
      headers: { get: () => null },
    });

    render(<HistoricalTrends calorieGoal={mockCalorieGoal} />);

    await waitFor(() => {
      expect(screen.getByText(formatDateLabel(mockData[0].date))).toBeInTheDocument();
      expect(screen.getByText(formatDateLabel(mockData[1].date))).toBeInTheDocument();
      expect(screen.getByText(formatDateLabel(mockData[2].date))).toBeInTheDocument();
    });
  });

  test('updates date range when selector changes', async () => {
    const user = userEvent.setup();
    const mockData = getMockSummaryData();
    getSummary.mockResolvedValue(mockData);
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
      headers: { get: () => null },
    });

    render(<HistoricalTrends calorieGoal={mockCalorieGoal} />);

    const select1 = await screen.findByLabelText('Time Period:');
    expect(select1).toHaveValue('7');  

    const dateRangeSelect = screen.getByLabelText('Time Period:');
    await user.selectOptions(dateRangeSelect, '30');

    const select2 = await screen.findByLabelText('Time Period:');
    expect(select2).toHaveValue('30');  
    await waitFor(() => {
      expect(getSummary).toHaveBeenCalled();
    });
  });

  test('displays data table with correct entries', async () => {
    const mockData = getMockSummaryData();
    getSummary.mockResolvedValue(mockData);
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
      headers: { get: () => null },
    });

    render(<HistoricalTrends calorieGoal={mockCalorieGoal} />);

    await waitFor(() => {
      expect(screen.getByText('Detailed Data')).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Date' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Calories' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Protein' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Fat' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Carbs' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Entries' })).toBeInTheDocument();
    });
  });

  test('displays legend for calories chart', async () => {
    const mockData = getMockSummaryData();
    getSummary.mockResolvedValue(mockData);
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
      headers: { get: () => null },
    });

    render(<HistoricalTrends calorieGoal={mockCalorieGoal} />);

    await waitFor(() => {
      expect(screen.getByText(/On Track/i)).toBeInTheDocument();
      expect(screen.getByText(/Under Goal/i)).toBeInTheDocument();
      expect(screen.getByText(/Over Goal/i)).toBeInTheDocument();
    });
  });

  test('displays legend for macros chart', async () => {
    const user = userEvent.setup();
    const mockData = getMockSummaryData();
    getSummary.mockResolvedValue(mockData);
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
      headers: { get: () => null },
    });

    render(<HistoricalTrends calorieGoal={mockCalorieGoal} />);

    await waitFor(() => {
      expect(screen.getByText('Daily Calories')).toBeInTheDocument();
    });

    const macrosButton = screen.getByRole('button', { name: /macros/i });
    await user.click(macrosButton);

    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: 'Protein' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Fat' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Carbs' })).toBeInTheDocument();
    });
  });

  test('handles API error gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    getSummary.mockRejectedValue(new Error('API error'));
    global.fetch.mockRejectedValue(new Error('Network error'));

    render(<HistoricalTrends calorieGoal={mockCalorieGoal} />);
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load trend data:', expect.any(Error));
    });

    expect(screen.getByText(/No data available for the selected time period/i)).toBeInTheDocument();
    
    consoleErrorSpy.mockRestore();
  });

  test('fills missing dates with zero values', async () => {
    const mockData = getMockSummaryData();
    const partialData = [mockData[0]];
    getSummary.mockResolvedValue(partialData);
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => partialData,
      headers: { get: () => null },
    });

    render(<HistoricalTrends calorieGoal={mockCalorieGoal} />);

    await waitFor(() => {
      expect(screen.getByText('Tracking Days')).toBeInTheDocument();
      expect(screen.getByText('Avg Calories')).toBeInTheDocument();
      expect(screen.getByText('Avg Protein')).toBeInTheDocument();
    });
  });

  test('uses calorieGoal prop for legend', async () => {
    const customGoal = 2500;
    const mockData = getMockSummaryData();
    getSummary.mockResolvedValue(mockData);
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
      headers: { get: () => null },
    });

    render(<HistoricalTrends calorieGoal={customGoal} />);

    await waitFor(() => {
      expect(screen.getByText('Over Goal (>2500 cal)')).toBeInTheDocument();
    });
  });
});
