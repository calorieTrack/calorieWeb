import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import EditEntryForm from '../EditEntryForm';

import { getFoodSuggestions } from '../../api';

jest.mock('../../api', () => ({
  getFoodSuggestions: jest.fn(),
}));

describe('EditEntryForm component', () => {
  const sampleEntry = {
    id: 'abc123',
    name: 'Toast',
    quantity: '1 slice',
    calories: 80,
    protein: 3,
    fat: 1,
    carbs: 14,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test('renders initial values and buttons', () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();
    render(<EditEntryForm entry={sampleEntry} onSave={onSave} onCancel={onCancel} />);

    expect(screen.getByRole('heading', { name: /Edit Entry/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Food Name/i)).toHaveValue('Toast');
    expect(screen.getByLabelText(/Quantity/i)).toHaveValue('1 slice');
    expect(screen.getByLabelText(/Calories/i)).toHaveValue(80);
    expect(screen.getByLabelText(/Protein/i)).toHaveValue(3);
    expect(screen.getByLabelText(/Fat/i)).toHaveValue(1);
    expect(screen.getByLabelText(/Carbs/i)).toHaveValue(14);

    expect(screen.getByRole('button', { name: /Update Entry/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  test('submits changed name and parsed numeric values via onSave', async () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();
    render(<EditEntryForm entry={sampleEntry} onSave={onSave} onCancel={onCancel} />);

    const nameInput = screen.getByLabelText(/Food Name/i);
    const caloriesInput = screen.getByLabelText(/Calories/i);
    const proteinInput = screen.getByLabelText(/Protein/i);
    const fatInput = screen.getByLabelText(/Fat/i);
    const carbsInput = screen.getByLabelText(/Carbs/i);

    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, '  Peanut Butter  ');
    await userEvent.clear(caloriesInput);
    await userEvent.type(caloriesInput, '200');
    await userEvent.clear(proteinInput);
    await userEvent.type(proteinInput, '8.5');
    await userEvent.clear(fatInput);
    await userEvent.type(fatInput, '16.2');
    await userEvent.clear(carbsInput);
    await userEvent.type(carbsInput, '6.0');

    await userEvent.click(screen.getByRole('button', { name: /Update Entry/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));

    expect(onSave).toHaveBeenCalledWith(
      'Peanut Butter',
      sampleEntry.quantity,
      200,
      8.5,
      16.2,
      6.0,
      sampleEntry.id
    );
  });

  test('cancel button calls onCancel and not onSave', async () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();
    render(<EditEntryForm entry={sampleEntry} onSave={onSave} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });

  test('save button calls onSave and not onCancel', async () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();
    render(<EditEntryForm entry={sampleEntry} onSave={onSave} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole('button', { name: /Update Entry/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  test('fetches suggestions after debounce and selecting a suggestion populates fields', async () => {
    jest.useFakeTimers();

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const suggestion = {
      name: 'Almond',
      calories: 7,
      protein: 0.25,
      fat: 0.6,
      carbs: 0.2,
    };

    getFoodSuggestions.mockResolvedValue([suggestion]);

    render(<EditEntryForm entry={sampleEntry} onSave={jest.fn()} onCancel={jest.fn()} />);

    const nameInput = screen.getByLabelText(/Food Name/i);

    await user.clear(nameInput);
    await user.type(nameInput, 'Al');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => expect(getFoodSuggestions).toHaveBeenCalledWith('Al', 5));
    expect(await screen.findByText(/Almond/)).toBeInTheDocument();

    await user.click(screen.getByText(/Almond/));

    expect(screen.getByLabelText(/Food Name/i)).toHaveValue('Almond');
    expect(screen.getByLabelText(/Calories/i)).toHaveValue(7);
    expect(screen.getByLabelText(/Protein/i)).toHaveValue(0.25);
    expect(screen.getByLabelText(/Fat/i)).toHaveValue(0.6);
    expect(screen.getByLabelText(/Carbs/i)).toHaveValue(0.2);

    jest.useRealTimers();
  });

  test('does not call onSave if required fields are empty', async () => {
    const onSave = jest.fn();
    render(<EditEntryForm entry={sampleEntry} onSave={onSave} onCancel={jest.fn()} />);

    const nameInput = screen.getByLabelText(/Food Name/i);
    const caloriesInput = screen.getByLabelText(/Calories/i);
    const proteinInput = screen.getByLabelText(/Protein/i);
    const fatInput = screen.getByLabelText(/Fat/i);
    const carbsInput = screen.getByLabelText(/Carbs/i);

    await userEvent.clear(nameInput);
    await userEvent.click(screen.getByRole('button', { name: /Update Entry/i }));
    expect(onSave).not.toHaveBeenCalled();

    await userEvent.type(nameInput, 'Toast');
    await userEvent.clear(caloriesInput);
    await userEvent.click(screen.getByRole('button', { name: /Update Entry/i }));
    expect(onSave).not.toHaveBeenCalled();

    await userEvent.type(caloriesInput, '80');
    await userEvent.clear(proteinInput);
    await userEvent.click(screen.getByRole('button', { name: /Update Entry/i }));
    expect(onSave).not.toHaveBeenCalled();

    await userEvent.type(proteinInput, '3');
    await userEvent.clear(fatInput);
    await userEvent.click(screen.getByRole('button', { name: /Update Entry/i }));
    expect(onSave).not.toHaveBeenCalled();

    await userEvent.type(fatInput, '1');
    await userEvent.clear(carbsInput);
    await userEvent.click(screen.getByRole('button', { name: /Update Entry/i }));
    expect(onSave).not.toHaveBeenCalled();
  });

  test('updates only name and calories if suggestion lacks macro data', async () => {
    jest.useFakeTimers();

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const partialSuggestion = {
      name: 'Simple Food',
      calories: 50,
    };

    getFoodSuggestions.mockResolvedValue([partialSuggestion]);

    render(<EditEntryForm entry={sampleEntry} onSave={jest.fn()} onCancel={jest.fn()} />);

    const nameInput = screen.getByLabelText(/Food Name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Sim');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => expect(screen.getByText('Simple Food')).toBeInTheDocument());
    
    await user.click(screen.getByText('Simple Food'));

    expect(screen.getByLabelText(/Food Name/i)).toHaveValue('Simple Food');
    expect(screen.getByLabelText(/Calories/i)).toHaveValue(50);

    expect(screen.getByLabelText(/Protein/i)).toHaveValue(3);
    expect(screen.getByLabelText(/Fat/i)).toHaveValue(1);
    expect(screen.getByLabelText(/Carbs/i)).toHaveValue(14);

    jest.useRealTimers();
  });

  test('handles API errors gracefully without crashing', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    getFoodSuggestions.mockRejectedValue(new Error('API Error'));

    render(<EditEntryForm entry={sampleEntry} onSave={jest.fn()} onCancel={jest.fn()} />);

    const nameInput = screen.getByLabelText(/Food Name/i);
    await user.type(nameInput, 'Ap');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => expect(getFoodSuggestions).toHaveBeenCalled());

    expect(screen.queryByText('.suggestions')).not.toBeInTheDocument();
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch suggestions:', expect.any(Error));

    consoleSpy.mockRestore();
    jest.useRealTimers();
  });

  test('clears suggestions when input is cleared or too short', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    getFoodSuggestions.mockResolvedValue([{ name: 'Apple', calories: 95 }]);

    render(<EditEntryForm entry={sampleEntry} onSave={jest.fn()} onCancel={jest.fn()} />);

    const nameInput = screen.getByLabelText(/Food Name/i);

    await user.clear(nameInput);
    await user.type(nameInput, 'Ap');
    
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => expect(screen.getByText('Apple')).toBeInTheDocument());

    await user.type(nameInput, '{backspace}');

    expect(screen.queryByText('Apple')).not.toBeInTheDocument();

    jest.useRealTimers();
  });
});
