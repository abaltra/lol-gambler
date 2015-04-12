from pymongo import MongoClient
import requests
import time
from collections import deque
import json

STARTTIME = 1427865900
CURRENTTIME = STARTTIME
TIME_JUMP = 5 * 60 #5 minutes in seconds
SLEEP_TIME = 2 * 60 * 1000 #2 minutes in milliseconds
APITOKEN = '040f1207-45a5-45f7-bdc5-e41356ce433e'

client = MongoClient('localhost', 27017)
db = client['lol-bets']

queries_for_ids = deque([])
queries_for_match_data = deque([])

matches_db = db.matches
champions_db = db.champions

match_count = 0.0

regions = [
	{'endpoint': 'https://br.api.pvp.net', 'name': 'br'},
	{'endpoint': 'https://na.api.pvp.net', 'name': 'na'},
	{'endpoint': 'https://las.api.pvp.net', 'name': 'las'},
	{'endpoint': 'https://lan.api.pvp.net', 'name': 'lan'},
	{'endpoint': 'https://oce.api.pvp.net', 'name': 'oce'},
	{'endpoint': 'https://eune.api.pvp.net', 'name': 'eune'}
]

def existsInArray(arr, element, key):
	for elem in arr:
		if elem[key] == element[key]:
			return True
	return False

while True:
	print 'Starting loop'
	for region in regions:
		query = {
			'query': '%s/api/lol/%s/v4.1/game/ids?beginDate=%s&api_key=%s' % (region['endpoint'], region['name'], CURRENTTIME, APITOKEN),
			'region': region['name'],
			'endpoint': region['endpoint']
		}

		if not existsInArray(queries_for_ids, query, 'query'):
			queries_for_ids.append(query)

	CURRENTTIME += TIME_JUMP
	if len(queries_for_ids) == 0:
		continue

	currentQuery = queries_for_ids.popleft()

	print "Querying: %s" % currentQuery['query'] 
	try:
		r = requests.get(currentQuery['query'])
	except:
		CURRENTTIME -= TIME_JUMP
		time.sleep(SLEEP_TIME)
		continue

	if r.status_code == 429:
		queries_for_ids.appendleft(currentQuery)
		time.sleep(SLEEP_TIME)
		continue

	if r.status_code == 400:
		queries_for_ids.appendleft(currentQuery)
		CURRENTTIME -= TIME_JUMP
		time.sleep(SLEEP_TIME)
		continue

	if r.status_code == 200:
		print 'content is'
		print r.content
		for id in json.loads(r.content):
			query = {
				'query': '%s/api/lol/%s/v2.2/match/%s?includeTimeline=false&api_key=%s' % (currentQuery['endpoint'], currentQuery['region'], id, APITOKEN),
				'region': currentQuery['region']
			}
			if not existsInArray(queries_for_match_data, query, 'query'):
				queries_for_match_data.append(query)

		if len(queries_for_match_data) == 0:
			continue

		currentQuery = queries_for_match_data.popleft()

		try:
			r = requests.get(currentQuery['query'])
		except:
			queries_for_match_data.appendleft(currentQuery)
			time.sleep(SLEEP_TIME)
			continue

		print currentQuery['query']
		if r.status_code == 429:
			queries_for_match_data.appendleft(currentQuery)
			time.sleep(SLEEP_TIME)
			continue

		print 'match data!'
		data = json.loads(r.content)
		match = {
			'id': data['matchId'],
			'region': data['region'].lower(),
			'championsWin': [],
			'championsLose': []
		}

		for team in data['teams']:
			if team['winner'] == True:
				match['winnerTeamId'] = team['teamId']

		for participant in data['participants']:
			if participant['teamId'] == match['winnerTeamId']:
				match['championsWin'].append(participant['championId'])
			else:
				match['championsLose'].append(participant['championId'])

		print 'match data to save...'
		print match
		matches_db.insert_one(match)
		match_count += 1.0

		for champ in match['championsWin']:
			champ_data = champions_db.find_one({'id': champ})
			champ_data['totalAppearances'] += 1
			champ_data['appearanceRatio'] = (champ_data['totalAppearances']*1.0) / match_count
			champions_db.update_one({'id': champ}, {'$set': {'appearanceRatio': champ_data['appearanceRatio'], 'totalAppearances': champ_data['totalAppearances']}})

		for champ in match['championsLose']:
			champ_data = champions_db.find_one({'id': champ})
			champ_data['totalAppearances'] += 1
			champ_data['appearanceRatio'] = (champ_data['totalAppearances']*1.0) / match_count
			champions_db.update_one({'id': champ}, {'$set': {'appearanceRatio': champ_data['appearanceRatio'], 'totalAppearances': champ_data['totalAppearances']}})

	else:
		print t.status_code
		