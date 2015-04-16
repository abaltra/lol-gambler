
var mongoose = require('mongoose');

module.exports = mongoose.model('Match',{
	id: Number,
	region: String,
	championsWin: Array,
	championsLose: Array,
	winnerTeamId: Number
});