import React, { useState, useEffect } from 'react';
import { getFoodSuggestions } from '../api';
import './EditEntryForm.css';

function EditEntryForm({ entry, onSave, onCancel }) {
//  console.log('EditEntryForm entry data:', entry); // Debug log
  
  const [name, setName] = useState(entry.name || '');
  const [quantity, setQuantity] = useState(entry.quantity || '');
  const [calories, setCalories] = useState(entry.calories || '');
  const [protein, setProtein] = useState(entry.protein || 0);
  const [fat, setFat] = useState(entry.fat || 0);
  const [carbs, setCarbs] = useState(entry.carbs || 0);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch food suggestions on name change
  useEffect(() => {
    if (name.length > 1) {
      const fetchSuggestions = async () => {
        try {
          const results = await getFoodSuggestions(name, 5);
          setSuggestions(Array.isArray(results) ? results : []);
          setShowSuggestions(true);
        } catch (error) {
          console.warn('Failed to fetch suggestions:', error);
          setSuggestions([]);
        }
      };

      const timer = setTimeout(fetchSuggestions, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [name]);

  const handleSelectSuggestion = (suggestion) => {
    setName(suggestion.name);
    setCalories(suggestion.calories);
    if (suggestion.protein !== undefined) {
      setProtein(suggestion.protein);
      setFat(suggestion.fat);
      setCarbs(suggestion.carbs);
    }
    setShowSuggestions(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const hasName = name.trim() !== '';
    const hasCalories = calories !== '' && calories !== null && calories !== undefined;
    const hasProtein = protein !== '' && protein !== null && protein !== undefined;
    const hasFat = fat !== '' && fat !== null && fat !== undefined;
    const hasCarbs = carbs !== '' && carbs !== null && carbs !== undefined;
    
    if (hasName && hasCalories && hasProtein && hasFat && hasCarbs) {
      onSave(
        name.trim(), 
        quantity, 
        parseInt(calories) || 0, 
        parseFloat(protein) || 0, 
        parseFloat(fat) || 0, 
        parseFloat(carbs) || 0, 
        entry.id
      );
    }
  };

  return (
    <div className="entry-form-container">
      <h3>Edit Entry</h3>
      <form className="entry-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="edit-name">Food Name</label>
          <input
            type="text"
            id="edit-name"
            placeholder="Food name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => name.length > 1 && setShowSuggestions(true)}
            required
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions">
              {suggestions.map((sugg, idx) => (
                <div
                  key={idx}
                  className="suggestion-item"
                  onClick={() => handleSelectSuggestion(sugg)}
                >
                  <div className="suggestion-main">
                    <strong>{sugg.name}</strong> - {sugg.calories} cal
                  </div>
                  {sugg.protein && (
                    <div className="suggestion-macros">
                      P: {sugg.protein}g | F: {sugg.fat}g | C: {sugg.carbs}g
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="edit-quantity">Quantity</label>
          <input
            type="text"
            id="edit-quantity"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
        
        <div className="nutrition-section">
          <div className="nutrition-header">
            <h4>Nutrition Information</h4>
          </div>
          <div className="nutrition-inputs">
            <div className="form-group">
              <label htmlFor="edit-calories">Calories</label>
              <input
                type="number"
                id="edit-calories"
                placeholder="Calories"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="edit-protein">Protein (g)</label>
              <input
                type="number"
                id="edit-protein"
                placeholder="Protein"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                step="0.1"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="edit-fat">Fat (g)</label>
              <input
                type="number"
                id="edit-fat"
                placeholder="Fat"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                step="0.1"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="edit-carbs">Carbs (g)</label>
              <input
                type="number"
                id="edit-carbs"
                placeholder="Carbs"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                step="0.1"
                required
              />
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button type="submit">Update Entry</button>
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditEntryForm;
