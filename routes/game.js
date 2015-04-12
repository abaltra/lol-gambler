var express = require('express');
var router = express.Router();
var User = require('../models/user');
var Champion = require('../models/champion');
var Bet = require('../models/bet');
var Match = require('../models/matches');
var config = require('../config');
var async = require('async');
var _ = require('lodash');

var OK = 200;
var ERRORS = {
	MALFORMED: 400,
	UNAUTHORIZED: 401,
	NOTFOUND: 404,
	SERVER: 500
};

var BETTYPE = {
	CHAMPION: 'champ',
	MATCH: 'match'
};

var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler 
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	if (req.isAuthenticated())
		return next();
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/');
}

module.exports = function () {

	//PUBLIC
	router.get('/champion/:id', function (req, res) {
		Champion.findOne({id: req.params.id}, {}, function (err, champ) {
			if (err || !champ) {
				return res.status(ERRORS.NOTFOUND).send();
			} else {
				res.status(OK).send(JSON.stringify(champ));
			}
		});
	});

	router.get('/leaderboard', function (req, res) {
		User.find({active: true}, {username: 1, ritoCoins: 1}, {sort: {ritoCoins: 1}}, function (err, users) {
			if (err) return res.status(ERRORS.SERVER).send(err);
			return res.status(OK).send(JSON.stringify(users));
		});
	});

	//PRIVATE
	router.get('/user/:id', function (req, res) {
		User.findOne({id: req.params.id}, {username: 1, email: 1, ritoCoins: 1}, function (err, user) {
			if (err || !user) return res.status(ERRORS.NOTFOUND).send();
			return res.status(OK).send(JSON.stringify(user));
		});
	});

	router.get('/bet', isAuthenticated, function(req, res){
		Champion.find({}, function (err, champs) {
			if (err || !champs) {
				req.flash('message', err);
				res.redirect('/');
				return;
			}

			res.render('bet', { 
				user 	: req.user,
				champs 	: champs
			});
		});
	});

	router.post('/bet', isAuthenticated, function (req, res) {
		if (!req.body.userid || !req.body.amount || !req.body.type || !req.body.value) return res.status(ERRORS.MALFORMED).send('All parameters are required');
		var amount = req.body.amount;
		var type = req.body.type;
		var value = req.body.value;
		var userid = req.body.userid;

		async.waterfall([
			function (cb) {
				//Check if user can bet
				User.findOne({id: userid}, {ritoCoins: 1, isBetting: 1}, function (err, user) {
					if (err || !user) return cb(ERRORS.SERVER);
					if (user.ritoCoins < amount) return cb(ERRORS.MALFORMED);
					if (user.isBetting) return cb(ERRORS.UNAUTHORIZED);
					user.isBetting = true;
					user.save(function (err) {
						if (err) return cb(ERRORS.SERVER);
						cb(null, user);
					})
				})
			},
			function (user, cb) {
				// Retrieve all previous bets
				Bet.find({userId: userid}, {matchId: 1}, function (err, matches) {
					if (err) return cb(ERRORS.SERVER);
					matches = [].concat(matches);
					var matchIds = _.pluck(matches, 'matchId');
					cb(null, user, matchIds);
				});
			},
			function (user, matchIds, cb) {
				//Find a game where the user hasn't placed a bet
				Match.findOne({id: {$nin: matchIds}}, {}, function (err, matches) {
					if (err) return cb(ERRORS.SERVER);
					if (!matches || matches.length === 0) return cb(ERRORS.NOTFOUND);
					var length = matches.length;
					var index = Math.floor(Math.random() * length);
					cb(null, user, matches[index]);
				});
			},
			function (user, match, cb) {
				var bet = new Bet();
				bet.matchId = match.id;
				bet.userId = user.id;
				bet.type = type;
				bet.value = value;
				bet.amount = amount;

				if (bet.type === BETTYPE.MATCH) {
					if (match.winnerTeamId === value) {
						bet.win = true;
						bet.winnings = amount * 1.1;
					} else {
						bet.win = false;
						bet.winnings = 0;
					}
					cb(null, user, bet);
				} else if (bet.type === BETTYPE.CHAMPION) {
					if (match.championsWin.indexOf(Integer.parseInt(bet.value))) {
						Champion.findOne({id: Integer.parseInt(bet.value)}, {appearanceRatio: 1}, function (err, champ) {
							if (err) return cb(ERRORS.SERVER);
							if (!champ) return cb(ERRORS.NOTFOUND);
							bet.win = true;
							bet.winnings = bet.amount * (1.1 + (0.9 - champ.appearanceRatio));
							cb(null, user, bet);
						});
					} else {
						bet.win = false;
						bet.winnings = 0;
						cb(null, user, bet);
					}
				}
			},
			function (user, bet, cb) {
				bet.save(function (err) {
					if (err) return cb(ERRORS.SERVER); 
					cb(user, bet);
				})
			},
			function (user, bet, cb) {
				user.ritoCoins -= bet.amount;
				user.ritoCoins += bet.winnings;
				user.save(function (err) {
					if (err) return cb(ERRORS.SERVER);
					cb(null, bet);
				})
			}
			], function (err, results) {
				User.findOne({id: userid}, {isBetting: 1}, function (error, user) {
					if (error || !user) return res.status(ERRORS.NOTFOUND).send('Not found');
					user.isBetting = false;
					user.save(function (error) {
						if (error) return  res.status(ERRORS.SERVER).send();
						if (err) {
							if (err === ERRORS.MALFORMED) return res.status(ERRORS.MALFORMED).send('Malformed Query');
							else if (err === ERRORS.UNAUTHORIZED) return res.status(ERRORS.UNAUTHORIZED).send('Access Unauthorized');
							else if (err === ERRORS.NOTFOUND) return res.status(ERRORS.NOTFOUND).send('Not found');
							else return res.status(ERRORS.SERVER).send();
						}
						return res.status(OK).send(JSON.stirngify(bet));
					});
				});
		});
	});

	return router;
};