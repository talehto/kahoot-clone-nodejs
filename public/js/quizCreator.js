var socket = io();
var questionNum = 1; //Starts at two because question 1 is already present

function uploadFileButtonPressed(num){
    console.log('Executing uploadFileButtonPressed...' + num);
    console.log(typeof num);
    var domId = "#uploadForm"+ String(num)
    console.log('domId: ' + domId);
    console.log(typeof domId);
    $(domId).submit(function(event) {
        console.log("Uploading a file...")
        event.preventDefault();
        $(this).ajaxSubmit({
            error: function(xhr) {
                status('Error: ' + xhr.status);
            },
            success: function(response) {
                console.log(response)
            }
        });
        return false;
    });
}

function updateDatabase(){
    var questions = [];
    var name = document.getElementById('name').value;
    for(var i = 1; i <= questionNum; i++){
        var question = document.getElementById('q' + i).value;
        var answer1 = document.getElementById(i + 'a1').value;
        var answer2 = document.getElementById(i + 'a2').value;
        var answer3 = document.getElementById(i + 'a3').value;
        var answer4 = document.getElementById(i + 'a4').value;
        var correct = document.getElementById('correct' + i).value;
        var answers = [answer1, answer2, answer3, answer4];
        questions.push({"question": question, "answers": answers, "correct": correct})
    }
    
    var quiz = {id: 0, "name": name, "questions": questions};
    socket.emit('newQuiz', quiz);
}

function addQuestion(){
    questionNum += 1;
    
    var questionsDiv = document.getElementById('allQuestions');
    
    var newQuestionDiv = document.createElement("div");
    
    var questionLabel = document.createElement('label');
    var questionField = document.createElement('input');

    var imageForm = document.createElement('form');
    var fileField = document.createElement('input');
    var uploadFileButton = document.createElement('button');    
    
    var answer1Label = document.createElement('label');
    var answer1Field = document.createElement('input');
    
    var answer2Label = document.createElement('label');
    var answer2Field = document.createElement('input');
    
    var answer3Label = document.createElement('label');
    var answer3Field = document.createElement('input');
    
    var answer4Label = document.createElement('label');
    var answer4Field = document.createElement('input');
    
    var correctLabel = document.createElement('label');
    var correctField = document.createElement('input');
    
    questionLabel.innerHTML = "Question " + String(questionNum) + ": Kuvan lisääminen kysymyksen perään seuraavassa muodossa: image:xxx.jpg";
    questionField.setAttribute('class', 'question');
    questionField.setAttribute('id', 'q' + String(questionNum));
    questionField.setAttribute('type', 'text');
    
    imageForm.setAttribute('id','uploadForm' + String(questionNum));
    imageForm.setAttribute('action','/uploadfile');
    imageForm.setAttribute('enctype','multipart/form-data');
    imageForm.setAttribute('method','POST');

    fileField.setAttribute('type','file');
    fileField.setAttribute('name','myFile');

    uploadFileButton.setAttribute('onclick','uploadFileButtonPressed(' + String(questionNum) + ')');
    uploadFileButton.innerHTML = "Upload a file"

    answer1Label.innerHTML = "Answer 1: ";
    answer2Label.innerHTML = " Answer 2: ";
    answer3Label.innerHTML = "Answer 3: ";
    answer4Label.innerHTML = " Answer 4: ";
    correctLabel.innerHTML = "Correct Answer (1-4): ";
    
    answer1Field.setAttribute('id', String(questionNum) + "a1");
    answer1Field.setAttribute('type', 'text');
    answer2Field.setAttribute('id', String(questionNum) + "a2");
    answer2Field.setAttribute('type', 'text');
    answer3Field.setAttribute('id', String(questionNum) + "a3");
    answer3Field.setAttribute('type', 'text');
    answer4Field.setAttribute('id', String(questionNum) + "a4");
    answer4Field.setAttribute('type', 'text');
    correctField.setAttribute('id', 'correct' + String(questionNum));
    correctField.setAttribute('type', 'number');
    
    newQuestionDiv.setAttribute('id', 'question-field');//Sets class of div
    
    newQuestionDiv.appendChild(questionLabel);
    newQuestionDiv.appendChild(questionField);

    newQuestionDiv.appendChild(imageForm);
    imageForm.appendChild(fileField);
    imageForm.appendChild(uploadFileButton);
    
    newQuestionDiv.appendChild(document.createElement('br'));
    newQuestionDiv.appendChild(document.createElement('br'));
    newQuestionDiv.appendChild(answer1Label);
    newQuestionDiv.appendChild(answer1Field);
    newQuestionDiv.appendChild(answer2Label);
    newQuestionDiv.appendChild(answer2Field);
    newQuestionDiv.appendChild(document.createElement('br'));
    newQuestionDiv.appendChild(document.createElement('br'));
    newQuestionDiv.appendChild(answer3Label);
    newQuestionDiv.appendChild(answer3Field);
    newQuestionDiv.appendChild(answer4Label);
    newQuestionDiv.appendChild(answer4Field);
    newQuestionDiv.appendChild(document.createElement('br'));
    newQuestionDiv.appendChild(document.createElement('br'));
    newQuestionDiv.appendChild(correctLabel);
    newQuestionDiv.appendChild(correctField);
    
    questionsDiv.appendChild(document.createElement('br'));//Creates a break between each question
    questionsDiv.appendChild(newQuestionDiv);//Adds the question div to the screen
    
    newQuestionDiv.style.backgroundColor = randomColor();
}

//Called when user wants to exit quiz creator
function cancelQuiz(){
    if (confirm("Are you sure you want to exit? All work will be DELETED!")) {
        window.location.href = "../";
    }
}

socket.on('startGameFromCreator', function(data){
    window.location.href = "../../host/?id=" + data;
});

function randomColor(){
    
    var colors = ['#4CAF50', '#f94a1e', '#3399ff', '#ff9933'];
    var randomNum = Math.floor(Math.random() * 4);
    return colors[randomNum];
}

function setBGColor(){
    var randColor = randomColor();
    document.getElementById('question-field').style.backgroundColor = randColor;
}









