//Import dependencies
const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

//Added
const bodyParser= require('body-parser')
const multer = require('multer');
fs = require('fs-extra')

//Import classes
const {LiveGames} = require('./utils/liveGames');
const {Players} = require('./utils/players');

const publicPath = path.join(__dirname, '../public');
var app = express();
var server = http.createServer(app);
var io = socketIO(server);
var games = new LiveGames();
var players = new Players();

//Mongodb setup
var MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var mongoDbUrl = process.env.MONGODB_URI || "mongodb://localhost:27017/";

// Not currently used.
app.use(bodyParser.urlencoded({extended: true}))
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
})
var upload = multer({ storage: storage })

app.use(express.static(publicPath));
app.set('port', (process.env.PORT || 3000) );

//Starting server on port 3000
server.listen(app.get('port'), () => {
    console.log("Server started on port 3000");
});


// Not currently used.
app.post('/uploadfile', upload.single('myFile'), (req, res) => {
    const file = req.file
    if (!file) {
        const error = new Error('Please upload a file')
        error.httpStatusCode = 400
        return res.end(error)
    }
    return res.end("ok");
})

app.post('/uploadimage', upload.single('myImage'), (req, res, next) => {
    console.log("req.file.originalname: " + req.file.originalname)

    var img = fs.readFileSync(req.file.path);
    var encode_image = img.toString('base64');

    var finalImg = {
        name: req.file.originalname,
        contentType: req.file.mimetype,
        image:  new Buffer(encode_image, 'base64')
   };
    
    MongoClient.connect(mongoDbUrl, function(err, db) {
        if (err) throw err;
        var dbo = db.db("heroku_3zqkgxjm");
        dbo.collection('kahootGamesImages').insertOne(finalImg, (err, result) => {
            console.log(result)

            if (err) {
                console.log("err: " + err);
                const error = new Error('Please upload a file')
                error.httpStatusCode = 400
                return next(error);
            }
        
            console.log('saved to database')
            db.close();
            return res.end("ok");
        });
    });
    
})

app.get('/photobyname/:name', (req, res, next) => {
var filename = req.params.name;

    MongoClient.connect(mongoDbUrl, function(err, db) {
        if (err) throw err;
        var dbo = db.db("heroku_3zqkgxjm");
        dbo.collection('kahootGamesImages').findOne({'name': filename }, (err, result) => {
            console.log("err: " + err);
            console.log("result: " + result);
            if (!result) {
                const error = new Error('file is not found')
                error.httpStatusCode = 400
                //return res.end(error)
                return next(error);
            }else{
                res.contentType('image/jpeg');
                res.send(result.image.buffer);
            }
            db.close();
        }); 
    });
})

app.get('/removephotobyname/:name', (req, res, next) => {
var filename = req.params.name;

    MongoClient.connect(mongoDbUrl, function(err, db) {
        if (err) throw err;
        var dbo = db.db("heroku_3zqkgxjm");
        dbo.collection('kahootGamesImages').remove({'name': filename }, (err, result) => {
            if (err) {
                const error = new Error('Please upload a file')
                error.httpStatusCode = 400
                return next(error);
            }
            console.log("image " + req.params.name + " removed from the database")
            db.close();
            return res.end("ok");
        }); 
    });
})

