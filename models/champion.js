
var mongoose = require('mongoose');

module.exports = mongoose.model('Champion',{
	id: Number,
	name: String,
	portraitURL: String,
	totalAppearances: {
		type: Number,
		default: 0
	}
});