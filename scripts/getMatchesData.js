var config = require('../config');
var mongoose = require('mongoose')
// Connect to DB
mongoose.connect(config.db.host + ':' + config.db.port + '/' + config.db.name);
var request = require('sync-request');
var Match = require('../models/matches');
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

function getRegionEndpoint(region) {
	config.riot.regions.forEach(function (reg) {
		if (reg.name === region) return reg.endpoint;
	});
}

while (1) {
	async.waterfall([
		function (cb) {
			conosole.log('began')
			config.riot.api.regions.forEach(function (region) {
				var obj = {
					query: region.endpoint + '/api/lol/' + region.name + '/v4.1/games/ids?beginDate=' + CURRENTTIME + '&api_key=' + config.riot.apiKey,
					region: region.name
				};
				console.log('wat')

				if (!containsObject(get_game_ids_queue, obj, 'query'))
					get_game_ids_queue.push(obj);
			
				console.log('Generated endpoint list')
				console.log(JSON.stringify(get_game_ids_queue));
				CURRENTTIME += TIME_JUMP;
				cb();
			});
		},
		function (cb) {
			if (get_game_ids_queue.length === 0) {
				return cb(null, SLEEP_TIME);
			}
			var currentQuery = get_game_ids_queue.shift();
			var query_result = request('GET', currentQuery.query);
			if (query_result.statusCode === STATUS_CODES.RATE_EXCEEDED) {
				get_game_ids_queue.unshift(currentQuery);
				return cb(null, SLEEP_TIME);
			}
			if (query_result.statusCode === STATUS_CODES.BAD_REQUEST) {
				get_game_ids_queue.unshift(currentQuery);
				return cb(null, SLEEP_TIME);
			} 
			var arrayData = [];
			query.result.getBody.forEach(function (entry) {
				arrayData.push({
					query: getRegionEndpoint(currentQuery.region) + '/api/lol/' + currentQuery.region + '/v2.2/match/find/' + entry + '?api_key=' + config.api.apiKey + '&includeTimeline=false',
					region: currentQuery.region
				});
			});
			get_game_data_queue = get_game_data_queue.concat(arrayData);
			console.log('Game data queue is :')
			console.log(JSON.stringify(get_game_data_queue));
			cb(null, 0)
		},
		function (sleeptime, cb) {
			setTimeout(function () {
				cb();
			}, sleeptime);
		},
		function (cb) {
			var currentQuery = get_game_data_queue.shift();
			var query_result = request('GET', currentQuery.query);
			
			if (query_result.statusCode === STATUS_CODES.RATE_EXCEEDED) {
				return cb(null, SLEEP_TIME);
			}
			var match = new Match();
			var matchData = query_result.getBody();

			match = matchData.matchId;
			match.region = matchData.region.toLowerCase();

			matchData.teams.forEach(function (team) {
				if (team.winner) {
					match.winnerTeamId = team.teamId;
				}
			});

			matchData.participants.forEach(function (participant) {
				if (participant.teamId === match.winnerTeamId) {
					match.championsWin.push(participant.championId);
				} else {
					match.championsLose.push(participant.championId);
				}
			});
			match.save(function (err) {
				cb(err);
			});
		}
		], function (err) {
			if (err) console.log(err);
			else console.log('Rotation done')
		}
	)
}