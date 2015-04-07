var config = require('../config');
var request = require('request');
var mongoose = require('mongoose');
// Connect to DB
mongoose.connect(config.db.host + ':' + config.db.port + '/' + config.db.name);
var Champion = require('../models/champion');
var _ = require('lodash');
var async = require('async');

async.series([
	function (cb) {
		Champion.remove({}, function (err) {
			console.log('Champion collection cleared');
			cb();
		});
	},
	function (cb) {
		request('https://global.api.pvp.net/api/lol/static-data/na/v1.2/champion?champData=image&api_key=' + config.riot.apiKey, function (err, response, body) {
			body = JSON.parse(body);
			var champs = [];
			_.forEach(body.data, function (n, key) {
				champs.push({id: n.id, name: n.name, portraitURL: config.riot.championPortraitEndpoint + n.image.full});
			});
			async.map(champs, function (item, callback) {
				var champ = new Champion();
				champ.id = item.id;
				champ.name = item.name;
				champ.portraitURL = item.portraitURL;
				champ.save(function (err) {
					callback(err);
				})
			}, function (err, results) {
				cb(err);
			});
		});
	}
	], function (err) {
		if (err) console.log(err);
		else console.log('Process finished successfully')
		process.exit(0);
	})

