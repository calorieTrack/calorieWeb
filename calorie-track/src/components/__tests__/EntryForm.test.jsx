import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import EntryForm from '../EntryForm';

import { getFoodSuggestions } from '../../api';

jest.mock('../../api', () => ({
  getFoodSuggestions: jest.fn().mockResolvedValue([
    { 
    name: 'Popcorn', 
    calories: 108, 
    protein: 3.4, 
    fat: 1.2, 
    carbs: 22
    }
  ]),
  searchUSDAFoods: jest.fn().mockResolvedValue({ suggestions: [] }),
}));

describe('EntryForm component', () => {
  test('renders form with Add Entry disabled initially', () => {
    const onAdd = jest.fn();
    render(<EntryForm onAdd={onAdd} />);

    const addBtn = screen.getByRole('button', { name: /Add Entry/i });
    expect(addBtn).toBeInTheDocument();
    expect(addBtn).toBeDisabled();
  });

  test('submits a valid manual entry, trims name, uses default quantity and resets form', async () => {
    const onAdd = jest.fn();
    render(<EntryForm onAdd={onAdd} />);

    // Process of filling out form
    const nameInput = screen.getByLabelText(/Food Name/i);
    await userEvent.type(nameInput, '  Banana  ');

    const manualOption = await screen.findByText(/enter nutrition data manually/i);
    await userEvent.click(manualOption);

    const caloriesInput = screen.getByLabelText(/Calories/i);
    const proteinInput = screen.getByLabelText(/Protein/i);
    const fatInput = screen.getByLabelText(/Fat/i);
    const carbsInput = screen.getByLabelText(/Carbs/i);

    await userEvent.type(caloriesInput, '100');
    await userEvent.type(proteinInput, '1.2');
    await userEvent.type(fatInput, '0.5');
    await userEvent.type(carbsInput, '27');

    // Submitting form
    const addButton = screen.getByRole('button', { name: /Add Entry/i });
    expect(addButton).toBeEnabled();

    await userEvent.click(addButton);

    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));

    expect(onAdd).toHaveBeenCalledWith('Banana', '1', 100, 1.2, 0.5, 27);

    // Check form has reset
    expect(nameInput).toHaveValue('');
    expect(caloriesInput).not.toBeInTheDocument();
    expect(proteinInput).not.toBeInTheDocument();
    expect(fatInput).not.toBeInTheDocument();
    expect(carbsInput).not.toBeInTheDocument();
  });

  test('allows zero nutrition values and submits them', async () => {
    const onAdd = jest.fn();
    render(<EntryForm onAdd={onAdd} />);

    const nameInput = screen.getByLabelText(/Food Name/i);
    await userEvent.type(nameInput, 'Water');

    const manualOption = await screen.findByText(/enter nutrition data manually/i);
    await userEvent.click(manualOption);

    const caloriesInput = screen.getByLabelText(/Calories/i);
    const proteinInput = screen.getByLabelText(/Protein/i);
    const fatInput = screen.getByLabelText(/Fat/i);
    const carbsInput = screen.getByLabelText(/Carbs/i);

    await userEvent.type(caloriesInput, '0');
    await userEvent.type(proteinInput, '0');
    await userEvent.type(fatInput, '0');
    await userEvent.type(carbsInput, '0');

    const addBtn = screen.getByRole('button', { name: /Add Entry/i });
    expect(addBtn).toBeEnabled();

    await userEvent.click(addBtn);

    await waitFor(() => expect(onAdd).toHaveBeenCalled());
    expect(onAdd).toHaveBeenCalledWith('Water', '1', 0, 0, 0, 0);
  });

  test('only allows user to submit when required fields are filled out', async () => {
    const onAdd = jest.fn();
    render(<EntryForm onAdd={onAdd} />);

    const addBtn = screen.getByRole('button', { name: /Add Entry/i });
    expect(addBtn).toBeDisabled();

    const nameInput = screen.getByLabelText(/Food Name/i);
    await userEvent.type(nameInput, 'Apple');
    expect(addBtn).toBeDisabled();
    
    const manualOption = await screen.findByText(/enter nutrition data manually/i);
    await userEvent.click(manualOption);
    expect(addBtn).toBeDisabled();

    const caloriesInput = screen.getByLabelText(/Calories/i);
    await userEvent.type(caloriesInput, '95');
    expect(addBtn).toBeDisabled();

    const proteinInput = screen.getByLabelText(/Protein/i);
    await userEvent.type(proteinInput, '0.5');
    expect(addBtn).toBeDisabled();

    const fatInput = screen.getByLabelText(/Fat/i);
    await userEvent.type(fatInput, '0.3');
    expect(addBtn).toBeDisabled();

    const carbsInput = screen.getByLabelText(/Carbs/i);
    await userEvent.type(carbsInput, '25');
    expect(addBtn).toBeEnabled();
  });

  test('displays suggestions when typing and populates form on selection', async () => {
    const onAdd = jest.fn();
    render(<EntryForm onAdd={onAdd} />);

    await userEvent.type(screen.getByLabelText(/Food Name/i), 'Pop');

    const suggestion = await screen.findByText('Popcorn');
    expect(suggestion).toBeInTheDocument();
  
    await userEvent.click(suggestion);

    expect(screen.getByLabelText(/Calories/i)).toHaveValue(108);
    expect(screen.getByLabelText(/Protein/i)).toHaveValue(3.4);
    expect(screen.getByLabelText(/Fat/i)).toHaveValue(1.2);
    expect(screen.getByLabelText(/Carbs/i)).toHaveValue(22);
  });

  test('handles API errors gracefully without crashing', async () => {
    jest.useFakeTimers();
    const onAdd = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    getFoodSuggestions.mockRejectedValue(new Error('API Error'));

    render(<EntryForm onAdd={onAdd}/>);

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
});
