const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const expressHandlebars = require('express-handlebars');
const flash = require('connect-flash');
const session = require('express-session');
const mongoose = require('mongoose');
const passport = require('passport');

require( './config/passport');


//Connect to db
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/siteauthentication');

const app = express(); //Start express app

//Setting up renger engine(Handlebars)
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', expressHandlebars({ defaultLayout: 'layout' }));
app.set('view engine', 'handlebars');

//Setting up Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Setting up static path file to server
app.use(express.static(path.join(__dirname, 'public')));

// Setting up Session
app.use(session({
  cookie: { maxAge: 60000 },
  secret: 'dickandballs',
  saveUninitialized: false,
  resave: false
}));

//Setting up passport
app.use(passport.initialize());
app.use(passport.session());

//Starting flash to use flash messaging
app.use(flash());

//Creatre success and error messegin and call then by names success error
app.use((req, res, next) => {
	res.locals.success_message = req.flash('success');
	res.locals.error_message = req.flash('error');
	res.locals.isAuthenticated = req.user ? true : false;
	next(); //Call next to continue
});

//Setting op default routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));


// catch 404 and forward to error handler
app.use((req, res, next) => {
  res.render('notFound');
});

//Setting up port and listen to requests
app.listen(8080, () => console.log('Server started listening on port 8080!'));