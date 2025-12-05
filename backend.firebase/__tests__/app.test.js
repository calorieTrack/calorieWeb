import request from 'supertest';
import { jest } from '@jest/globals';

// Mocks for Firestore DB layer
const mockFirestoreDb = {
  getUser: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  ensureUserExists: jest.fn(),
  getEntriesByDate: jest.fn(),
  getSummaryByDateRange: jest.fn(),
  createEntry: jest.fn(),
  getEntry: jest.fn(),
  updateEntry: jest.fn(),
  deleteEntry: jest.fn(),
  getFoodsByName: jest.fn(),
  getFoods: jest.fn(),
  upsertFood: jest.fn(),
};

// Mock Firebase auth
const mockAuth = {
  createUser: jest.fn(),
};

// Mock modules before importing the app
jest.unstable_mockModule('../firebase.js', () => ({
  auth: mockAuth,
}));

jest.unstable_mockModule('../firestore-db.js', () => mockFirestoreDb);

jest.unstable_mockModule('../middleware.js', () => ({
  verifyIdToken: (req, res, next) => {
    req.user = { uid: 'user123', email: 'user@example.com' };
    next();
  },
  errorHandler: (err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  },
}));

const { default: app } = await import('../index.js');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Health', () => {
  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('Firestore');
  });
});

describe('Entries', () => {
  test('GET /api/entries returns entries for date', async () => {
    mockFirestoreDb.getEntriesByDate.mockResolvedValue([
      { id: 'e1', name: 'Apple', calories: 95, protein: 0.5, fat: 0.3, carbs: 25, date: '2024-01-01' },
    ]);

    const res = await request(app).get('/api/entries?date=2024-01-01');

    expect(res.status).toBe(200);
    expect(mockFirestoreDb.getEntriesByDate).toHaveBeenCalledWith('user123', '2024-01-01');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Apple');
  });

  test('POST /api/entries rejects missing macros', async () => {
    const res = await request(app).post('/api/entries').send({ name: 'Apple', calories: 95 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Macronutrient data required/i);
  });

  test('POST /api/entries creates entry', async () => {
    mockFirestoreDb.createEntry.mockResolvedValue('entry1');
    mockFirestoreDb.getEntry.mockResolvedValue({
      id: 'entry1',
      name: 'Apple',
      calories: 95,
      protein: 0.5,
      fat: 0.3,
      carbs: 25,
      date: '2024-01-01',
    });
    mockFirestoreDb.upsertFood.mockResolvedValue('food1');

    const res = await request(app).post('/api/entries').send({
      name: 'Apple',
      calories: 95,
      protein: 0.5,
      fat: 0.3,
      carbs: 25,
      date: '2024-01-01',
    });

    expect(res.status).toBe(201);
    expect(mockFirestoreDb.createEntry).toHaveBeenCalled();
    expect(mockFirestoreDb.upsertFood).toHaveBeenCalledWith('user123', 'Apple', expect.objectContaining({ calories: 95 }));
    expect(res.body.id).toBe('entry1');
  });
});

describe('Summary', () => {
  test('GET /api/summary returns aggregated data', async () => {
    mockFirestoreDb.getSummaryByDateRange.mockResolvedValue([
      { date: '2024-01-02', totalCalories: 2000, totalProtein: 120, totalFat: 70, totalCarbs: 220, entryCount: 3 },
      { date: '2024-01-01', totalCalories: 1800, totalProtein: 100, totalFat: 60, totalCarbs: 200, entryCount: 2 },
    ]);

    const res = await request(app).get('/api/summary?startDate=2024-01-01&endDate=2024-01-02');

    expect(res.status).toBe(200);
    expect(mockFirestoreDb.getSummaryByDateRange).toHaveBeenCalledWith('user123', '2024-01-01', '2024-01-02');
    expect(res.body).toHaveLength(2);
    expect(res.body[0].date).toBe('2024-01-02');
  });
});

describe('Calorie goal', () => {
  test('GET /api/goal/calories returns default when unset', async () => {
    mockFirestoreDb.getUser.mockResolvedValue(null);
    const res = await request(app).get('/api/goal/calories');
    expect(res.status).toBe(200);
    expect(res.body.calorieGoal).toBe(2000);
  });

  test('PUT /api/goal/updatecalories updates value', async () => {
    mockFirestoreDb.updateUser.mockResolvedValue();
    mockFirestoreDb.getUser.mockResolvedValue({ calorieGoal: 1800 });

    const res = await request(app).put('/api/goal/updatecalories').send({ newCalorieGoal: 1800 });

    expect(res.status).toBe(200);
    expect(mockFirestoreDb.updateUser).toHaveBeenCalledWith('user123', expect.objectContaining({ calorieGoal: 1800 }));
    expect(res.body.calorieGoal).toBe(1800);
  });
});
