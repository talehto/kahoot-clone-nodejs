var socket = io();

var params = jQuery.deparam(window.location.search); //Gets the id from url

var timer;

var time = 20;

var appUrl = "https://tarmo-kahoot.herokuapp.com" || process.env.APP_URL

//When host connects to server
socket.on('connect', function() {

    document.getElementById('backRefDiv').style.display = "none";
    
    //Tell server that it is host connection from game view
    socket.emit('host-join-game', params);
});

socket.on('noGameFound', function(){
   window.location.href = '../../';//Redirect user to 'join game' page
});

socket.on('gameQuestions', function(data){
    console.log("data.q1: " + data.q1)
    document.getElementById('showTop10Button').style.display = "none";
    document.getElementById('top10listCollapseCard').className = "collapse bg-light text-dark col-12";
    document.getElementById('questionNum').innerHTML = "Kysymys " + String(data.questionNum) + " / " + String(data.numberOfQuestions);

    if("" != data.image){
        console.log("here we go")
        var elem = document.createElement("img");
        elem.setAttribute("id", "questionImg2");
        //elem.setAttribute("height", "768");
        //elem.setAttribute("width", "1024");
        elem.setAttribute("src",  appUrl + "/photobyname/" + data.image);
        document.getElementById("questionImg").appendChild(elem);
    }
    document.getElementById('question').innerHTML = data.q1;
    document.getElementById('answer1').innerHTML = data.a1;
    document.getElementById('answer2').innerHTML = data.a2;
    document.getElementById('answer3').innerHTML = data.a3;
    document.getElementById('answer4').innerHTML = data.a4;
    var correctAnswer = data.correct;
    document.getElementById('playersAnswered').innerHTML = "Players Answered 0 / " + data.playersInGame;
    updateTimer();
});

socket.on('updatePlayersAnswered', function(data){
   document.getElementById('playersAnswered').innerHTML = "Players Answered " + data.playersAnswered + " / " + data.playersInGame; 
});

socket.on('questionOver', function(playerData, correct){
    clearInterval(timer);
    var answer1 = 0;
    var answer2 = 0;
    var answer3 = 0;
    var answer4 = 0;
    var total = 0;
    //Hide elements on page
    document.getElementById('playersAnswered').style.display = "none";
    document.getElementById('timerText').style.display = "none";
    
    //Shows user correct answer with effects on elements
    if(correct == 1){
        document.getElementById('answer2').style.filter = "grayscale(50%)";
        document.getElementById('answer3').style.filter = "grayscale(50%)";
        document.getElementById('answer4').style.filter = "grayscale(50%)";
        var current = document.getElementById('answer1').innerHTML;
        document.getElementById('answer1').innerHTML = "&#10004" + " " + current;
    }else if(correct == 2){
        document.getElementById('answer1').style.filter = "grayscale(50%)";
        document.getElementById('answer3').style.filter = "grayscale(50%)";
        document.getElementById('answer4').style.filter = "grayscale(50%)";
        var current = document.getElementById('answer2').innerHTML;
        document.getElementById('answer2').innerHTML = "&#10004" + " " + current;
    }else if(correct == 3){
        document.getElementById('answer1').style.filter = "grayscale(50%)";
        document.getElementById('answer2').style.filter = "grayscale(50%)";
        document.getElementById('answer4').style.filter = "grayscale(50%)";
        var current = document.getElementById('answer3').innerHTML;
        document.getElementById('answer3').innerHTML = "&#10004" + " " + current;
    }else if(correct == 4){
        document.getElementById('answer1').style.filter = "grayscale(50%)";
        document.getElementById('answer2').style.filter = "grayscale(50%)";
        document.getElementById('answer3').style.filter = "grayscale(50%)";
        var current = document.getElementById('answer4').innerHTML;
        document.getElementById('answer4').innerHTML = "&#10004" + " " + current;
    }
    
    for(var i = 0; i < playerData.length; i++){
        if(playerData[i].gameData.answer == 1){
            answer1 += 1;
        }else if(playerData[i].gameData.answer == 2){
            answer2 += 1;
        }else if(playerData[i].gameData.answer == 3){
            answer3 += 1;
        }else if(playerData[i].gameData.answer == 4){
            answer4 += 1;
        }
        total += 1;
    }
    
    //Gets values for graph
    answer1 = answer1 / total * 100;
    answer2 = answer2 / total * 100;
    answer3 = answer3 / total * 100;
    answer4 = answer4 / total * 100;
    
    document.getElementById('square1').style.display = "inline-block";
    document.getElementById('square2').style.display = "inline-block";
    document.getElementById('square3').style.display = "inline-block";
    document.getElementById('square4').style.display = "inline-block";
    
    document.getElementById('square1').style.height = answer1 + "px";
    document.getElementById('square2').style.height = answer2 + "px";
    document.getElementById('square3').style.height = answer3 + "px";
    document.getElementById('square4').style.height = answer4 + "px";
    
    document.getElementById('nextQButton').style.display = "block";

    console.log("playerData.name: " + playerData[0].name);
    $("#top10list").empty();

    var top10List  = document.getElementById("top10list");

    for(var i = 0; i < 10; i++){
        if(i === playerData.length){
            break;
        }
        var liItem = document.createElement("li");
        liItem.setAttribute('class', 'list-group-item m-1');

        var divItem = document.createElement("div");
        divItem.setAttribute('class', 'd-flex w-100 justify-content-between');

        var h5Item = document.createElement("h5");
        h5Item.setAttribute('class', 'm-1');

        var strongItem1 = document.createElement("strong");
        strongItem1.innerHTML = "" + String(i+1) + ". " + playerData[i].name

        var strongItem2 = document.createElement("strong");
        strongItem2.innerHTML = "Pisteet: " + String(playerData[i].gameData.score);

        h5Item.appendChild(strongItem1);
        divItem.appendChild(h5Item);
        divItem.appendChild(strongItem2);
        liItem.appendChild(divItem);

        top10List.appendChild(liItem);
    }
    document.getElementById('showTop10Button').style.display = "block";
});

