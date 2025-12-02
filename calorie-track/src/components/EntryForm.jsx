import { useState, useEffect } from 'react';
import { getFoodSuggestions, searchUSDAFoods } from '../api';
import './EntryForm.css';

function EntryForm({ onAdd }) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');
  const [suggestions, setSuggestions] = useState([]); // Local autocomplete
  const [usdaSuggestions, setUsdaSuggestions] = useState([]); // USDA search results
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null); // Selected food with source info
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [searchingUSDA, setSearchingUSDA] = useState(false);
  const [usdaDataTypes, setUsdaDataTypes] = useState(['Foundation', 'SR Legacy']); // Default data types

  // Calculate adjusted nutrition values based on quantity (only for weight units)
  const getAdjustedNutrition = (baseNutrition, inputQuantity) => {
    console.log("I GOT HERE");
    if (!selectedFood || selectedFood.type !== 'usda') {
      return baseNutrition;
    }
    
    // Only adjust if quantity has weight suffix (g, kg, mg)
    const weightMatch = inputQuantity.toString().toLowerCase().match(/(\d+\.?\d*)\s*(g|kg|mg)\b/);
    if (!weightMatch) {
      return baseNutrition; // No weight unit found, return original values
    }
    
    const quantityNum = parseFloat(weightMatch[1]);
    const unit = weightMatch[2];
    
    // Convert to grams
    let gramsQuantity;
    switch (unit) {
      case 'kg':
        gramsQuantity = quantityNum * 1000;
        break;
      case 'mg':
        gramsQuantity = quantityNum / 1000;
        break;
      case 'g':
      default:
        gramsQuantity = quantityNum;
        break;
    }
    
    // USDA data is per 100g, so adjust proportionally
    const ratio = gramsQuantity / 100;
    
    return {
      calories: Math.round(baseNutrition.calories * ratio * 10) / 10,
      protein: Math.round(baseNutrition.protein * ratio * 10) / 10,
      fat: Math.round(baseNutrition.fat * ratio * 10) / 10,
      carbs: Math.round(baseNutrition.carbs * ratio * 10) / 10
    };
  };

  // Combined search: local autocomplete + USDA results
  useEffect(() => {
    // Don't search if a food is already selected and name matches
    if (selectedFood && (name === selectedFood.data?.name || name === selectedFood.data?.description)) {
      return;
    }
    
    // Don't search if in manual entry mode
    if (showManualEntry) {
      return;
    }
    
    if (name.length > 1) {
      const fetchSuggestions = async () => {
        try {
          // Get local autocomplete suggestions
          const localResults = await getFoodSuggestions(name, 3);
          setSuggestions(localResults);

          // Search USDA database with selected data types
          setSearchingUSDA(true);
          const usdaResults = await searchUSDAFoods(name, 7, usdaDataTypes);
          setUsdaSuggestions(usdaResults.suggestions || []);
          setSearchingUSDA(false);
          
          setShowSuggestions(true);
        } catch (error) {
          console.warn('Failed to fetch suggestions:', error);
          setSearchingUSDA(false);
        }
      };

      const timer = setTimeout(fetchSuggestions, 300); // debounce
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setUsdaSuggestions([]);
      setShowSuggestions(false);
    }
  }, [name, selectedFood, showManualEntry, usdaDataTypes]);

  // Handle selecting a local food suggestion
  const handleSuggestionSelect = (suggestion) => {
    // Clear search state first to prevent reappearing
    setShowSuggestions(false);
    setSearchingUSDA(false);
    setSuggestions([]);
    setUsdaSuggestions([]);
    
    // Set the food data
    setName(suggestion.name);
    setCalories(suggestion.calories?.toString() || '');
    setProtein(suggestion.protein?.toString() || '');
    setFat(suggestion.fat?.toString() || '');
    setCarbs(suggestion.carbs?.toString() || '');
    setSelectedFood({ type: 'local', data: suggestion });
  };

  // Handle selecting a USDA food with nutrition data
  const handleUSDASelect = (food) => {
    // Clear search state first to prevent reappearing
    setShowSuggestions(false);
    setSearchingUSDA(false);
    setSuggestions([]);
    setUsdaSuggestions([]);
    
    // Set the food data
    setName(food.name);
    
    // Store the base USDA data
    const baseData = {
      calories: food.calories || 0,
      protein: food.protein || 0,
      fat: food.fat || 0,
      carbs: food.carbs || 0
    };
    
    // If quantity is already entered, adjust values
    if (quantity) {
      const adjusted = getAdjustedNutrition(baseData, quantity);
      setCalories(adjusted.calories.toString());
      setProtein(adjusted.protein.toString());
      setFat(adjusted.fat.toString());
      setCarbs(adjusted.carbs.toString());
    } else {
      // Use base values (per 100g)
      setCalories(baseData.calories.toString());
      setProtein(baseData.protein.toString());
      setFat(baseData.fat.toString());
      setCarbs(baseData.carbs.toString());
    }
    
    setSelectedFood({ type: 'usda', data: food, baseNutrition: baseData });
    setShowManualEntry(false);
  };

  // Show manual entry form
  const handleManualEntry = () => {
    setShowSuggestions(false);
    setSuggestions([]);
    setUsdaSuggestions([]);
    setSearchingUSDA(false);
    setShowManualEntry(true);
    setSelectedFood({ type: 'manual' });
  };

  // Clear selection and show suggestions again
  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    
    // Only clear nutrition data if this is a manual change and doesn't match selected food
    if (selectedFood && newName !== selectedFood.data?.name && newName !== selectedFood.data?.description) {
      setCalories('');
      setProtein('');
      setFat('');
      setCarbs('');
      setSelectedFood(null);
      setShowManualEntry(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check if required fields have values (including zero)
    const hasName = name.trim() !== '';
    const hasCalories = calories !== '' && calories !== null && calories !== undefined;
    const hasProtein = protein !== '' && protein !== null && protein !== undefined;
    const hasFat = fat !== '' && fat !== null && fat !== undefined;
    const hasCarbs = carbs !== '' && carbs !== null && carbs !== undefined;
    
    if (hasName && hasCalories && hasProtein && hasFat && hasCarbs) {
      onAdd(
        name.trim(), 
        quantity || '1', 
        parseInt(calories) || 0, 
        parseFloat(protein) || 0, 
        parseFloat(fat) || 0, 
        parseFloat(carbs) || 0
      );
      
      // Reset form
      setName('');
      setQuantity('');
      setCalories('');
      setProtein('');
      setFat('');
      setCarbs('');
      setSuggestions([]);
      setUsdaSuggestions([]);
      setShowSuggestions(false);
      setSelectedFood(null);
      setShowManualEntry(false);
    }
  };

  // Improved validation that handles zero values properly
  const isFormValid = name.trim() !== '' && 
                     calories !== '' && calories !== null && calories !== undefined &&
                     protein !== '' && protein !== null && protein !== undefined &&
                     fat !== '' && fat !== null && fat !== undefined &&
                     carbs !== '' && carbs !== null && carbs !== undefined;
                     
  const hasNutritionData = calories !== '' || protein !== '' || fat !== '' || carbs !== '';

  return (
    <form onSubmit={handleSubmit} className="entry-form">
      <div className="form-group">
        <label htmlFor="name">Food Name</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={handleNameChange}
          placeholder="Type a food name..."
          required
          autoComplete="off"
        />
        
        {/* Food Suggestions */}
        {showSuggestions && name.trim().length > 0 && (
          <div className="food-suggestions-dropdown">
            {/* Debug info 
            {process.env.NODE_ENV === 'development' && (
              <div style={{fontSize: '12px', color: '#888', padding: '4px', background: '#f0f0f0'}}>
                Debug: Local: {suggestions.length}, USDA: {usdaSuggestions.length}, Show: {showSuggestions.toString()}
              </div>
            )}
            */}

            {/* Local suggestions first */}
            {suggestions.length > 0 && (
              <div className="suggestion-section">
                <div className="suggestion-header">Recent Foods</div>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={`local-${index}`}
                    className="suggestion-item local-suggestion"
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    <div className="food-name">{suggestion.name}</div>
                    <div className="food-meta">
                      <span className="calories">{suggestion.calories} kcal</span>
                      {suggestion.protein && (
                        <span className="macros">
                          P: {suggestion.protein}g • F: {suggestion.fat}g • C: {suggestion.carbs}g
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* USDA suggestions and filters */}
            <div className="suggestion-section">
              <div className="suggestion-header usda-header-with-filter">
                <div className="usda-header-title">
                  USDA Database {searchingUSDA && <span className="loading">Searching...</span>}
                </div>
                <div className="data-type-checkboxes-inline">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={usdaDataTypes.includes('Foundation')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setUsdaDataTypes([...usdaDataTypes, 'Foundation']);
                          } else {
                            setUsdaDataTypes(usdaDataTypes.filter(t => t !== 'Foundation'));
                          }
                        }}
                      />
                      <span>Foundation</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={usdaDataTypes.includes('SR Legacy')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setUsdaDataTypes([...usdaDataTypes, 'SR Legacy']);
                          } else {
                            setUsdaDataTypes(usdaDataTypes.filter(t => t !== 'SR Legacy'));
                          }
                        }}
                      />
                      <span>SR Legacy</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={usdaDataTypes.includes('Branded')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setUsdaDataTypes([...usdaDataTypes, 'Branded']);
                          } else {
                            setUsdaDataTypes(usdaDataTypes.filter(t => t !== 'Branded'));
                          }
                        }}
                      />
                      <span>Branded</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={usdaDataTypes.includes('Survey (FNDDS)')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setUsdaDataTypes([...usdaDataTypes, 'Survey (FNDDS)']);
                          } else {
                            setUsdaDataTypes(usdaDataTypes.filter(t => t !== 'Survey (FNDDS)'));
                          }
                        }}
                      />
                      <span>Survey</span>
                    </label>
                  </div>
                  <span className="usda-note">• Nutrition values per 100g</span>
                </div>
                {usdaSuggestions.length > 0 ? (
                  usdaSuggestions.map((food) => (
                    <div
                      key={`usda-${food.fdcId}`}
                      className={`suggestion-item usda-suggestion ${!food.hasNutrients ? 'limited-nutrition' : ''}`}
                      onClick={() => handleUSDASelect(food)}
                    >
                      <div className="food-name">{food.name}</div>
                      <div className="food-meta">
                        <span className="food-type">{food.dataType}</span>
                        {food.brandOwner && <span className="brand-owner"> • {food.brandOwner}</span>}
                        {food.hasNutrients ? (
                          <span className="nutrition-preview">
                            {food.calories} kcal • P: {food.protein}g • F: {food.fat}g • C: {food.carbs}g
                          </span>
                        ) : (
                          <span className="nutrition-warning"> • Limited nutrition data</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  !searchingUSDA && (
                    <div className="suggestion-item no-results">
                      <div className="food-name">No results found</div>
                      <div className="food-meta">Try adjusting the data types above or enter manually below</div>
                    </div>
                  )
                )}
              </div>
            
            {/* Manual entry option */}
            <div className="suggestion-section">
              <div
                className="suggestion-item manual-suggestion"
                onClick={handleManualEntry}
              >
                <div className="food-name">📝 Enter nutrition data manually</div>
                <div className="food-meta">For custom foods or if not found above</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="quantity">Quantity</label>
        <input
          type="text"
          id="quantity"
          value={quantity}
          onChange={(e) => {
            const newQuantity = e.target.value;
            setQuantity(newQuantity);
            
            // Auto-adjust USDA values only when quantity has weight suffix (g, kg, mg)
            if (selectedFood && selectedFood.type === 'usda' && selectedFood.baseNutrition && newQuantity) {
              const weightMatch = newQuantity.toLowerCase().match(/(\d+\.?\d*)\s*(g|kg|mg)\b/);
              if (weightMatch) {
                const adjusted = getAdjustedNutrition(selectedFood.baseNutrition, newQuantity);
                setCalories(adjusted.calories.toString());
                setProtein(adjusted.protein.toString());
                setFat(adjusted.fat.toString());
                setCarbs(adjusted.carbs.toString());
              }
            }
          }}
          placeholder={"Enter weight (e.g., 150g, 0.5kg, 200mg)"}
        />
      </div>

      {/* Nutrition Data Section */}
      {(hasNutritionData || showManualEntry || selectedFood) && (
        <div className="nutrition-section">
          <div className="nutrition-header">
            <h4>Nutrition Information</h4>
            {selectedFood && (
              <span className="data-source">
                {selectedFood.type === 'usda' && (
                  <>
                    🔬 USDA Data 
                    {quantity ? (
                      (() => {
                        const weightMatch = quantity.toString().toLowerCase().match(/(\d+\.?\d*)\s*(g|kg|mg)\b/);
                        if (weightMatch) {
                          const quantityNum = parseFloat(weightMatch[1]);
                          const unit = weightMatch[2];
                          return (
                            <span className="adjusted-note">(adjusted for {quantityNum}{unit})</span>
                          );
                        } else {
                          return <span>(per 100g - enter weight to auto-adjust)</span>;
                        }
                      })()
                    ) : (
                      <span>(per 100g)</span>
                    )}
                  </>
                )}
                {selectedFood.type === 'local' && '💾 Saved Data'}
                {selectedFood.type === 'manual' && '✏️ Manual Entry'}
              </span>
            )}
          </div>
          
          <div className="nutrition-inputs">
            <div className="form-group">
              <label htmlFor="calories">Calories</label>
              <input
                type="number"
                id="calories"
                value={calories}
                onChange={(e) => {
                  setCalories(e.target.value);
                  // Switch to manual if user edits USDA value
                  if (selectedFood?.type === 'usda') {
                    setSelectedFood({ type: 'manual' });
                    setShowManualEntry(true);
                  }
                }}
                placeholder="0"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="protein">Protein (g)</label>
              <input
                type="number"
                id="protein"
                value={protein}
                onChange={(e) => {
                  setProtein(e.target.value);
                  // Switch to manual if user edits USDA value
                  if (selectedFood?.type === 'usda') {
                    setSelectedFood({ type: 'manual' });
                    setShowManualEntry(true);
                  }
                }}
                placeholder="0"
                step="0.1"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="fat">Fat (g)</label>
              <input
                type="number"
                id="fat"
                value={fat}
                onChange={(e) => {
                  setFat(e.target.value);
                  // Switch to manual if user edits USDA value
                  if (selectedFood?.type === 'usda') {
                    setSelectedFood({ type: 'manual' });
                    setShowManualEntry(true);
                  }
                }}
                placeholder="0"
                step="0.1"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="carbs">Carbs (g)</label>
              <input
                type="number"
                id="carbs"
                value={carbs}
                onChange={(e) => {
                  setCarbs(e.target.value);
                  // Switch to manual if user edits USDA value
                  if (selectedFood?.type === 'usda') {
                    setSelectedFood({ type: 'manual' });
                    setShowManualEntry(true);
                  }
                }}
                placeholder="0"
                step="0.1"
                required
              />
            </div>
          </div>
        </div>
      )}

      <div className="form-actions">
        <button type="submit" disabled={!isFormValid}>
          Add Entry
        </button>
        {selectedFood && (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setSelectedFood(null);
              setShowManualEntry(false);
              setCalories('');
              setProtein('');
              setFat('');
              setCarbs('');
            }}
          >
            Clear Selection
          </button>
        )}
      </div>
    </form>
  );
}

export default EntryForm;