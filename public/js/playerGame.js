var socket = io();
var playerAnswered = false;
var correct = false;
var name;
var score = 0;

var params = jQuery.deparam(window.location.search); //Gets the id from url

socket.on('connect', function() {
    console.log("connect to the game")
    
    document.getElementById('gameStatsCard').style.display = "none";
    document.getElementById('question').style.display = "block";
    document.getElementById('answer1').style.display = "block";
    document.getElementById('answer2').style.display = "block";
    document.getElementById('answer3').style.display = "block";
    document.getElementById('answer4').style.display = "block";

    //Tell server that it is host connection from game view
    socket.emit('player-join-game', params);
});

socket.on('noGameFound', function(){
    window.location.href = '../../';//Redirect user to 'join game' page 
});

function answerSubmitted(num){
    if(playerAnswered == false){
        playerAnswered = true;
        
        socket.emit('playerAnswer', num);//Sends player answer to server
        
        //Hiding buttons from user
        document.getElementById('gameStatsCard').style.display = "block";
        document.getElementById('question').style.display = "none";
        document.getElementById('answer1').style.display = "none";
        document.getElementById('answer2').style.display = "none";
        document.getElementById('answer3').style.display = "none";
        document.getElementById('answer4').style.display = "none";
        document.getElementById('message').className = "alert alert-light";
        document.getElementById('message').style.display = "block";
        document.getElementById('message').innerHTML = "Answer Submitted! Waiting on other players...";
        
    }
}

//Get results on last question
socket.on('answerResult', function(data){
    if(data == true){
        correct = true;
    }
});

socket.on('gameQuestionToPlayer', function(data){
    console.log("gameQuestionToPlayer called")

    document.getElementById('gameStatsCard').style.display = "none";
    document.getElementById('question').innerHTML = data.q;
    document.getElementById('answer1').innerHTML = data.a1;
    document.getElementById('answer2').innerHTML = data.a2;
    document.getElementById('answer3').innerHTML = data.a3;
    document.getElementById('answer4').innerHTML = data.a4;
});

socket.on('questionOver', function(data){
    if(correct == true){
        document.body.style.backgroundColor = "#4CAF50";
        document.getElementById('message').className = "alert alert-success";
        document.getElementById('message').style.display = "block";
        document.getElementById('message').innerHTML = "Correct!";
    }else{
        document.body.style.backgroundColor = "#f94a1e";
        document.getElementById('message').className = "alert-danger";
        document.getElementById('message').style.display = "block";
        document.getElementById('message').innerHTML = "Incorrect!";
    }
    document.getElementById('gameStatsCard').style.display = "block";
    document.getElementById('question').style.display = "none";
    document.getElementById('answer1').style.display = "none";
    document.getElementById('answer2').style.display = "none";
    document.getElementById('answer3').style.display = "none";
    document.getElementById('answer4').style.display = "none";

    socket.emit('getScore');
});

socket.on('newScore', function(data){
    document.getElementById('scoreText').innerHTML = "Pisteet: " + data.score;
    document.getElementById('rankingText').innerHTML = "Sijoitus: " + data.currentPosition + " / " + data.numberOfPlayers;
});

socket.on('nextQuestionPlayer', function(){
    correct = false;
    playerAnswered = false;

    document.getElementById('gameStatsCard').style.display = "none";
    document.getElementById('question').style.display = "block";
    document.getElementById('answer1').style.display = "block";
    document.getElementById('answer2').style.display = "block";
    document.getElementById('answer3').style.display = "block";
    document.getElementById('answer4').style.display = "block";
    document.getElementById('message').style.display = "none";
    document.body.style.backgroundColor = "white";
    
});

socket.on('hostDisconnect', function(){
    window.location.href = "../../";
});

socket.on('playerGameData', function(data){

    document.getElementById('question').innerHTML = data.q1;
    document.getElementById('answer1').innerHTML = data.a1;
    document.getElementById('answer2').innerHTML = data.a2;
    document.getElementById('answer3').innerHTML = data.a3;
    document.getElementById('answer4').innerHTML = data.a4;

   for(var i = 0; i < data.length; i++){
       if(data[i].playerId == socket.id){
           document.getElementById('nameText').innerHTML = "Name: " + data[i].name;
           document.getElementById('scoreText').innerHTML = "Score: " + data[i].gameData.score;
       }
   }
});

socket.on('GameOver', function(){
    document.body.style.backgroundColor = "#FFFFFF";
    document.getElementById('gameStatsCard').style.display = "block";
    document.getElementById('question').style.display = "none";
    document.getElementById('answer1').style.display = "none";
    document.getElementById('answer2').style.display = "none";
    document.getElementById('answer3').style.display = "none";
    document.getElementById('answer4').style.display = "none";
    document.getElementById('message').className = "alert alert-light";
    document.getElementById('message').style.display = "block";
    document.getElementById('message').innerHTML = "GAME OVER";
});

