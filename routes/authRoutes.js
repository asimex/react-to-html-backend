const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/github', passport.authenticate('github', { scope: ['repo'] }));

router.get('/github/callback',
  passport.authenticate('github', {
    failureRedirect: '/',
    session: true
  }),
  (req, res) => {
    res.redirect('http://localhost:3000/dashboard'); // Frontend redirect
  }
);

router.get('/me', (req, res) => {
  res.json(req.user || {});
});

module.exports = router;
