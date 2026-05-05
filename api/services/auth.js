const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

// Local Strategy
passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return done(null, false, { message: 'Email not registered' });
  
  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) return done(null, false, { message: 'Incorrect password' });
  
  return done(null, user);
}));

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
  }, (accessToken, refreshToken, profile, done) => {
    // 1. Check if user already exists by google_id
    let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(profile.id);
    
    if (!user) {
      const email = profile.emails[0].value;
      // 2. Check if user exists by email (to link account)
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      
      if (user) {
        // Link google_id to existing account
        db.prepare('UPDATE users SET google_id = ?, profile_pic = ? WHERE id = ?').run(
          profile.id, profile.photos[0].value, user.id
        );
      } else {
        // Create new account
        const id = uuidv4();
        db.prepare('INSERT INTO users (id, email, google_id, full_name, profile_pic) VALUES (?, ?, ?, ?, ?)').run(
          id, email, profile.id, profile.displayName, profile.photos[0].value
        );
      }
      // Fetch updated user
      user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(profile.id);
    }
    
    return done(null, user);
  }));
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  done(null, user);
});

module.exports = passport;
