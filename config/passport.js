const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const User = require('../models/usermodel');


passport.serializeUser((user, done) => {
	done(null, user.id);
});


passport.deserializeUser(async (id, done) => {
	try {
		const user = await User.findById(id);
		done(null, user);
	} catch(error) {
		done(error, null);
	}
});

passport.use('local', new localStrategy({
	usernameField: 'email',
	passwordField: 'password',
	passReqToCallback: false
}, async(email, password, done) => {
	try {
		// if email exists
		const user = await User.findOne({'email': email});

		if (!user) {
			return done(null, false, {message: "unknown User"});
		}

		//check if the password is correct
		const isValid = User.comparePasswords(password, user.password);

		if (!isValid) {
			return done(null, false, {message: 'Unkown password'});

		}

		// Check if account is verified
		if (!user.active) {
			return done(null, false, {message: 'You need to verify your email account'});
		}

		return done(null, user);
	} catch(error) {
		return done(error, false);
	}
}));