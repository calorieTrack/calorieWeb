import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import Analysis from '../Analysis';

describe('Analysis component', () => {
  test('calculates total, remaining and shows Under Goal status', () => {
    const entries = [{ calories: 1500 }];
    const { getByTestId } = render(<Analysis entries={entries} />);

    expect(screen.getByText('Total Calories')).toBeInTheDocument();
    expect(screen.getByText('1500')).toBeInTheDocument();

    expect(screen.getByText('500 cal remaining')).toBeInTheDocument();

    const progressFill = getByTestId('progress-fill');
    expect(progressFill).toBeTruthy();
    expect(progressFill.style.width).toBe('75%');

    const status = screen.getByText(/Under Goal/i);
    expect(status).toBeInTheDocument();
    expect(screen.getByTestId('status-badge').textContent).toMatch(/Under Goal/i);
  });

  test('caps progress at 100% and shows Over Goal status when above goal', () => {
    const entries = [{ calories: 2500 }];
    const { getByTestId } = render(<Analysis entries={entries} />);

    expect(screen.getByText('2500')).toBeInTheDocument();
    expect(screen.getByText('500 cal over')).toBeInTheDocument();

    const progressFill = getByTestId('progress-fill');
    expect(progressFill.style.width).toBe('100%');

    const status = screen.getByText(/Over Goal/i);
    expect(status).toBeInTheDocument();
    expect(screen.getByTestId('status-badge').textContent).toMatch(/Over Goal/i);
  });

  test('shows On Track status at 80% boundary (green) and correct percentage', () => {
    const entries = [{ calories: 1600 }];
    render(<Analysis entries={entries} />);

    expect(screen.getByText(/Goal Progress:/i)).toBeInTheDocument();
    expect(screen.getByText(/80%/i)).toBeInTheDocument();

    const status = screen.getByText(/On Track/i);
    expect(status).toBeInTheDocument();
  });

  test('sums macros correctly, rounds to one decimal, and shows macro note when macros present', () => {
    const entries = [
      { calories: 100, protein: 1.234, fat: 0.56, carbs: 2.78 },
      { calories: 200, protein: 1.2, fat: 0.9, carbs: 2.0 }
    ];

    render(<Analysis entries={entries} />);

    // Total Protein
    expect(screen.getByText(/Protein/i)).toBeInTheDocument();
    expect(screen.getByText(/2.4g/)).toBeInTheDocument();

    // Total Fat
    expect(screen.getByText(/Fat/i)).toBeInTheDocument();
    expect(screen.getByText(/1.5g/)).toBeInTheDocument();

    // Total Carbs
    expect(screen.getByText(/Carbs/i)).toBeInTheDocument();
    expect(screen.getByText(/4.8g/)).toBeInTheDocument();

    expect(screen.getByText('*Based on entered nutrition data')).toBeInTheDocument();
  });

  test('shows empty message and zero stats when no entries', () => {
    const { getByTestId } = render(<Analysis entries={[]} />);

    expect(screen.getByText('Daily Analysis')).toBeInTheDocument();
    expect(screen.getByText('No entries for this day. Add your first entry to see analysis!')).toBeInTheDocument();

    const entryCount = getByTestId('quick-entry-count');
    expect(entryCount).toBeTruthy();
    expect(entryCount.textContent).toBe('0');
  });

  test('shows default (0g) stats when entries lack macro data', () => {
    const entries = [{ calories: 500 }]; 
    render(<Analysis entries={entries} />);

    expect(screen.getByText('Entries Today:')).toBeInTheDocument();
    
    const zeroValues = screen.getAllByText('0g');
    expect(zeroValues).toHaveLength(3);

    expect(screen.getByText('*Add entries with USDA search or manual macro data for tracking')).toBeInTheDocument();
    
    expect(screen.queryByText('*Based on entered nutrition data')).not.toBeInTheDocument();
  });

  test('handles partial macro data', () => {

    const entries = [
      [{ calories: 200, protein: 20 }],
      [{ calories: 200, fat: 10 }],
      [{ calories: 200, carbs: 30 }]
    ];

    for (let i = 0; i < entries.length; i++) {
      render(<Analysis entries={entries[i]} />);

      switch (i) {
        case 0:
          expect(screen.getByText('20g')).toBeInTheDocument();
          break;
        case 1:
          expect(screen.getByText('10g')).toBeInTheDocument();
          break;
        case 2:
          expect(screen.getByText('30g')).toBeInTheDocument();
          break;
      }

      const zeroValues = screen.getAllByText('0g');
      expect(zeroValues).toHaveLength(2);
      cleanup();
    }
  });

  test('applies correct color codes to progress bar based on status', () => {
    const { rerender, getByTestId } = render(<Analysis entries={[{ calories: 1000 }]} />);
    
    let progressFill = getByTestId('progress-fill');
    expect(progressFill).toHaveStyle({ backgroundColor: '#ffc107' });

    rerender(<Analysis entries={[{ calories: 2000 }]} />);
    progressFill = getByTestId('progress-fill');
    expect(progressFill).toHaveStyle({ backgroundColor: '#28a745' });

    rerender(<Analysis entries={[{ calories: 2500 }]} />);
    progressFill = getByTestId('progress-fill');
    expect(progressFill).toHaveStyle({ backgroundColor: '#dc3545' });
  });
});
