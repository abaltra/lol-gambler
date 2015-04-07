module.exports = {
	'db': {
		'name': 'lol-bets',
		'host': 'localhost',
		'port': 27017
	},
	'mandrill': {
		'apiKey': 'e7J3PZMm1KF4qkXLP2nmnw'
	},
	'riot': {
		'apiKey': '040f1207-45a5-45f7-bdc5-e41356ce433e'
	},
	'app': {
		'startingGold': 500,
		'accountActivationTokenTTL': 20 * 60 * 1000, //20 minutes in miliseconds
		'port': 8080,
		'client': 'localhost:8080'
	}
}