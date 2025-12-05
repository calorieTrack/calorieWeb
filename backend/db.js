import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'data.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// WAL (Write-Ahead Logging) allows readers and writers to work simultaneously
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

// Create users table
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    displayName TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    calorieGoal INTEGER DEFAULT 2000
  )
`).run();

// Create entries table with userId foreign key
db.prepare(`
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    name TEXT NOT NULL,
    quantity TEXT,
    calories INTEGER NOT NULL,
    date TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  )
`).run();

// Add nutrition columns to entries table if they don't exist (for backward compatibility)
const entriesTableInfo = db.prepare("PRAGMA table_info(entries)").all();
const entriesColumnNames = entriesTableInfo.map(col => col.name);

if (!entriesColumnNames.includes('protein')) {
  db.prepare('ALTER TABLE entries ADD COLUMN protein REAL').run();
  console.log('Added protein column to entries table');
}
if (!entriesColumnNames.includes('fat')) {
  db.prepare('ALTER TABLE entries ADD COLUMN fat REAL').run();
  console.log('Added fat column to entries table');
}
if (!entriesColumnNames.includes('carbs')) {
  db.prepare('ALTER TABLE entries ADD COLUMN carbs REAL').run();
  console.log('Added carbs column to entries table');
}

// Set default values for existing entries that have NULL nutrition data
if (!entriesColumnNames.includes('protein')) {
  db.prepare('UPDATE entries SET protein = 0 WHERE protein IS NULL').run();
  db.prepare('UPDATE entries SET fat = 0 WHERE fat IS NULL').run();
  db.prepare('UPDATE entries SET carbs = 0 WHERE carbs IS NULL').run();
  console.log('Initialized nutrition data for existing entries');
}

// Create index for faster queries
db.prepare(`
  CREATE INDEX IF NOT EXISTS idx_entries_userId_date ON entries(userId, date)
`).run();

// Create foods table to track foods and calories for autocomplete + nutrients
db.prepare(`
  CREATE TABLE IF NOT EXISTS foods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    name TEXT NOT NULL,
    calories INTEGER NOT NULL,
    protein REAL,
    fat REAL,
    carbs REAL,
    usageCount INTEGER DEFAULT 1,
    lastUsed TEXT NOT NULL,
    usdaFdcId TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(userId, name)
  )
`).run();

// Add columns if they don't exist (for backward compatibility)
const foodsTableInfo = db.prepare("PRAGMA table_info(foods)").all();
const columnNames = foodsTableInfo.map(col => col.name);

if (!columnNames.includes('protein')) {
  db.prepare('ALTER TABLE foods ADD COLUMN protein REAL').run();
}
if (!columnNames.includes('fat')) {
  db.prepare('ALTER TABLE foods ADD COLUMN fat REAL').run();
}
if (!columnNames.includes('carbs')) {
  db.prepare('ALTER TABLE foods ADD COLUMN carbs REAL').run();
}
if (!columnNames.includes('usdaFdcId')) {
  db.prepare('ALTER TABLE foods ADD COLUMN usdaFdcId TEXT').run();
}
if (!columnNames.includes('createdAt')) {
  db.prepare('ALTER TABLE foods ADD COLUMN createdAt TEXT').run();
}

// Create index for faster food lookups
db.prepare(`
  CREATE INDEX IF NOT EXISTS idx_foods_userId_name ON foods(userId, name)
`).run();

export default db;