function nextQuestion(){
    var imgElem = document.getElementById("questionImg2")
    if(typeof(imgElem) != 'undefined' && imgElem != null){
        imgElem.remove()
    }
    document.getElementById('nextQButton').style.display = "none";
    document.getElementById('showTop10Button').style.display = "none";
    document.getElementById('square1').style.display = "none";
    document.getElementById('square2').style.display = "none";
    document.getElementById('square3').style.display = "none";
    document.getElementById('square4').style.display = "none";
    
    document.getElementById('answer1').style.filter = "none";
    document.getElementById('answer2').style.filter = "none";
    document.getElementById('answer3').style.filter = "none";
    document.getElementById('answer4').style.filter = "none";
    
    document.getElementById('playersAnswered').style.display = "block";
    document.getElementById('timerText').style.display = "block";
    document.getElementById('num').innerHTML = " 20";
    socket.emit('nextQuestion'); //Tell server to start new question
}

function updateTimer(){
    time = 20;
    timer = setInterval(function(){
        time -= 1;
        document.getElementById('num').textContent = " " + time;
        if(time == 0){
            socket.emit('timeUp');
        }
    }, 1000);
}
socket.on('GameOver', function(data){
    document.getElementById('backRefDiv').style.display = "block";
    document.getElementById('nextQButton').style.display = "none";
    document.getElementById('showTop10Button').style.display = "none";
    document.getElementById('top10listCollapseCard').className = "collapse bg-light text-dark col-12";
    
    document.getElementById('questionStatsCard').style.display = "none";

    document.getElementById('square1').style.display = "none";
    document.getElementById('square2').style.display = "none";
    document.getElementById('square3').style.display = "none";
    document.getElementById('square4').style.display = "none";
    
    document.getElementById('answer1').style.display = "none";
    document.getElementById('answer2').style.display = "none";
    document.getElementById('answer3').style.display = "none";
    document.getElementById('answer4').style.display = "none";
    document.getElementById('timerText').innerHTML = "";
    document.getElementById('question').innerHTML = "GAME OVER";
    document.getElementById('playersAnswered').innerHTML = "";
    document.getElementById('questionTitle').innerHTML = "";
            

    $("#top10list").empty();
    var top10List  = document.getElementById("top10list");

    for(var i = 0; i < 10; i++){
        if(i === data.players.length){
            break;
        }
        var liItem = document.createElement("li");
        liItem.setAttribute('class', 'list-group-item m-1');

        var divItem = document.createElement("div");
        divItem.setAttribute('class', 'd-flex w-100 justify-content-between');

        var h5Item = document.createElement("h5");
        h5Item.setAttribute('class', 'm-1');

        var strongItem1 = document.createElement("strong");
        strongItem1.innerHTML = "" + String(i+1) + ". " + data.players[i].name

        var strongItem2 = document.createElement("strong");
        strongItem2.innerHTML = "Pisteet: " + String(data.players[i].gameData.score);

        h5Item.appendChild(strongItem1);
        divItem.appendChild(h5Item);
        divItem.appendChild(strongItem2);
        liItem.appendChild(divItem);

        top10List.appendChild(liItem);
    }
    document.getElementById('top10listCollapseCard').className = "collapse show bg-light text-dark col-12";
});



socket.on('getTime', function(player){
    socket.emit('time', {
        player: player,
        time: time
    });
});


