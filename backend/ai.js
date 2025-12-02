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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Explain how AI works in a few words",
    });
    console.log(response.text);
    return response.text;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
};