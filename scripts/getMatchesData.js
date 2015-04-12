// Connect to DB
mongoose.connect(config.db.host + ':' + config.db.port + '/' + config.db.name);
var request = require('sync-request');
var Match = require('../models/match');
var _ = require('lodash');
var async = require('async');
var STARTTIME = 1427865900;
var CURRENTTIME = STARTTIME;
var TIME_JUMP = 5 * 60; //5 minutes in seconds
var SLEEP_TIME = 2 * 60 * 1000; //2 minute in milliseconds
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

async.series([
	function (cb) {
		Match.remove({}, function (err) {
			console.log('Match collection cleared');
			cb();
		});
	},
	function (cb) {
		function magicks = function () {
			if (get_game_ids_queue.length < 100) { //Only enqueue when we have space
				config.riot.regions.forEach(function (region) {
					var call = {query: region.endpoint + 'api/lol/' + region.name + '/v4.1/game/ids?beginDate=' + CURRENTTIME + '&api_key=' + config.riot.apiKey, 
								region: region.name,
								region_endpoint: region.endpoint};
					if (get_game_ids_queue.indexOf(call) !== -1) return;
					get_game_ids_queue.push(call);
					get_game_ids_queue = _.uniq(get_game_ids_queue, 'query');
				});
				CURRENTTIME += TIME_JUMP;
			}
			
			var value = get_game_ids_queue.pop();
			var res = request('GET', value.query);

			if (res.statusCode === STATUS_CODES.OK) {
				var body = JSON.parse(res.body);
				body.forEach(function (gameId) {
					var call = value.region_endpoint + 'api/lol/' + value.region + '/v2.2/match/' + gameId + '?includeTimeline=false&api_token=' + config.riot.apiKey;
					get_game_data_queue.push({query: call,
												region: value.region});
				});
			} else if (res.statusCode === STATUS_CODES.RATE_EXCEEDED {
				get_game_ids_queue.unshift(value); //Return value to top of queue
				setTimeout(magicks, SLEEP_TIME); //Sleep for 2 seconds and restart the process
				return;
			}
		}
		setTimeout(magicks, 100);
	}
	], function (err) {
		if (err) console.log(err);
		else console.log('Process finished successfully')
		process.exit(0);
	})