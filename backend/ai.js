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
  console.log("hello");
  console.log("nutritionData:", nutritionData);
  const prompt = `
  You are a nutritionist. You are given a summary of a user's nutrition data. 
  You need to provide a personalized recommendation for the user based on the data.
  Nutrition Data Summary:
  - Total Calories: ${nutritionData.totalCalories/nutritionData.days}
  - Total Protein: ${nutritionData.totalProtein/nutritionData.days}g
  - Total Fat: ${nutritionData.totalFat/nutritionData.days}g
  - Total Carbs: ${nutritionData.totalCarbs/nutritionData.days}g
  REQUIREMENTS:
  - The recommendations should be based on the user's nutrition data.
  - The recommendations should be personalized to the user.
  - There should be 3-5 recommendations of food.
  - The recommendations should be listed in fewer than 75 words.
  - The recommendations should be in a easy to understand format.
  - Do not include asterisks or other formatting, just raw text`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });
    console.log(response.text);
    return response.text;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
};