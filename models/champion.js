
var mongoose = require('mongoose');

module.exports = mongoose.model('Champion',{
	id: Number,
	name: String,
	title: String,
	portraitURL: String,
	totalAppearances: {
		type: Number,
		default: 0
	},
	appearanceRatio : {
		type: Number,
		default: 0
	}
});