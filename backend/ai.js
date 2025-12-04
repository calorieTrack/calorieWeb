/**
 * AI Nutrition Suggestions using Google Gemini
 * Analyzes user's nutrition data and provides personalized recommendations
 */
import { GoogleGenAI } from "@google/genai";

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({});


const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export const pollSuggestions = async (nutritionData) => {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }  
<<<<<<< HEAD
  const prompt = `
  You are a nutritionist. You are given a summary of a user's nutrition data. 
  You need to provide a personalized recommendation for the user based on the data.
  Nutrition Data Summary:
  - Total Calories: ${nutritionData.totalCalories/nutritionData.days} (Goal: ${nutritionData.calorieGoal})
  - Total Protein: ${nutritionData.totalProtein/nutritionData.days}g
  - Total Fat: ${nutritionData.totalFat/nutritionData.days}g
  - Total Carbs: ${nutritionData.totalCarbs/nutritionData.days}g
  REQUIREMENTS:
  - The recommendations should be based on the user's nutrition data.
  - The recommendations should be personalized to the user.
  - There should be 3-5 recommendations of food.
  - The recommendations should be listed in fewer than 75 words.
  - The recommendations should be in a easy to understand format.
  - Do not include asterisks or other formatting, just raw text
  - Mention that the nutrition data is average over the week, not just today's data`;
=======
  const prompt = `You are a nutritionist assistant. You are given a summary of a user's nutrition data and must return a JSON object only (no prose, no markdown, no HTML). The JSON must be valid and parsable by JSON.parse(). Do NOT include any surrounding text or commentary. DO NOT WRAP in code blocks.

Input summary:
- totalCalories: ${nutritionData.totalCalories ?? 0}
- totalProtein: ${nutritionData.totalProtein ?? 0}
- totalFat: ${nutritionData.totalFat ?? 0}
- totalCarbs: ${nutritionData.totalCarbs ?? 0}
- days: ${nutritionData.days ?? 1}
- calorieGoal: ${nutritionData.calorieGoal ?? 2000}

Date context:
- startDate: ${nutritionData.startDate || 'N/A'}
- endDate: ${nutritionData.endDate || 'N/A'}
- today: ${new Date().toISOString().slice(0,10)}

Requirements for the JSON output:
1) Return an object with these top-level keys: "suggestions" (array), "totals" (object), and optionally "note" (string).
2) "suggestions" must be an array of 3 to 5 objects. Each suggestion object must have exactly these keys: "name" (short item name, 2-6 words) and "rationale" (one short sentence explaining why, and may mention that the values are averages over the last N days).
3) "totals" must include numeric keys: "totalCalories", "totalProtein", "totalFat", "totalCarbs", and "days".
4) Keep all text concise. The entire JSON (when stringified) should be reasonably small (<1000 characters).
5) DO NOT output HTML, scripts, markdown, or any additional fields beyond those described.

Example output (must be valid JSON, formatting below is for illustration):
{
  "suggestions": [
    { "name": "Greek yogurt", "rationale": "Higher protein to meet weekly average protein." },
    { "name": "Oatmeal", "rationale": "Complex carbs for sustained energy." }
  ],
  "totals": { "totalCalories": 14000, "totalProtein": 700, "totalFat": 350, "totalCarbs": 1600, "days": 7 },
  "note": "Other things that might be useful to know."
}
`;
>>>>>>> origin/main
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });
<<<<<<< HEAD
    console.log(response.text);
    return response.text;
=======
    // The model should return a JSON string. Try to parse it and return an object.
    // Expected JSON structure:
    // {
    //   "suggestions": [
    //     { "name": "Greek yogurt", "rationale": "Higher protein to meet weekly average." },
    //     ...
    //   ],
    //   "totals": { "totalCalories": 14000, "days": 7, ... },
    //   "note": "Averages are over the last 7 days"
    // }
    const text = response.text || '';
    try {
      const parsed = JSON.parse(text);
      return parsed;
    } catch (err) {
      // Fail fast: if the model did not return valid JSON, throw so caller can handle as an error.
      throw new Error(`AI response not valid JSON:\n ${text}`);
    }
>>>>>>> origin/main
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
};