const express = require('express');
const router = express.Router();
const Joi = require('joi'); // Validation with joi
const passport = require('passport');
const randomString = require("randomstring");
//Import user mogoose model
const User = require('../models/usermodel');
const mailer = require('../misc/mailer');

//Validation userShcema

const userShcema = Joi.object().keys({
	email: Joi.string().required(),
	username: Joi.string().required(),
	//from a to z upperand lower and numbers from 0-9 from 3 up to 30 chars
	password: Joi.string().regex(/^[a-zA-z0-9]{3,30}$/).required(),
	// Confirm matches to pass
	confirmationPassword: Joi.any().valid(Joi.ref('password')).required()
});


//Authorization function to handle page access
const isAuthenticated = (req, res, next) => {
	if (req.user) {
		return next();
	} else {
		req.flash('error', 'Sorry, but you must be registered first!');
		res.redirect('/');
	}
};

//Authorization function to handle page access restrict
const isNotAuthenticated = (req, res, next) => {
	if (req.user) {
		req.flash('error', 'Sorry, but you allready logged in!');
		res.redirect('/');
	} else {
		return next();
	}
};


router.route('/register')
  .get(isNotAuthenticated, (req, res) => {
    res.render('register');
  })

  .post(async (req, res, next) => {
    //Joi.validate 1param = what to valudate 2param against what to validate.
    //Returns and object stored it result variable
    try{
	    const result = Joi.validate(req.body, userShcema); 
	    if (result.error) { //if result object contains subobject error (if its not null)
	    	req.flash('error', 'Data is not valid please try again'); // Send error message with custom message
	    	res.redirect('/users/register'); //Redirect to register page and try again.
	    	return; 
	    }

	    //Checking if email exists but not in req.body but in result.value. (same thing because of joi) 
	    const user = await User.findOne({'email': result.value.email});
	    if (user) {
	    	//Throuw a specific error for email
	    	req.flash('error', 'Email is allready inuse');
	    	res.redirect('/users/register');
	    }

	    // If email dose not exists and all is good hash password and save the use to db
	    const hash = await User.hashPassword(result.value.password);

	    //Before the save process generate token
	    const secretToken = randomString.generate(); //Generates reandom string from randomstring package   
	    result.value.secretToken = secretToken;

	    //Flag the account as inactive untill activating secret token
	    result.value.active = false;

	   //Save new user to the db
	   //First delete the confimation password to not get stored in db
	   delete result.value.confirmationPassword;
	   //Replace password that was written to the hashed one
	   result.value.password = hash;
	   //Await to promise and save new user into var.
	   const newUser = await new User(result.value);
	   await newUser.save();

	   // Compose and email and send token
	   const html = `Hi there,
	   <br/>
	   Thank you for registering to my site!!
	   <br/><br/>
	   Please verify your email by coping the following token:
	   <br/>
	   Token: <b>${secretToken}</b>
	   <br/>
	   On the following page: <a href="http://localhost:8080/user/verify">http:localhost:8080/users/verify</a>
	   </br><br>
	   Have a plesant day!`;

	   //Send the email
	   await mailer.sendEmail('admin@mysite.com', 'Please verify you email',  result.value.email, html);

	   //Flash a success message
	   req.flash('success', 'Please check your email for verification');
	   res.redirect('/users/login');
	} catch(error) {
		next(error);
	}
  });

router.route('/login')
  .get(isNotAuthenticated, (req, res) => {
    res.render('login');
  })

  .post(passport.authenticate('local', {
  	successRedirect: '/users/dashboard',
  	failureRedirect: '/users/login',
  	failureFlash: true,
  }));

//Cheks user object in request if existing
router.route('/dashboard')	
	.get(isAuthenticated, (req, res) => {
		res.render('dashboard', {
			username: req.user.username
		});
	});


router.route('/verify')
	.get(isNotAuthenticated, (req, res, next)=> {
		res.render('verify');
	})

	.post(async (req, res, next)=> {
		try {
			const secretToken = req.body.secretToken;

			//Find the account and match the secret token
			const user = await User.findOne({ 'secretToken': secretToken.trim() });

			if (!user) {
				req.flash('error', 'No user found');
				res.redirect('/users/verify');
				return;
			}

			user.active = true;
			user.secretToken = '';
			await user.save();

			req.flash('success', 'Thank you now you may log in');
			res.redirect('/user/login');
			
		} catch(error) {
			next(error);
		}
	});

//Cheks user object in request if existing
router.route('/logout')	
	.get(isAuthenticated, (req, res) => {
		req.logout();
		req.flash('success', 'Successfully logged out. Hope to see you soon');
		res.redirect('/');
	});


module.exports = router;