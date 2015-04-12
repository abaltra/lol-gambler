var express = require('express');
var router 	= express.Router();
var User 	= require('../models/user');
var Bet 	= require('../models/bet');
var config 	= require('../config');

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
		Bet.find( { userId : req.user.id }, function( err, bets ){
			if( err ){
				req.flash('message', err);
				res.redirect('/');
				return;
			}

			var lastTenBets 	= [];
			var wins 			= 0;
			var losses 			= 0;
			for( var i = 0; i < bets.length; ++i ){
				var bet 	= bets[i];
				if( bet.win ){
					wins++;
				}else{
					losses++;
				}
				if( i < 10 )
				{
					lastTenBets.push( bet );
				}
			}

			res.render('home', { 
				user: req.user, 
				bets: lastTenBets,
				wins: wins,
				losses: losses
			});
		}).sort('date')
	});

	/* Handle Logout */
	router.get('/signout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	return router;
}





