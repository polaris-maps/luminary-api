export const tables = `
CREATE TABLE IF NOT EXISTS building (
  id INTEGER PRIMARY KEY,
  full_name TEXT NOT NULL,
  abbreviation TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  campus_id INTEGER NOT NULL DEFAULT 1,
  geo_address TEXT
);

CREATE TABLE IF NOT EXISTS door (
  id INTEGER PRIMARY KEY,
  building_id INTEGER NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  is_indoor INTEGER NOT NULL DEFAULT 0,
  is_emergency INTEGER NOT NULL DEFAULT 0,
  is_service INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ramp (
  id INTEGER PRIMARY KEY,
  building_id INTEGER,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS report (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Open',
  opened_at INTEGER NOT NULL,
  closed_at INTEGER,
  is_permanent INTEGER NOT NULL DEFAULT 0,
  votes INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  categories TEXT NOT NULL DEFAULT '[]',
  qna TEXT,
  device_id TEXT,
  last_confirmed_at INTEGER,
  deleted_at INTEGER
);
`;
