# API Documentation

**Base URL:** `http://localhost:4000` (development) or your deployed backend URL

**Backend Versions:**
- `backend/` - SQLite database (synchronous, stable)
- `backend.firebase/` - Firestore database (async, unstable)

Both backends implement identical APIs.
---

## Authentication

Most endpoints require a Firebase ID token in the Authorization header:
```
Authorization: Bearer <firebase_id_token>
```

Get the token from Firebase Authentication SDK on the frontend.

---

## Endpoints

### Health Check

#### `GET /health`
Check if the server is running and configured properly.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-16T12:00:00.000Z",
  "environment": "development",
  "hasUSDAKey": true,
  "hasFirebaseKey": true,
  "hasGeminiKey": true,
  "port": 4000
}
```

---

## Authentication Endpoints

### Register User

#### `POST /api/auth/register`
Create a new user account in Firebase and local database.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "John Doe"
}
```

**Response:**
```json
{
  "uid": "firebase_uid_string",
  "email": "user@example.com",
  "displayName": "John Doe",
  "customToken": "firebase_custom_token"
}
```

**Status Codes:**
- `201` - User created successfully
- `400` - Missing email or password
- `409` - Email already exists
- `500` - Server error

---

### Login

#### `POST /api/auth/login`
Returns instructions for client-side authentication.

**Response:**
```json
{
  "message": "Use Firebase SDK on the frontend to sign in and get an ID token"
}
```

**Note:** Actual authentication happens client-side via Firebase SDK.

---

### Get Current User

#### `GET /api/me`
Get the currently authenticated user's information.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "uid": "firebase_uid",
  "email": "user@example.com",
  "displayName": "John Doe"
}
```

---

## Entry Endpoints

### Get Entries

#### `GET /api/entries?date=YYYY-MM-DD`
Retrieve all food entries for a specific date.

**Query Parameters:**
- `date` (required): Date in YYYY-MM-DD format

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
[
  {
    "id": 1,
    "userId": "firebase_uid",
    "name": "Apple",
    "quantity": "1 medium",
    "calories": 95,
    "protein": 0.5,
    "fat": 0.3,
    "carbs": 25,
    "date": "2025-11-16",
    "createdAt": "2025-11-16T10:30:00.000Z",
    "updatedAt": "2025-11-16T10:30:00.000Z"
  }
]
```

---

### Get Summary

#### `GET /api/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
Get daily calorie and macronutrient totals for a date range.

**Query Parameters:**
- `startDate` (optional): Start date, defaults to 7 days ago
- `endDate` (optional): End date, defaults to today

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
[
  {
    "date": "2025-11-16",
    "totalCalories": 2100,
    "totalProtein": 120,
    "totalFat": 70,
    "totalCarbs": 250,
    "entryCount": 5
  },
  {
    "date": "2025-11-15",
    "totalCalories": 1950,
    "totalProtein": 110,
    "totalFat": 65,
    "totalCarbs": 240,
    "entryCount": 4
  }
]
```

---

### Create Entry

#### `POST /api/entries`
Add a new food entry.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Chicken Breast",
  "quantity": "200g",
  "calories": 330,
  "protein": 62,
  "fat": 7,
  "carbs": 0,
  "date": "2025-11-16"
}
```

**Required Fields:**
- `name` (string): Food name
- `calories` (number): Calorie count
- `protein` (number): Protein in grams
- `fat` (number): Fat in grams
- `carbs` (number): Carbohydrates in grams

**Optional Fields:**
- `quantity` (string): Defaults to "1"
- `date` (string): Date in YYYY-MM-DD format, defaults to today

**Response:**
```json
{
  "id": 5,
  "userId": "firebase_uid",
  "name": "Chicken Breast",
  "quantity": "200g",
  "calories": 330,
  "protein": 62,
  "fat": 7,
  "carbs": 0,
  "date": "2025-11-16",
  "createdAt": "2025-11-16T12:00:00.000Z",
  "updatedAt": "2025-11-16T12:00:00.000Z"
}
```

