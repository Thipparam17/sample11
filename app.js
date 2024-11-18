const express = require('express')
const app = express()
app.use(express.json())
const path = require('path')
const dbpath = path.join(__dirname, 'cricketMatchDetails.db')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
let db = null
const intilizadbandserver = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server started')
    })
  } catch (e) {
    console.log(`db error ${e.message}`)
    process.exit(1)
  }
}
intilizadbandserver()

const playerdetails = dbobject => {
  return {
    playerId: dbobject.player_id,
    playerName: dbobject.player_name,
  }
}

const matchdetails = dbobject => {
  return {
    matchId: dbobject.match_id,
    match: dbobject.match,
    year: dbobject.year,
  }
}

const matchscore = dbobject => {
  return {
    playerMatchId: dbobject.player_match_id,
    playerId: dbobject.player_id,
    matchId: dbobject.match_id,
    score: dbobject.score,
    fours: dbobject.fours,
    sixes: dbobject.sixes,
  }
}
app.get('/players/', async (request, response) => {
  const selctquery = `select * from player_details order by player_id`
  const players = await db.all(selctquery)
  response.send(players.map(each => playerdetails(each)))
})

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const selctquery = `select * from player_details where player_id=${playerId}`
  const playerbasedonid = await db.get(selctquery)
  response.send(playerdetails(playerbasedonid))
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const details = request.body
  const {playerName} = details
  const updatequery = `update player_details set 
  player_name='${playerName}' where player_id=${playerId};`
  await db.run(updatequery)
  response.send('Player Details Updated')
})

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const selctquery = `select * from match_details where match_id=${matchId}`
  const match = await db.get(selctquery)
  response.send(matchdetails(match))
})

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const selctquery = `select player_match_score.match_id as matchId , match_details.match as match ,
  match_details.year as year from
  player_match_score natural join match_details where player_match_score.player_id
  =${playerId}`
  const player = await db.all(selctquery)
  response.send(player)
})

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const selctquery = `select player_details.player_id as playerId,
  player_details.player_name as playerName from player_match_score natural join player_details
   where match_id
  =${matchId}`
  const match = await db.all(selctquery)
  response.send(match)
})

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const playerQuery = `
  select player_details.player_id as playerId,
  player_details.player_name as playerName,
  sum(player_match_score.score) as totalScore,
  sum(fours) as totalFours,
  sum(sixes) as totalSixes from player_details inner join player_match_score on
  player_details.player_id=player_match_score.player_id 
  where player_details.player_id=${playerId} `
  const play = await db.get(playerQuery)
  response.send(play)
})

module.exports = app
