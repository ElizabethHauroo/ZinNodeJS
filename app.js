require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const User = require('./models/user');
const path = require('path');
const { checkAuthenticated, checkNotAuthenticated } = require('./middleware/authMiddleware');

// Connect to the cloud database
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true });
const app = express();
// Use EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));



app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
  });
  

// Passport authentication configuration
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// Routes Middlewear

app.get('/', (req, res) => {
    res.render('index');
  });

  app.get('/admin', (req, res) => {
    res.render('admin');
  });
  
  app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login');
  });
  
  app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true
  }), (req, res) => {
    if (req.body.username === process.env.ADMIN_USERNAME && req.body.password === process.env.ADMIN_PSWD) {
        // Redirect to admin page
        res.redirect('/admin');
      } else {
        // Redirect to user page
        res.redirect('/');
      }
  });
  
  app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register');
  });
  
  app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
      const user = await User.register(new User({ username: req.body.username }), req.body.password);
      passport.authenticate('local')(req, res, () => {
        res.redirect('/');
      });
    } catch (e) {
      res.redirect('/register');
    }
  });
  
  app.get('/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.sendStatus(500);
      }
      res.redirect('/login');
    });
  });
  
  

//const port = process.env.PORT || 3000;
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});   

// Add a route to stop the server
app.get('/stop', (req, res) => {
    port.close(() => {
      console.log('Server stopped listening on port 3000');
      res.send('Server stopped');
    });
  });

//end Routes

