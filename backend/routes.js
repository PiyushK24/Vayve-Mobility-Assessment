const express = require('express');
const router = express.Router();
const db = require('./database').db;

// Register a user
router.post('/register', (req, res) => {
  const { username } = req.body;

  // Check if user already exists
  db.get('SELECT id FROM users WHERE username = ?', [username], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (row) {
      // User exists, return the userId
      res.json({ userId: row.id });
    } else {
      // User does not exist, insert a new record
      db.run('INSERT INTO users (username) VALUES (?)', [username], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ userId: this.lastID });
      });
    }
  });
});

// Record game results
router.post('/play', (req, res) => {
  const { userId, board, userSymbol, aiSymbol, result } = req.body;
  
  // Record the game
  db.run('INSERT INTO games (user_id, board, user_symbol, ai_symbol, result) VALUES (?, ?, ?, ?, ?)', 
      [userId, JSON.stringify(board), userSymbol, aiSymbol, result], function(err) {
      if (err) {
          return res.status(500).json({ error: err.message });
      }

      // Update user stats
      const updateQuery = `
          UPDATE users
          SET matches_played = matches_played + 1,
              wins = wins + ?,
              losses = losses + ?,
              draws = draws + ?
          WHERE id = ?
      `;
      const resultUpdate = {
          'win': [1, 0, 0],
          'loss': [0, 1, 0],
          'draw': [0, 0, 1],
          'pending': [0, 0, 0]
      }[result] || [0, 0, 0];
      
      db.run(updateQuery, [...resultUpdate, userId], (err) => {
          if (err) {
              return res.status(500).json({ error: err.message });
          }
          res.json({ success: true });
      });
  });
});


// Get leaderboard
router.get('/leaderboard', (req, res) => {
  db.all(`SELECT username, matches_played, wins, draws, losses
          FROM users
          ORDER BY wins DESC
          LIMIT 10`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ leaderboard: rows });
  });
});


module.exports = router;
