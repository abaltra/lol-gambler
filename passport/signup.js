var LocalStrategy   = require('passport-local').Strategy;
var User = require('../models/user');
var bCrypt = require('bcrypt-nodejs');
var mailer = require('../utils/mailer');
var config = require('../config');
var async = require('async');

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
                async.parallel([
                    function (cb) {
                        User.findOne({'email': req.param('email'), active: true}, function (err, user) {
                            console.log('findinf email')
                            if (err) return cb(err);
                            if (user) return cb('Account already active');                            
                            cb();
                        });
                    },
                    function (cb) {
                        User.findOne({'username': username, active: true}, function (err, user) {
                            console.log('finding username')
                            if (err) return cb(err);
                            if (user) return cb('Username already in use');
                            cb();
                        })
                    }
                    ], function (err, results) {
                        if (err) return done(null, false, req.flash('message', err));
                        console.log('creatinf user')
                        var user = new User();
                        user.email = req.param('email');
                        user.username = username;
                        user.password = createHash(password);
                        user.activationToken = createHash(username).replace(/\//g, '');
                        user.activationTTL = Date.now() + config.app.accountActivationTokenTTL;

                        user.save(function (err) {
                            console.log('user saved')
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
                                console.log('email sent')
                                console.log(results)
                                console.log(err);
                                if (err) {
                                    return done(null, false, req.flash('message', 'Could not send email to ' + req.param('email')));
                                }
                                return done(null, false, req.flash('success', 'Activation email sent to ' + req.param('email'))); 
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