//When a connection to server is made from client
io.on('connection', (socket) => {
    
    //When host connects for the first time
    socket.on('host-join', (data) =>{
        
        //Check to see if id passed in url corresponds to id of kahoot game in database
        MongoClient.connect(mongoDbUrl, function(err, db) {
            if (err) throw err;
            var dbo = db.db("heroku_3zqkgxjm");
            var query = { id:  parseInt(data.id)};
            dbo.collection('kahootGames').find(query).toArray(function(err, result){
                if(err) throw err;
                
                //A kahoot was found with the id passed in url
                if(result[0] !== undefined){
                    var gamePin = Math.floor(Math.random()*90000) + 10000; //new pin for game

                    //Creates a game with pin and host id
                    games.addGame(gamePin, socket.id, false, {playersAnswered: 0, questionLive: false, gameid: data.id, question: 1}, {q1: "", a1: "", a2: "", a3: "", a4: ""});

                    var game = games.getGame(socket.id); //Gets the game data

                    socket.join(game.pin);//The host is joining a room based on the pin

                    console.log('Game Created with pin:', game.pin); 

                    //Sending game pin to host so they can display it for players to join
                    socket.emit('showGamePin', {
                        pin: game.pin
                    });
                }else{
                    socket.emit('noGameFound');
                }
                db.close();
            });
        });
        
    });
    
    //When the host connects from the game view
    socket.on('host-join-game', (data) => {
        var question = '';
        var answer1 = '';
        var answer2 = '';
        var answer3 = '';
        var answer4 = '';
        var oldHostId = data.id;
        var game = games.getGame(oldHostId);//Gets game with old host id
        if(game){
            game.hostId = socket.id;//Changes the game host id to new host id
            socket.join(game.pin);
            var playerData = players.getPlayers(oldHostId);//Gets player in game
            for(var i = 0; i < Object.keys(players.players).length; i++){
                if(players.players[i].hostId == oldHostId){
                    players.players[i].hostId = socket.id;
                }
            }
            var gameid = game.gameData['gameid'];
            MongoClient.connect(mongoDbUrl, function(err, db){
                if (err) throw err;
    
                var dbo = db.db('heroku_3zqkgxjm');
                var query = { id:  parseInt(gameid)};
                dbo.collection("kahootGames").find(query).toArray(function(err, res) {
                    if (err) throw err;
                    
                    question = res[0].questions[0].question;
                    answer1 = res[0].questions[0].answers[0];
                    answer2 = res[0].questions[0].answers[1];
                    answer3 = res[0].questions[0].answers[2];
                    answer4 = res[0].questions[0].answers[3];
                    var correctAnswer = res[0].questions[0].correct;
                    var imageName = res[0].questions[0].image;
                    
                    socket.emit('gameQuestions', {
                        q1: question,
                        a1: answer1,
                        a2: answer2,
                        a3: answer3,
                        a4: answer4,
                        correct: correctAnswer,
                        image: imageName,
                        playersInGame: playerData.length,
                        questionNum: 1,
                        numberOfQuestions: res[0].questions.length
                    });

                    game.firstQuestion.q1 = question;
                    game.firstQuestion.a1 = answer1;
                    game.firstQuestion.a2 = answer2;
                    game.firstQuestion.a3 = answer3;
                    game.firstQuestion.a4 = answer4;

                    io.to(game.pin).emit('gameStartedPlayer');

                    /*for(var i = 0; i < Object.keys(players.players).length; i++){
                        io.to(game.pin).emit('gameQuestionToPlayer', {q: question,
                            a1: answer1,
                            a2: answer2,
                            a3: answer3,
                            a4: answer4}
                        );
                    }*/
                    db.close();
                });
            });

            game.gameData.questionLive = true;
        }else{
            socket.emit('noGameFound');//No game was found, redirect user
        }
    });
    
    //When player connects for the first time
    socket.on('player-join', (params) => {
        
        var gameFound = false; //If a game is found with pin provided by player
        
        //For each game in the Games class
        for(var i = 0; i < games.games.length; i++){
            //If the pin is equal to one of the game's pin
            if(params.pin == games.games[i].pin){
                
                console.log('Player connected to game');
                
                var hostId = games.games[i].hostId; //Get the id of host of game
                                
                players.addPlayer(hostId, socket.id, params.name, {score: 0, answer: 0}); //add player to game
                
                socket.join(params.pin); //Player is joining room based on pin
                
                var playersInGame = players.getPlayers(hostId); //Getting all players in game
                
                io.to(params.pin).emit('updatePlayerLobby', playersInGame);//Sending host player data to display
                gameFound = true; //Game has been found
            }
        }
        
        //If the game has not been found
        if(gameFound == false){
            socket.emit('noGameFound'); //Player is sent back to 'join' page because game was not found with pin
        }
        
        
    });
    
    //When the player connects from game view
    socket.on('player-join-game', (data) => {
        var player = players.getPlayer(data.id);
        if(player){
            var game = games.getGame(player.hostId);
            socket.join(game.pin);
            player.playerId = socket.id;//Update player id with socket id
            
            var playerData = players.getPlayers(game.hostId);
            socket.emit('playerGameData', { playerData: playerData, 
                                            q1: game.firstQuestion.q1,
                                            a1: game.firstQuestion.a1,
                                            a2: game.firstQuestion.a2,
                                            a3: game.firstQuestion.a3,
                                            a4: game.firstQuestion.a4 
                                          } );
        }else{
            socket.emit('noGameFound');//No player found
        }
        
    });
    
    //When a host or player leaves the site
    socket.on('disconnect', () => {
        var game = games.getGame(socket.id); //Finding game with socket.id
        //If a game hosted by that id is found, the socket disconnected is a host
        if(game){
            //Checking to see if host was disconnected or was sent to game view
            if(game.gameLive == false){
                games.removeGame(socket.id);//Remove the game from games class
                console.log('Game ended with pin:', game.pin);

                var playersToRemove = players.getPlayers(game.hostId); //Getting all players in the game

                //For each player in the game
                for(var i = 0; i < playersToRemove.length; i++){
                    players.removePlayer(playersToRemove[i].playerId); //Removing each player from player class
                }

                io.to(game.pin).emit('hostDisconnect'); //Send player back to 'join' screen
                socket.leave(game.pin); //Socket is leaving room
            }
        }else{
            //No game has been found, so it is a player socket that has disconnected
            var player = players.getPlayer(socket.id); //Getting player with socket.id
            //If a player has been found with that id
            if(player){
                var hostId = player.hostId;//Gets id of host of the game
                var game = games.getGame(hostId);//Gets game data with hostId
                var pin = game.pin;//Gets the pin of the game
                
                if(game.gameLive == false){
                    players.removePlayer(socket.id);//Removes player from players class
                    var playersInGame = players.getPlayers(hostId);//Gets remaining players in game

                    io.to(pin).emit('updatePlayerLobby', playersInGame);//Sends data to host to update screen
                    socket.leave(pin); //Player is leaving the room
            
                }
            }
        }
        
    });
    
    //Sets data in player class to answer from player
    socket.on('playerAnswer', function(num){
        var player = players.getPlayer(socket.id);
        var hostId = player.hostId;
        var playerNum = players.getPlayers(hostId);
        var game = games.getGame(hostId);
        if(game.gameData.questionLive == true){//if the question is still live
            player.gameData.answer = num;
            game.gameData.playersAnswered += 1;
            
            var gameQuestion = game.gameData.question;
            var gameid = game.gameData.gameid;
            
            MongoClient.connect(mongoDbUrl, function(err, db){
                if (err) throw err;
    
                var dbo = db.db('heroku_3zqkgxjm');
                var query = { id:  parseInt(gameid)};
                dbo.collection("kahootGames").find(query).toArray(function(err, res) {
                    if (err) throw err;
                    var correctAnswer = res[0].questions[gameQuestion - 1].correct;
                    //Checks player answer with correct answer
                    if(num == correctAnswer){
                        player.gameData.score += 100;
                        io.to(game.pin).emit('getTime', socket.id);
                        socket.emit('answerResult', true);
                    }

                    //Checks if all players answered
                    if(game.gameData.playersAnswered == playerNum.length){
                        game.gameData.questionLive = false; //Question has been ended bc players all answered under time
                        //players.sortPlayersByScore();
                        var playerData = players.getPlayers(game.hostId);
                        io.to(game.pin).emit('questionOver', playerData, correctAnswer);//Tell everyone that question is over
                    }else{
                        //update host screen of num players answered
                        io.to(game.pin).emit('updatePlayersAnswered', {
                            playersInGame: playerNum.length,
                            playersAnswered: game.gameData.playersAnswered
                        });
                    }
                    
                    db.close();
                });
            });        
        }
    });
    
    socket.on('getScore', function(){
        var player = players.getPlayer(socket.id);
        var hostId = player.hostId;
        var playerData = players.getPlayers(hostId);

        for(var i = 0; i < playerData.length; i++) {
            if(playerData[i].playerId === player.playerId)
                break;
        }

        socket.emit('newScore', {score: player.gameData.score, currentPosition: i + 1, numberOfPlayers: playerData.length} ); 
        
    });
    
    socket.on('time', function(data){
        var time = data.time / 20;
        time = time * 100;
        var playerid = data.player;
        var player = players.getPlayer(playerid);
        player.gameData.score += time;

        var hostId = player.hostId;
        var game = games.getGame(hostId);
        //Sorting players by score when all players has answered
        //or question time has expired.
        if(game.gameData.questionLive == false){
            players.sortPlayersByScore();
            var playerData = players.getPlayers(game.hostId);
            //socket.emit('updateTopRanking',playerData);
            io.to(game.pin).emit('updateTopRanking',playerData);
        }
    });
        
    socket.on('timeUp', function(){
        var game = games.getGame(socket.id);
        game.gameData.questionLive = false;
        var playerData = players.getPlayers(game.hostId);
        
        var gameQuestion = game.gameData.question;
        var gameid = game.gameData.gameid;
            
            MongoClient.connect(mongoDbUrl, function(err, db){
                if (err) throw err;
    
                var dbo = db.db('heroku_3zqkgxjm');
                var query = { id:  parseInt(gameid)};
                dbo.collection("kahootGames").find(query).toArray(function(err, res) {
                    if (err) throw err;
                    var correctAnswer = res[0].questions[gameQuestion - 1].correct;
                    players.sortPlayersByScore();
                    playerData = players.getPlayers(game.hostId);
                    io.to(game.pin).emit('questionOver', playerData, correctAnswer);
                    //socket.emit('updateTopRanking',playerData);
                    io.to(game.pin).emit('updateTopRanking',playerData);
                    db.close();
                });
            });
    });
    
    socket.on('nextQuestion', function(){
        var question = '';
        var answer1 = '';
        var answer2 = '';
        var answer3 = '';
        var answer4 = '';
        var playerData = players.getPlayers(socket.id);
        //Reset players current answer to 0
        for(var i = 0; i < Object.keys(players.players).length; i++){
            if(players.players[i].hostId == socket.id){
                players.players[i].gameData.answer = 0;
            }
        }
        
        var game = games.getGame(socket.id);
        game.gameData.playersAnswered = 0;
        game.gameData.questionLive = true;
        game.gameData.question += 1;
        var gameid = game.gameData.gameid;
        
        MongoClient.connect(mongoDbUrl, function(err, db){
                if (err) throw err;
    
                var dbo = db.db('heroku_3zqkgxjm');
                var query = { id:  parseInt(gameid)};
                dbo.collection("kahootGames").find(query).toArray(function(err, res) {
                    if (err) throw err;
                    
                    if(res[0].questions.length >= game.gameData.question){
                        var questionNum = game.gameData.question;
                        questionNum = questionNum - 1;
                        question = res[0].questions[questionNum].question;
                        answer1 = res[0].questions[questionNum].answers[0];
                        answer2 = res[0].questions[questionNum].answers[1];
                        answer3 = res[0].questions[questionNum].answers[2];
                        answer4 = res[0].questions[questionNum].answers[3];
                        var correctAnswer = res[0].questions[questionNum].correct;
                        var imageName = res[0].questions[questionNum].image;

                        socket.emit('gameQuestions', {
                            q1: question,
                            a1: answer1,
                            a2: answer2,
                            a3: answer3,
                            a4: answer4,
                            correct: correctAnswer,
                            image: imageName,
                            playersInGame: playerData.length,
                            questionNum: questionNum + 1,
                            numberOfQuestions: res[0].questions.length 
                        });
                        for(var i = 0; i < Object.keys(players.players).length; i++){
                            io.to(game.pin).emit('gameQuestionToPlayer', {q: question,
                                a1: answer1,
                                a2: answer2,
                                a3: answer3,
                                a4: answer4}
                            );
                        }
                        db.close();
                    }else{
                        var playersInGame = players.getPlayers(game.hostId);
                        io.to(game.pin).emit('GameOver', {
                            players: playersInGame
                        });
                    }
                });
            });
        
        io.to(game.pin).emit('nextQuestionPlayer');
    });
    
    //When the host starts the game
    socket.on('startGame', () => {
        var game = games.getGame(socket.id);//Get the game based on socket.id
        game.gameLive = true;
        socket.emit('gameStarted', game.hostId);//Tell player and host that game has started
    });
    
    //Give user game names data
    socket.on('requestDbNames', function(){
        
        MongoClient.connect(mongoDbUrl, function(err, db){
            if (err) throw err;
    
            var dbo = db.db('heroku_3zqkgxjm');
            dbo.collection("kahootGames").find().toArray(function(err, res) {
                if (err) throw err;
                socket.emit('gameNamesData', res);
                db.close();
            });
        });
        
         
    });
    
    
    socket.on('newQuiz', function(data){
        MongoClient.connect(mongoDbUrl, function(err, db){
            if (err) throw err;
            var dbo = db.db('heroku_3zqkgxjm');
            dbo.collection('kahootGames').find({}).toArray(function(err, result){
                if(err) throw err;
                var num = Object.keys(result).length;
                if(num == 0){
                	data.id = 1
                	num = 1
                }else{
                	data.id = result[num -1 ].id + 1;
                }
                var game = data;
                dbo.collection("kahootGames").insertOne(game, function(err, res) {
                    if (err) throw err;
                    db.close();
                });
                db.close();
                socket.emit('startGameFromCreator', num);
            });
            
        });        
        
    });
    
});
