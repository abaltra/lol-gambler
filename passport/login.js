var LocalStrategy   = require('passport-local').Strategy;
var User = require('../models/user');
var bCrypt = require('bcrypt-nodejs');
var DAY = 24 * 60 * 60 * 1000; //One day in ms
var MIN_COINS = 500;

module.exports = function(passport){
	passport.use('login', new LocalStrategy({
            passReqToCallback : true
        },
        function(req, username, password, done) { 
            // check in mongo if a user with username exists or not
            User.findOne({ 'username' :  username }, 
                function(err, user) {
                    // In case of any error, return using the done method
                    if (err){
                        console.log("Error! "+err);
                        return done(err);
                    }
                    // Username does not exist, log the error and redirect back
                    if (!user){
                        console.log('User Not Found with username '+username);
                        return done(null, false, req.flash('message', 'User Not found.'));                 
                    }
                    // User exists but wrong password, log the error 
                    if (!isValidPassword(user, password)){
                        console.log('Invalid Password');
                        return done(null, false, req.flash('message', 'Invalid Password')); // redirect back to login page
                    }

                    if (!user.active) {
                        console.log("User is not active");
                        return done(null, false, req.flash('message', 'Account not activated'));
                    }
                    // User and password both match, return user from done method
                    // which will be treated like success
                    var oldLogin = user.lastSeen;
                    var newLogin = Date.now();
                    var diff = newLogin - oldLogin;
                    var newSeen = {
                        lastSeen: newLogin
                    } 
                    if (diff >= DAY && user.ritoCoins < MIN_COINS){
                        newSeen.ritoCoins = MIN_COINS;
                        req.flash('success', 'Coins awarded!');
                    }
                    User.update({username: user.username}, {$set: newSeen}, function (err, concern) {
                        return done(null, user);
                    });
                }
            );

        })
    );


    var isValidPassword = function(user, password){
        return bCrypt.compareSync(password, user.password);
    }
    
}