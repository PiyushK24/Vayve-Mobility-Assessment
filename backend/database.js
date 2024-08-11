const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./tic-tac-toe.db');

function initialize() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      draws INTEGER DEFAULT 0,
      matches_played INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      board TEXT,
      user_symbol TEXT,
      ai_symbol TEXT,
      result TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
  });
}

module.exports = {
  initialize,
  db
};
