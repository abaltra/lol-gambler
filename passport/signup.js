var LocalStrategy   = require('passport-local').Strategy;
var User = require('../models/user');
var bCrypt = require('bcrypt-nodejs');
var mailer = require('../utils/mailer');
var config = require('../config');
var async = require('async');
var request = require('request');

var NOT_FOUND = 404;
var RATE_EXCEEDED = 429;
var OK = 200;

module.exports = function(passport){

	passport.use('signup', new LocalStrategy({
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) {

            console.log('signing up')
            if (!username 
                || username.length === 0 
                || !password 
                || password.length === 0
                || !req.param('email') 
                || req.param('email').length === 0) 
            {
                return done(null, false, req.flash('message', 'Username is required'));
            }

            if (password.length < 6) {
                return done(null, false, req.flash('message', 'Password must be at least 6 characters long'));
            }
            findAndEmail = function() {
                async.waterfall([
                    function (cb) {
                        var endpoint = undefined;
                        config.riot.regions.forEach(function (region) {
                            if (region.name === req.param('userRegion')) {
                                endpoint = region.endpoint;
                            }
                        });
                        if (!endpoint) {
                                return cb('Region not found');
                        }
                        parsed_username = username.replace(/ /g, '').toLowerCase();
                        request(endpoint + '/api/lol/' + req.param('userRegion') + '/v1.4/summoner/by-name/' + encodeURIComponent(username) + '?api_key=' + config.riot.apiKey, function (err, response, body) {
                            if (err) return cb('Error retrieving summoner data');
                            if (response.statusCode === NOT_FOUND) {
                                return cb('Summoner not found');
                            }
                            if (response.statusCode === RATE_EXCEEDED) {
                                return cb('Request rate exceeded. Please try again in a few minutes');
                            }
                            if (response.statusCode !== OK) {
                                return cb('Unknown Error');
                            }
                            var resp = JSON.parse(response.body);
                            var obj = {
                                profileIconUrl: config.riot.summonerIconEndpoint + resp[parsed_username].profileIconId + '.png',
                                username: username,
                                region: req.param('userRegion')
                            };
                            cb(null, obj);
                        });
                    },
                    function (user, cb) {
                        User.findOne({'email': req.param('email'), active: true}, function (err, saved_user) {
                            if (err) return cb(err);
                            if (saved_user) return cb('Account already active');                            
                            cb(null, user);
                        });
                    },
                    function (user, cb) {
                        User.findOne({'username': username, active: true}, function (err, saved_user) {
                            if (err) return cb(err);
                            if (saved_user) return cb('Username already in use');
                            cb(null, user);
                        })
                    }
                    ], function (err, results) {
                        if (err) return done(null, false, req.flash('message', err));
                        var user = new User();
                        user.email = req.param('email');
                        user.username = username;
                        user.password = createHash(password);
                        user.activationToken = createHash(username).replace(/\//g, '');
                        user.activationTTL = Date.now() + config.app.accountActivationTokenTTL;
                        user.profileIconURL = results.profileIconUrl;
                        user.region = results.region;

                        user.save(function (err) {
                            if (err) {
                                throw err;
                            }
                            var to = {
                                email: user.email
                            };

                            var content = [
                                {
                                    "name": 'activate_link',
                                    "content": '<a href="' + config.app.client + '/activation/' + user.activationToken + '"">Activate!</a>'
                                }
                            ];
                            mailer.sendEmail(to, 'signup', {content: content, merge: []}, function (err, results) {
                                if (err) {
                                    return done(null, false, req.flash('message', 'Could not send email to ' + req.param('email')));
                                }
                                return done(null, false, req.flash('success', 'Activation email sent to ' + req.param('email') + '. Please be patient, it might take a few minutes.')); 
                            });
                        });
                    });
            };
            // Delay the execution of findOrCreateUser and execute the method
            // in the next tick of the event loop
            process.nextTick(findAndEmail);
        }
    ));

    // Generates hash using bCrypt
    var createHash = function(password){
        return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
    }

}