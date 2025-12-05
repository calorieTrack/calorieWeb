import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import DateSelector from '../DateSelector';

describe('DateSelector component', () => {
  const mockOnDateChange = jest.fn();
  const today = new Date().toISOString().slice(0, 10);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to get date string N days ago
  const getDateString = (daysAgo) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().slice(0, 10);
  };

  test('renders date selector with navigation buttons', () => {
    const { container } = render(<DateSelector selectedDate={today} onDateChange={mockOnDateChange} />);

    expect(screen.getByRole('button', { name: /← Previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next →/i })).toBeInTheDocument();
    const dateInput = container.querySelector('input[type="date"]');
    expect(dateInput).toBeInTheDocument();
  });

  test('date input value matches selectedDate', () => {
    const testDate = getDateString(10);
    const { container } = render(<DateSelector selectedDate={testDate} onDateChange={mockOnDateChange} />);

    const dateInput = container.querySelector('input[type="date"]');
    expect(dateInput).toHaveValue(testDate);
  });

  test('displays date on the screen', () => {
    const testDate = getDateString(5);
    render(<DateSelector selectedDate={testDate} onDateChange={mockOnDateChange} />);

    const dateText = screen.getByText(/,/); // Date format includes comma
    expect(dateText).toBeInTheDocument();
  });  

  test('Next button is disabled when selected date is today', () => {
    render(<DateSelector selectedDate={today} onDateChange={mockOnDateChange} />);

    const nextButton = screen.getByRole('button', { name: /Next →/i });
    expect(nextButton).toBeDisabled();
  });

  test('Next button is enabled when selected date is before today', () => {
    const testDate = getDateString(1);
    render(<DateSelector selectedDate={testDate} onDateChange={mockOnDateChange} />);

    const nextButton = screen.getByRole('button', { name: /Next →/i });
    expect(nextButton).not.toBeDisabled();
  });

  test('calls onDateChange with previous day when Previous button is clicked', async () => {
    const user = userEvent.setup();
    const testDate = getDateString(5);
    render(<DateSelector selectedDate={testDate} onDateChange={mockOnDateChange} />);

    const previousButton = screen.getByRole('button', { name: /← Previous/i });
    await user.click(previousButton);

    expect(mockOnDateChange).toHaveBeenCalledTimes(1);
    const expectedDate = getDateString(6);
    expect(mockOnDateChange).toHaveBeenCalledWith(expectedDate);
  });

  test('calls onDateChange with next day when Next button is clicked', async () => {
    const user = userEvent.setup();
    const testDate = getDateString(5);
    render(<DateSelector selectedDate={testDate} onDateChange={mockOnDateChange} />);

    const nextButton = screen.getByRole('button', { name: /Next →/i });
    await user.click(nextButton);

    expect(mockOnDateChange).toHaveBeenCalledTimes(1);
    const expectedDate = getDateString(4);
    expect(mockOnDateChange).toHaveBeenCalledWith(expectedDate);
  });

  test('does not call onDateChange when Next button is clicked on today', async () => {
    const user = userEvent.setup();
    render(<DateSelector selectedDate={today} onDateChange={mockOnDateChange} />);

    const nextButton = screen.getByRole('button', { name: /Next →/i });
    await user.click(nextButton);

    expect(mockOnDateChange).not.toHaveBeenCalled();
  });

  test('does not allow going beyond today when Next button is clicked', async () => {
    const user = userEvent.setup();
    const yesterday = getDateString(1);
    const { rerender } = render(<DateSelector selectedDate={yesterday} onDateChange={mockOnDateChange} />);

    const nextButton = screen.getByRole('button', { name: /Next →/i });
    await user.click(nextButton);

    expect(mockOnDateChange).toHaveBeenCalledWith(today);
    
    rerender(<DateSelector selectedDate={today} onDateChange={mockOnDateChange} />);
    const updatedNextButton = screen.getByRole('button', { name: /Next →/i });
    expect(updatedNextButton).toBeDisabled();
  });

  test('displays "Go to Today" button when date is not today', () => {
    const testDate = getDateString(3);
    render(<DateSelector selectedDate={testDate} onDateChange={mockOnDateChange} />);

    expect(screen.getByRole('button', { name: /Go to Today/i })).toBeInTheDocument();
  });

  test('does not display "Go to Today" button when date is today', () => {
    render(<DateSelector selectedDate={today} onDateChange={mockOnDateChange} />);

    expect(screen.queryByRole('button', { name: /Go to Today/i })).not.toBeInTheDocument();
  });

  test('calls onDateChange with today when "Go to Today" button is clicked', async () => {
    const user = userEvent.setup();
    const testDate = getDateString(3);
    render(<DateSelector selectedDate={testDate} onDateChange={mockOnDateChange} />);

    const todayButton = screen.getByRole('button', { name: /Go to Today/i });
    await user.click(todayButton);

    expect(mockOnDateChange).toHaveBeenCalledTimes(1);
    expect(mockOnDateChange).toHaveBeenCalledWith(today);
  });

  test('calls onDateChange when date input is changed directly', () => {
    const testDate = getDateString(5);
    const { container } = render(<DateSelector selectedDate={testDate} onDateChange={mockOnDateChange} />);

    const dateInput = container.querySelector('input[type="date"]');
    const newDate = getDateString(7);
    
    fireEvent.change(dateInput, { target: { value: newDate } });

    expect(mockOnDateChange).toHaveBeenCalledWith(newDate);
  });

  test('handles future date selection gracefully', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const futureDateString = futureDate.toISOString().slice(0, 10);
    
    render(<DateSelector selectedDate={futureDateString} onDateChange={mockOnDateChange} />);
    
    const nextButton = screen.getByRole('button', { name: /Next →/i });

    expect(nextButton).toBeDisabled();
    expect(screen.getByRole('button', { name: /Go to Today/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /← Previous/i })).toBeInTheDocument();
  });

  test('calls showPicker when date display is clicked', async () => {
    const user = userEvent.setup();
    const testDate = getDateString(5);
    const { container } = render(<DateSelector selectedDate={testDate} onDateChange={mockOnDateChange} />);

    // Mock showPicker method (it doesn't exist in jsdom)
    const dateInput = container.querySelector('input[type="date"]');
    if (dateInput) {
      dateInput.showPicker = jest.fn();
    }

    const dateDisplay = container.querySelector('.date-picker-wrapper');
    if (dateDisplay) {
      await user.click(dateDisplay);
      expect(dateInput?.showPicker).toHaveBeenCalledTimes(1);
    }
  });

  test('handles date navigation correctly across month boundaries', async () => {
    const user = userEvent.setup();
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    const firstDate = firstOfMonth.toISOString().slice(0, 10);

    render(<DateSelector selectedDate={firstDate} onDateChange={mockOnDateChange} />);

    const previousButton = screen.getByRole('button', { name: /← Previous/i });
    await user.click(previousButton);

    expect(mockOnDateChange).toHaveBeenCalledTimes(1);

    const expectedDate = new Date(firstOfMonth);
    expectedDate.setDate(0);
    expect(mockOnDateChange).toHaveBeenCalledWith(expectedDate.toISOString().slice(0, 10));
  });

  test('handles rapid navigation clicks correctly', async () => {
    const user = userEvent.setup();
    const testDate = getDateString(5);
    render(<DateSelector selectedDate={testDate} onDateChange={mockOnDateChange} />);

    const previousButton = screen.getByRole('button', { name: /← Previous/i });
    const nextButton = screen.getByRole('button', { name: /Next →/i });

    await user.click(previousButton);
    await user.click(previousButton);
    await user.click(nextButton);

    expect(mockOnDateChange).toHaveBeenCalledTimes(3);
  });
});