**Status Codes:**
- `201` - Entry created successfully
- `400` - Missing required fields or invalid data
- `401` - Unauthorized (missing or invalid token)
- `500` - Server error

---

### Update Entry

#### `PUT /api/entries/:id`
Update an existing food entry.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Chicken Breast (Updated)",
  "quantity": "250g",
  "calories": 412,
  "protein": 77,
  "fat": 9,
  "carbs": 0,
  "date": "2025-11-16"
}
```

**Response:**
```json
{
  "id": 5,
  "userId": "firebase_uid",
  "name": "Chicken Breast (Updated)",
  "quantity": "250g",
  "calories": 412,
  "protein": 77,
  "fat": 9,
  "carbs": 0,
  "date": "2025-11-16",
  "createdAt": "2025-11-16T12:00:00.000Z",
  "updatedAt": "2025-11-16T12:30:00.000Z"
}
```

**Status Codes:**
- `200` - Entry updated successfully
- `400` - Missing required fields
- `401` - Unauthorized
- `404` - Entry not found or doesn't belong to user
- `500` - Server error

---

### Delete Entry

#### `DELETE /api/entries/:id`
Delete a food entry.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "message": "Entry deleted"
}
```

**Status Codes:**
- `200` - Entry deleted successfully
- `401` - Unauthorized
- `404` - Entry not found or doesn't belong to user
- `500` - Server error

---

## User Endpoints

### Register User in Database

#### `POST /api/users`
Register the current authenticated user in the local database (if not already registered).

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "displayName": "John Doe"
}
```

**Response:**
```json
{
  "message": "User registered",
  "userId": "firebase_uid"
}
```

**Status Codes:**
- `201` - User registered
- `200` - User already exists
- `401` - Unauthorized
- `500` - Server error

---

### Get Calorie Goal

#### `GET /api/goal/calories`
Get the current authenticated user's calorie goal.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "calorieGoal": 2000
}
```

**Note:** Defaults to 2000 calories if not set.

**Status Codes:**
- `200` - Success
- `401` - Unauthorized

---

### Update Calorie Goal

#### `PUT /api/goal/updatecalories`
Update the current authenticated user's calorie goal.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "newCalorieGoal": 2200
}
```

**Required Fields:**
- `newCalorieGoal` (number): New daily calorie goal (must be a positive number)

**Response:**
```json
{
  "calorieGoal": 2200
}
```

**Status Codes:**
- `200` - Calorie goal updated successfully
- `400` - Missing calorieGoal or invalid value (must be positive number)
- `401` - Unauthorized
- `500` - Server error

---

## Food Database Endpoints

### Autocomplete Food Names

#### `GET /api/foods/autocomplete?q=search_term&limit=10`
Get food name suggestions from the local database for autocomplete.

**Query Parameters:**
- `q` (required): Search term (minimum 2 characters)
- `limit` (optional): Maximum results to return, defaults to 5

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
[
  {
    "name": "Apple",
    "calories": 95,
    "protein": 0.5,
    "fat": 0.3,
    "carbs": 25
  },
  {
    "name": "Apple Juice",
    "calories": 114,
    "protein": 0.2,
    "fat": 0.3,
    "carbs": 28
  }
]
```

---

### Search Foods

#### `GET /api/foods?q=search_term`
Search for foods in the local database.

