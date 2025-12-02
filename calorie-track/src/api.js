// Frontend API client with Firebase token injection
import { auth } from './firebase';
import { API_URL } from './config';

/**
 * Fetch wrapper that automatically injects Firebase ID token
 */
export const apiFetch = async (endpoint, options = {}) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Not authenticated');
  }

  const idToken = await user.getIdToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${response.status}`);
  }

  // Handle empty responses (like 204 No Content)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }

  // Try to parse as JSON, but handle cases where response body is empty
  try {
    return await response.json();
  } catch (error) {
    // If JSON parsing fails and we got here, it means the response was successful
    // but had no body or invalid JSON. For successful requests, this is usually fine.
    console.warn('Response body could not be parsed as JSON:', error.message);
    return null;
  }
};

/**
 * Fetch entries for a given date
 */
export const getEntries = (date) =>
  apiFetch(`/api/entries?date=${date}`);

/**
 * Create a new entry
 */
export const createEntry = (entry) =>
  apiFetch('/api/entries', {
    method: 'POST',
    body: JSON.stringify(entry),
  });

/**
 * Update an entry
 */
export const updateEntry = (id, entry) =>
  apiFetch(`/api/entries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(entry),                         
  });

/**
 * Delete an entry
 */
export const deleteEntry = (id) =>
  apiFetch(`/api/entries/${id}`, {
    method: 'DELETE',
  });

/**
 * Get daily calorie summary for date range
 */
export const getSummary = (startDate, endDate) =>
  apiFetch(`/api/summary?startDate=${startDate}&endDate=${endDate}`);

/**
 * Get current user info
 */
export const getMe = () =>
  apiFetch('/api/me');

/**
 * Register a new user in local DB (usually called after Firebase sign-up)
 * Body: { displayName? }
 */
export const registerUser = (displayName) =>
  apiFetch('/api/users', {
    method: 'POST',
    body: JSON.stringify({ displayName: displayName || '' }),
  });

/**
 * Get food autocomplete suggestions
 * Query params: ?q=search_term&limit=5
 */
export const getFoodSuggestions = (query, limit = 5) =>
  apiFetch(`/api/foods/autocomplete?q=${encodeURIComponent(query)}&limit=${limit}`);

/**
 * Get all foods for the current user (for bulk loading)
 */
export const getFoods = () =>
  apiFetch('/api/foods');

/**
 * Search USDA FoodData Central for foods
 * @param {string} query - Search term
 * @param {number} limit - Max results
 * @param {string[]} dataTypes - Array of data types to filter by (e.g., ['Foundation', 'Branded'])
 * Returns: { error?, suggestions: [{ fdcId, name, dataType, brandOwner }] }
 */
export const searchUSDAFoods = (query, limit = 10, dataTypes = null) => {
  let url = `/api/foods/search/usda?q=${encodeURIComponent(query)}`;
  if (dataTypes && dataTypes.length > 0) {
    url += `&dataTypes=${dataTypes.join(',')}`;
  }
  return apiFetch(url);
};

/**
 * Get AI nutrition suggestions based on user's last 7 days of nutrition data
 * Returns: { suggestions: string, nutritionSummary: {...} }
 */
export const getAISuggestions = () =>
  apiFetch('/api/ai/aisuggestions');