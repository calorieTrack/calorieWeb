/**
 * USDA FoodData Central API Integration
 * Searches for foods and extracts nutrition data from search results
 * Docs: https://fdc.nal.usda.gov/api-guide.html
 */

const USDA_API_KEY = process.env.USDA_API_KEY;
const USDA_API_URL = 'https://api.nal.usda.gov/fdc/v1';

/**
 * Search USDA FoodData Central for multiple foods
 * Returns array of search results with embedded nutrition data
 * @param {string} foodName - Search query
 * @param {number} limit - Max results to return
 * @param {string[]} dataTypes - Array of data types to include (e.g., ['Foundation', 'SR Legacy', 'Branded'])
 */
export async function searchUSDAFoods(foodName, limit = 5, dataTypes = ['Foundation', 'SR Legacy']) {
  if (!USDA_API_KEY) {
    return { error: 'USDA_API_KEY not configured', suggestions: [] };
  }

  try {
    const searchUrl = new URL(`${USDA_API_URL}/foods/search`);
    searchUrl.searchParams.set('query', foodName);
    searchUrl.searchParams.set('pageSize', limit.toString());
    searchUrl.searchParams.set('api_key', USDA_API_KEY);
    
    // Set dataType filter based on user selection
    if (dataTypes && dataTypes.length > 0) {
      searchUrl.searchParams.set('dataType', dataTypes.join(','));
    }

    const searchResponse = await fetch(searchUrl.toString());

    if (!searchResponse.ok) {
      console.error(`USDA API search error: ${searchResponse.status}`);
      return { error: `USDA API error: ${searchResponse.status}`, suggestions: [] };
    }

    const searchData = await searchResponse.json();

    if (!searchData.foods || searchData.foods.length === 0) {
      return { error: `No foods found for "${foodName}"`, suggestions: [] };
    }

    const suggestions = searchData.foods.map(food => {
      // Extract nutrients directly from search results
      const nutrients = extractNutrients(food);
      
      return {
        fdcId: food.fdcId,
        name: food.description,
        dataType: food.dataType,
        brandOwner: food.brandOwner || null,
        publishedDate: food.publishedDate || null,
        // Include nutrition data directly in search results
        calories: nutrients.calories,
        protein: nutrients.protein,
        fat: nutrients.fat,
        carbs: nutrients.carbs,
        hasNutrients: nutrients.calories > 0 || nutrients.protein > 0 || nutrients.fat > 0 || nutrients.carbs > 0
      };
    });

    console.log(`Found ${suggestions.length} foods for "${foodName}"`);
    return { error: null, suggestions };
  } catch (error) {
    console.error('USDA API error:', error.message);
    return { error: `Search failed: ${error.message}`, suggestions: [] };
  }
}

/**
 * Extract nutrient values from USDA food data
 * Per 100g serving (or per serving if not available)
 */
function extractNutrients(foodData) {
  const nutrients = {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
  };

  if (!foodData.foodNutrients || !Array.isArray(foodData.foodNutrients)) {
    console.log(`No nutrients found for food: ${foodData.description || 'Unknown'}`);
    return nutrients;
  }

  // Map USDA nutrient numbers to our fields (based on actual API structure)
  const nutrientMap = {
    '208': 'calories',    // Energy (kcal)
    '268': 'energy_kj',   // Energy (kJ) - for conversion if needed
    '203': 'protein',     // Protein (g)
    '204': 'fat',         // Total lipid (fat) (g)
    '205': 'carbs',       // Carbohydrate, by difference (g)
    '269': 'sugars',      // Total sugars (g) - can add to carbs if no main carbs
    '291': 'fiber',       // Fiber, total dietary (g) - can add to carbs
  };

  console.log(`Extracting nutrients for: ${foodData.description || 'Unknown'}`);
  console.log(`Found ${foodData.foodNutrients.length} nutrients`);

  // Look for our target nutrients specifically
  const targetNutrients = [];
  for (const nutrient of foodData.foodNutrients) {
    const nutrientNumber = String(nutrient.nutrientNumber || '');
    if (Object.keys(nutrientMap).includes(nutrientNumber)) {
      targetNutrients.push({
        number: nutrientNumber,
        name: nutrient.nutrientName,
        value: nutrient.value,
        unitName: nutrient.unitName,
        field: nutrientMap[nutrientNumber]
      });
    }
  }
  
  console.log(`Found ${targetNutrients.length} target nutrients:`, targetNutrients);

  for (const nutrient of foodData.foodNutrients) {
    // Use nutrientNumber from the actual API structure
    const nutrientNumber = String(nutrient.nutrientNumber || '');
    const field = nutrientMap[nutrientNumber];

    if (field && nutrient.value !== null && nutrient.value !== undefined) {
      const value = parseFloat(nutrient.value || 0);
      
      if (value >= 0) { // Allow 0 values for meat (like carbs)
        // Map the fields correctly
        if (field === 'calories') {
          nutrients.calories = Math.max(nutrients.calories, Math.round(value));
        } else if (field === 'protein') {
          nutrients.protein = Math.max(nutrients.protein, Math.round(value * 10) / 10);
        } else if (field === 'fat') {
          nutrients.fat = Math.max(nutrients.fat, Math.round(value * 10) / 10);
        } else if (field === 'carbs') {
          nutrients.carbs = Math.max(nutrients.carbs, Math.round(value * 10) / 10);
        } else if (field === 'fiber' && nutrients.carbs === 0) {
          // Add fiber to carbs if no main carbs found
          nutrients.carbs += Math.round(value * 10) / 10;
        } else if (field === 'sugars' && nutrients.carbs === 0) {
          // Use sugars as carbs if no main carbs found
          nutrients.carbs = Math.max(nutrients.carbs, Math.round(value * 10) / 10);
        } else if (field === 'energy_kj' && nutrients.calories === 0) {
          // Convert kJ to kcal if no direct calories (kJ ÷ 4.184 = kcal)
          nutrients.calories = Math.round(value / 4.184);
        }
        
        console.log(`  MATCHED: ${nutrient.nutrientName || 'Unknown nutrient'} (${nutrientNumber}): ${value} ${nutrient.unitName || ''} -> ${field}`);
      }
    }
  }

  // For calories, if still not found, estimate from macros (4 cal/g protein & carbs, 9 cal/g fat)
  if (nutrients.calories === 0 && (nutrients.protein || nutrients.fat || nutrients.carbs)) {
    nutrients.calories = Math.round(
      (nutrients.protein * 4) + 
      (nutrients.fat * 9) + 
      (nutrients.carbs * 4)
    );
    console.log(`  Estimated calories from macros: ${nutrients.calories}`);
  }

  console.log(`Final nutrients:`, nutrients);
  return nutrients;
}

/**
 * Get nutrients for 100g reference, adjusted for quantity
 */
export function adjustNutrients(nutrient, quantity = 100) {
  if (!nutrient) return null;

  const multiplier = quantity / 100;
  return {
    calories: Math.round(nutrient.calories * multiplier),
    protein: Math.round(nutrient.protein * multiplier * 10) / 10,
    fat: Math.round(nutrient.fat * multiplier * 10) / 10,
    carbs: Math.round(nutrient.carbs * multiplier * 10) / 10,
  };
}

// No estimation functions - users must provide manual data or select from USDA search results
