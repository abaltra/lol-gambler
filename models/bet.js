
var mongoose = require('mongoose');

module.exports = mongoose.model('Bet',{
	matchId: Number,
	userId: String,
	amount: Number,
	win: Boolean,
	winnings: Number,
	type: String,
	value: String,
	date: {
		type: Date,
		default: Date.now
	}
});