**Query Parameters:**
- `q` (required): Search term

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Apple",
    "calories": 95,
    "protein": 0.5,
    "fat": 0.3,
    "carbs": 25,
    "dataSource": "local",
    "fdcId": null
  }
]
```

---

### Search USDA FoodData Central

#### `GET /api/foods/search/usda?q=search_term&dataTypes=Foundation,Branded`
Search the USDA FoodData Central database for foods with detailed nutrition information.

**Query Parameters:**
- `q` (required): Search term
- `dataTypes` (optional): Comma-separated list of data types to include. Defaults to "Foundation,SR Legacy"
  - Available types:
    - `Foundation` - Core foods with detailed nutrient composition
    - `SR Legacy` - Standard Reference foods (legacy database)
    - `Branded` - Branded food products
    - `Survey (FNDDS)`(include parentheses) - USDA Food and Nutrient Database for Dietary Studies
- `limit` (optional): Maximum results to return, defaults to 10

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "suggestions": [
    {
      "fdcId": 123456,
      "name": "Chicken, broilers or fryers, breast, meat only, cooked, roasted",
      "calories": 165,
      "protein": 31,
      "fat": 3.6,
      "carbs": 0,
      "dataType": "Foundation",
      "brandOwner": null
    },
    {
      "fdcId": 234567,
      "name": "Chicken Breast, Grilled",
      "calories": 180,
      "protein": 33,
      "fat": 4.2,
      "carbs": 0.5,
      "dataType": "Branded",
      "brandOwner": "Example Brand"
    }
  ]
}
```

**Examples:**
```bash
# Search all default types (Foundation + SR Legacy)
GET /api/foods/search/usda?q=chicken

# Search only branded products
GET /api/foods/search/usda?q=chicken&dataTypes=Branded

# Search multiple types
GET /api/foods/search/usda?q=chicken&dataTypes=Foundation,Branded,Survey%20(FNDDS)
```

**Note:** All nutrition values are per 100g.

**Status Codes:**
- `200` - Search successful
- `400` - Missing search query
- `401` - Unauthorized
- `500` - USDA API error or server error

---

## AI Endpoints

### Get AI Nutrition Suggestions

#### `GET /api/ai/aisuggestions`
> Optional: `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

Get personalized nutrition recommendations based on the user's nutrition data from `StartDate` to `EndDate`. Default to `Today` if unspecified. Uses Gemini API to analyze daily averages and provide food suggestions.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```
"Based on your average daily nutrition over the past week, here are some personalized recommendations: [AI-generated suggestions]"
```

**Note:** 
- Analyzes nutrition data from the past 7 days
- Returns personalized food recommendations based on average daily intake
- Recommendations are generated using Gemini API

**Status Codes:**
- `200` - Suggestions generated successfully
- `401` - Unauthorized
- `500` - AI API error (check GEMINI_API_KEY configuration) or illgal output (non-JSON)

---

## Error Responses

All endpoints may return error responses in this format:

```json
{
  "error": "Error message description"
}
```

Common error status codes:
- `400` - Bad Request (missing or invalid parameters)
- `401` - Unauthorized (missing or invalid Firebase token)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (e.g., duplicate email)
- `500` - Internal Server Error

---

## Notes

### Firebase ID Token
- Obtain from Firebase Authentication SDK: `await user.getIdToken()`
- Token expires after 1 hour
- Include in Authorization header: `Bearer <token>`

### USDA Integration
- Requires USDA_API_KEY in environment variables
- Get free API key from [USDA FoodData Central](https://fdc.nal.usda.gov/api-key-signup.html)
- All USDA nutrition values are per 100g
- Frontend should adjust values based on user's quantity input

### Gemini Integration
- Requires GEMINI_API_KEY in environment variables
- Get free API key from [Google AI Studio](https://makersuite.google.com/app/apikey) or [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- Used for generating personalized nutrition suggestions based on user's weekly nutrition data
- Uses the `gemini-2.5-flash-lite` model
- Add to your `.env` file: `GEMINI_API_KEY=your_api_key_here`

### Date Format
- All dates use ISO 8601 format: `YYYY-MM-DD`
- Timestamps use ISO 8601 with timezone: `YYYY-MM-DDTHH:mm:ss.sssZ`

### Nutrition Values
- `calories`: Whole number
- `protein`, `fat`, `carbs`: Decimal numbers in grams
- All nutrition fields are required when creating/updating entries
