var express = require('express');
var router = express.Router();
var User = require('../models/user');
var config = require('../config');

var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler 
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	if (req.isAuthenticated())
		return next();
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/');
}

module.exports = function(passport){

	/* GET login page. */
	router.get('/', function(req, res) {
    	// Display the Login page with any flash message, if any
		res.render('index', { message: req.flash('message') });
	});

	/* Handle Login POST */
	router.post('/login', passport.authenticate('login', {
		successRedirect: '/home',
		failureRedirect: '/',
		failureFlash : true  
	}));

	/* GET Registration Page */
	router.get('/signup', function(req, res){
		res.render('register',{message: req.flash('message')});
	});

	/* Handle Registration POST */
	router.post('/signup', passport.authenticate('signup', {
		successRedirect: '/home',
		failureRedirect: '/signup',
		failureFlash : true  
	}));

	/* Handle Activation GET */
	router.get('/activation/:token', function (req, res) {
		User.findOne({activationToken: req.params.token}, {lastSeen: 1}, function (err, user) {
			console.log(user)
			if (err) {
				req.flash('message', err);
				res.redirect('/');
				return;
			}
			if (!user) {
				req.flash('message', 'Token not found');
				res.redirect('/');
				return;
			}
			if (user.lastSeen.getTime() + config.app.activationTokenTTL < new Date().getTime()) {
				req.flash('message', 'Activation token expired');
				res.redirect('/');
				return;
			}

			user.active = true;
			delete user.activationToken;
			user.save(function (err) {
				if (err) {
					req.flash('message', err);
					res.redirect('/');
					return;
				}
				req.flash('message', 'Account activated!');
				res.redirect('/');
				return;
			});
		});
	});

	/* GET Home Page */
	router.get('/home', isAuthenticated, function(req, res){
		res.render('home', { user: req.user });
	});

	/* Handle Logout */
	router.get('/signout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	return router;
}





