
var mongoose = require('mongoose');

module.exports = mongoose.model('User',{
	id: String,
	username: String,
	password: String,
	email: String,
	lastSeen: {
		type: Date,
		default: Date.now
	},
	activationToken: String,
	active: {
		type: Boolean,
		default: false
	},
	ritoCoins: {
		type: Number,
		default: 5000
	},
	isBetting: {
		type: Boolean,
		default: false
	}
});