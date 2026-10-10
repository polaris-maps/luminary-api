// Every table uses CREATE TABLE IF NOT EXISTS, so this is safe to run on every start.
// Later tickets append new tables to the bottom of this string.
export const schema = `
CREATE TABLE IF NOT EXISTS building (
  id           INTEGER PRIMARY KEY,  -- keep the old ids, the app hardcodes some of them
  full_name    TEXT NOT NULL,
  abbreviation TEXT,
  latitude     REAL NOT NULL,
  longitude    REAL NOT NULL,
  campus_id    INTEGER NOT NULL DEFAULT 1,
  geo_address  TEXT
);

CREATE TABLE IF NOT EXISTS door (
  id           INTEGER PRIMARY KEY,
  building_id  INTEGER NOT NULL,
  latitude     REAL NOT NULL,
  longitude    REAL NOT NULL,
  is_indoor    INTEGER NOT NULL DEFAULT 0,  -- SQLite has no booleans: 0 = false, 1 = true
  is_emergency INTEGER NOT NULL DEFAULT 0,
  is_service   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ramp (
  id          INTEGER PRIMARY KEY,
  building_id INTEGER,
  latitude    REAL NOT NULL,
  longitude   REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS report (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  location          TEXT,
  latitude          REAL NOT NULL,
  longitude         REAL NOT NULL,
  description       TEXT,
  status            TEXT NOT NULL DEFAULT 'Open',  -- 'Open' or 'Resolved'
  opened_at         INTEGER NOT NULL,              -- milliseconds since 1970
  closed_at         INTEGER,
  is_permanent      INTEGER NOT NULL DEFAULT 0,
  votes             INTEGER NOT NULL DEFAULT 0,
  image             TEXT,                          -- base64 JPEG, or NULL
  categories        TEXT NOT NULL DEFAULT '[]',    -- JSON array of strings
  qna               TEXT,                          -- JSON text from the app, store it unchanged
  device_id         TEXT,                          -- used in Backend-Rewrite 12
  last_confirmed_at INTEGER,                       -- used in Backend-Rewrite 13
  deleted_at        INTEGER                        -- set when deleted; the row is kept
);
`;
