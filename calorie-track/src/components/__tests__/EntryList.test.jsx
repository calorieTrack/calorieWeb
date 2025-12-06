import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import EntryList from '../EntryList';

describe('EntryList component', () => {
  test('shows empty state and zero total when no entries', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    render(<EntryList entries={[]} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText("Today's Entries")).toBeInTheDocument();
    expect(screen.getByText('No entries yet')).toBeInTheDocument();
    expect(screen.getByText(/Total: 0 calories/i)).toBeInTheDocument();
  });

  test('renders entries, macros, total and calls actions', async () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const entries = [
      {
        id: '1',
        name: 'Apple',
        quantity: '1 medium',
        calories: 95,
        protein: 0.5,
        fat: 0.3,
        carbs: 25,
      },
      {
        id: '2',
        name: 'Egg',
        quantity: '2 large',
        calories: 155,
        protein: 12.6,
        fat: 10.6,
        carbs: 1.1,
      }
    ];

    render(<EntryList entries={entries} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('1 medium')).toBeInTheDocument();
    expect(screen.getByText('Egg')).toBeInTheDocument();
    expect(screen.getByText('2 large')).toBeInTheDocument();

    expect(screen.getByText(/🥩 0.5g/)).toBeInTheDocument();
    expect(screen.getByText(/🧈 0.3g/)).toBeInTheDocument();
    expect(screen.getByText(/🌾 25g/)).toBeInTheDocument();

    expect(screen.getByText('95 cal')).toBeInTheDocument();
    expect(screen.getByText('155 cal')).toBeInTheDocument();
    expect(screen.getByText(/Total: 250 calories/i)).toBeInTheDocument();

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });

    await userEvent.click(editButtons[0]);
    expect(onEdit).toHaveBeenCalledWith('1');

    await userEvent.click(deleteButtons[1]);
    expect(onDelete).toHaveBeenCalledWith('2');
  });

  // Prompt: I currently have a file that lists food entries with their nutritional information (i.e. calories, protein, fat, carbs).
  // So far, my tests cover when there are no entries to list and renders an entry with complete data.
  // Please list, but do not code, any additional edge cases that I should consider for better coverage.
  // IMPORTANT: I only had the LLM list the edge cases without generating any code. The code for the test was written by me.
  // This was the edge case that I decided to implement:
  test('handles data that has null values correctly', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const entries = [
      {
        id: '1',
        name: 'Soda',
        quantity: '1 can',
        calories: 200,
        protein: null,
        fat: 0,
        carbs: 39,
      }
    ];

    render(<EntryList entries={entries} onEdit={onEdit} onDelete={onDelete} />);

    const proteinEmoji = screen.queryByText(/🥩/);
    expect(proteinEmoji).not.toBeInTheDocument();

    expect(screen.getByText(/🧈 0g/)).toBeInTheDocument();

    expect(screen.getByText(/🌾 39g/)).toBeInTheDocument();
  });
});
