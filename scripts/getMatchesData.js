var config = require('../config');
// Connect to DB
mongoose.connect(config.db.host + ':' + config.db.port + '/' + config.db.name);
var request = require('sync-request');
var Match = require('../models/match');
var _ = require('lodash');
var async = require('async');
var STARTTIME = 1427865900;
var CURRENTTIME = STARTTIME;
var TIME_JUMP = 5 * 60; //5 minutes in seconds
var SLEEP_TIME = 2 * 60 * 1000; //2 minutes in milliseconds
var RUN = true;

var get_game_ids_queue = [];
var get_game_data_queue = [];

var STATUS_CODES = {
	OK: 200,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	RATE_EXCEEDED: 429,
	INTERNAL_SERVER_ERROR: 500,
	SERVICE_UNAVAILABLE: 503
};

var FUTURE_TIME_TEXT = 'beginDate is invalid';

function containsObject(arr, object, key) {
	arr.forEach(function (elem) {
		if (elem.key === object.key) return true;
	});
	return false;
}

async.waterfall([
	function (cb) {
		Match.remove({}, function (err) {
			console.log('Match collection cleared');
			cb();
		});
	},
	function (cb) {

		var domagicks = function () {
			config.riot.api.regions.forEach(function (region) {
				var obj = {
					query: region.endpoint + '/api/lol/' + region.name + '/v4.1/games/ids?beginDate=' + CURRENTTIME + '&api_key=' + config.riot.apiKey,
					region: region.name
				};
				if (!containsObject(get_game_ids_queue, obj, 'query'))
					get_game_ids_queue.push(obj);
			});

			if (get_game_ids_queue.length > 0) {
				var currentIdsQueryData = get_game_ids_queue.shift();
				var queryReturnData = request('GET', currentIdsQueryData.query);
				if (queryReturnData.statusCode === STATUS_CODES.RATE_EXCEEDED) {
					get_game_ids_queue.unshift(currentIdsQueryData);
					setTimeout(domagicks, SLEEP_TIME);
					return;
				} else if (queryReturnData.statusCode === STATUS_CODES.BAD_REQUEST) {
					get_game_ids_queue.unshift(currentIdsQueryData);
					setTimeout(domagicks, SLEEP_TIME);
					return;
				} else {
					CURRENTTIME += TIME_JUMP;

				}
			}
		}
	}
	], function (err) {
		if (err) console.log(err);
		else console.log('Process finished successfully')
		process.exit(0);
	})