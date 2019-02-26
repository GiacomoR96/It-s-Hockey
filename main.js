var express = require("express");
var app = express();
var EventEmitter = require("events").EventEmitter;          // Forse
var mysql = require('mysql');
var port = 8080;
var http = require('http');
var fs = require('fs');
var path = require('path');

// inizializzazione socket per l'instaurazione della connessione attraverso le socket
const {fork} = require ('child_process');  
var child_process = fork('createSocket.js');

// Inizializzazione del padre

console.log("ServerPadre avviato sulla porta ",port,"...");

var serverGame = [];
var finalDataUsers = [0,0,0,0];

var livEXP = [10,25,45,75,115,165,230,310,405,530];
var pointWinner=7;
var pointLoser=3;
// 10 15 20 30 40 50 65 80 95 125


for(var i=0;i<4;i++){
    serverGame[i] = fork("serverGame.js");      // serverGame[serverGame.length]
}

var usersConnected = [];
var usersPlayGame = [];
var countUsers = [0,0,0,0];
var maxNumPlayers = 8;
//var numUser = 0;
var instanceServerUsers = [];

/* STANZA LIBERA = false, OCCUPATA =  true */
var room = [false, false, false, false];

/*

console.log("requestStartGame RICEVUTO-> ",data," __>",data.stanza);
            
            usersPlayGame[countUsers] = data.nick;
            countUsers++;
            
            // DA MODIFICARE
            if(countUsers % 2 == 0){
                indiceServer = room.indexOf(false);
                room[indiceServer] = true;
                instanceServerUsers[indiceServer]={indice:indiceServer, nick1:usersPlayGame[countUsers-2], nick2:usersPlayGame[countUsers-1]};
                console.log("TERNA instanceServerUsers: ",instanceServerUsers[indiceServer]);

                serverGame[indiceServer].send({event:"id",indice:indiceServer});
                serverGame[indiceServer].send({
                    event:"startUpServer",
                    nick1:instanceServerUsers[indiceServer].nick1,
                    nick2:instanceServerUsers[indiceServer].nick2
                });
                
            }

*/

getNickUsers = () =>{
    var nick1="",nick2="";
    var userRoomPlay="";
    if(room[0]==true){
        
        for(var i=0;i<usersPlayGame.length;i++){
            if(nick1=="" && usersPlayGame[i].stanza==1)         nick1=usersPlayGame[i].nick;
            else if(nick2=="" && usersPlayGame[i].stanza==1)    nick2=usersPlayGame[i].nick;
            if(nick1!="" && nick2!="") break;
        }
        userRoomPlay+=""+nick1+","+nick2+",";
        nick1=nick2="";
        console.log("Passo da 0-> ",userRoomPlay);
    }
    else    userRoomPlay+="_,_,";
    if(room[1]==true){
        
        for(var i=0;i<usersPlayGame.length;i++){
            if(nick1=="" && usersPlayGame[i].stanza==2)         nick1=usersPlayGame[i].nick;
            else if(nick2=="" && usersPlayGame[i].stanza==2)    nick2=usersPlayGame[i].nick;
            if(nick1!="" && nick2!="") break;
        }
        userRoomPlay+=""+nick1+","+nick2+",";
        nick1=nick2="";
        console.log("Passo da 1-> ",userRoomPlay);
    }
    else    userRoomPlay+="_,_,";
    if(room[2]==true){
        
        for(var i=0;i<usersPlayGame.length;i++){
            if(nick1=="" && usersPlayGame[i].stanza==3)         nick1=usersPlayGame[i].nick;
            else if(nick2=="" && usersPlayGame[i].stanza==3)    nick2=usersPlayGame[i].nick;
            if(nick1!="" && nick2!="") break;
        }
        userRoomPlay+=""+nick1+","+nick2+",";
        nick1=nick2="";
        console.log("Passo da 2-> ",userRoomPlay);
    }
    else    userRoomPlay+="_,_,";
    if(room[3]==true){
        
        for(var i=0;i<usersPlayGame.length;i++){
            if(nick1=="" && usersPlayGame[i].stanza==4)         nick1=usersPlayGame[i].nick;
            else if(nick2=="" && usersPlayGame[i].stanza==4)    nick2=usersPlayGame[i].nick;
            if(nick1!="" && nick2!="") break;
        }
        userRoomPlay+=""+nick1+","+nick2+",";
        nick1=nick2="";
        console.log("Passo da 3-> ",userRoomPlay);
    }
    else    userRoomPlay+="_,_";

    return userRoomPlay;
}


/* COMUNICAZIONE DA FIGLIO_SOCKET A PADRE */
child_process.on("message", (data) =>{

    /*  Gestire il tutto con un array di oggetti
        ove ogni indice del server corrispondono 2 nick
        e appena arriva un messaggio, se il nick del tizio
        che ha mandato il messaggio è gia' dentro un oggetto
        di questo array allora l'indiceServer corrispondera'
        al valore dell'indice dell'oggetto dove e' stato
        trovato il record, altrimenti aspetta un nuovo avversario
    */ 
   
    var indiceServer;
    for(var i=0;i<instanceServerUsers.length;i++){
        if(instanceServerUsers.length>0 && instanceServerUsers[i].nick1==data.nick || instanceServerUsers[i].nick2==data.nick){
            indiceServer = instanceServerUsers[i].indice;
            break;
        }
    }

    switch(data.event){
        case "requestStartGame":{
            
            console.log("requestStartGame RICEVUTO-> ",data," __>",data.stanza);
            
            var userData = {
                nick: data.nick,
                stanza: data.stanza
            };

            usersPlayGame[usersPlayGame.length]=userData;
            console.log("OGGETTO SALVATO= ",usersPlayGame);
            if(data.stanza>=1 && data.stanza<=4){
                countUsers[(data.stanza)-1]++;

                if(countUsers[(data.stanza)-1]==2){
                    room[(data.stanza)-1]=true;

                    var nick1="",nick2="";
                    for(var i=0;i<usersPlayGame.length;i++){
                        console.log("OGGETTO CORRENTE= ",usersPlayGame[i],", di stanza->",usersPlayGame[i].stanza);
            
                        if(nick1=="" && usersPlayGame[i].stanza==data.stanza){
                            nick1=usersPlayGame[i].nick;
                            console.log("SETTO n1->",nick1);
                        }
                        else if(nick2=="" && usersPlayGame[i].stanza==data.stanza){
                            nick2=usersPlayGame[i].nick;
                            console.log("SETTO n2->",nick2);
                        }

                        if(nick1!="" && nick2!="") break;
                    }

                    instanceServerUsers[instanceServerUsers.length]={indice:(data.stanza)-1, nick1:nick1, nick2:nick2};
                    console.log("TERNA instanceServerUsers: ",instanceServerUsers[(data.stanza)-1]);

                    serverGame[(data.stanza)-1].send({event:"id",indice:(data.stanza)-1});
                    serverGame[(data.stanza)-1].send({
                        event:"startUpServer",
                        nick1:nick1,
                        nick2:nick2
                    });
                }

            }
           /*  usersPlayGame[countUsers] = data.nick;
            countUsers++;
            
            // DA MODIFICARE
            if(countUsers % 2 == 0){
                indiceServer = room.indexOf(false);
                room[indiceServer] = true;
                instanceServerUsers[indiceServer]={indice:indiceServer, nick1:usersPlayGame[countUsers-2], nick2:usersPlayGame[countUsers-1]};
                console.log("TERNA instanceServerUsers: ",instanceServerUsers[indiceServer]);

                serverGame[indiceServer].send({event:"id",indice:indiceServer});
                serverGame[indiceServer].send({
                    event:"startUpServer",
                    nick1:instanceServerUsers[indiceServer].nick1,
                    nick2:instanceServerUsers[indiceServer].nick2
                });
                
            } */
            break;
        }
        case "myPosition":{
            console.log("EVENTO MY_POSITION DA:",data.nick);
            serverGame[indiceServer].send({event:"id",indice:indiceServer});
            serverGame[indiceServer].send(data);
            break;
        }
        case "rivalPosition":{
            console.log("EVENTO rivalPosition DA:",data.nick);
            serverGame[indiceServer].send({event:"id",indice:indiceServer});
            serverGame[indiceServer].send(data);
            break;
        }
        case "moveMyPosition":{
            console.log("EVENTO MOVE_MY_POSITION DA:",data.nick);
            serverGame[indiceServer].send({event:"id",indice:indiceServer});
            serverGame[indiceServer].send(data);
            break;
        }
        case "goalSuffered":{
            console.log("EVENTO goalSuffered DA:",data.nick);
            serverGame[indiceServer].send({event:"id",indice:indiceServer});
            serverGame[indiceServer].send(data);
            break;
        }
        case "puckPosition":{
            //console.log("EVENTO puckPosition DA:",data.nick);
            
            serverGame[indiceServer].send({event:"id",indice:indiceServer});
            serverGame[indiceServer].send(data);
            break;
        }
        case "puckInitialize":{
            console.log("EVENTO puckInitialize DA:",data.nick);
            serverGame[indiceServer].send({event:"id",indice:indiceServer});
            serverGame[indiceServer].send(data);
            break;
        }
    }

});

updateStatPlayers = (data) =>{
    finalDataUsers[data.id]={nick1:data.nick1,nick2:data.nick2,winner:data.winner};
    
    var con = mysql.createConnection({
        host: "127.0.0.1",
        user: "root",
        password: "",
        database: "dbgiocohockey"
    });
    if(con) {}
    else{
        console.log("Connessione Fallita!\nImpossibile aggiornare i dati dei player dopo la partita!")
    }

    con.connect(function(err) {
        if (err) throw err;
        
        var liv;
        var exp;

        //Winner
        
        var usrWinner = finalDataUsers[data.id].nick1==finalDataUsers[data.id].winner?finalDataUsers[data.id].nick1:finalDataUsers[data.id].nick2;
                        
        con.query("SELECT Livello,EXP FROM giocatore WHERE Nickname='"+usrWinner+"'", function (err, result, fields) {
        if (err) throw err;
        else{
            if(result==''){          
            }        
            else{
                liv=result[0].Livello;
                exp=result[0].EXP;

                exp+=pointWinner;
                if(liv < livEXP.length && exp >= livEXP[liv]  ) liv++;

                con.query("UPDATE giocatore SET Livello='"+liv+"', EXP='"+exp+"' WHERE Nickname='"+usrWinner+"'", function (err, result, fields) {
                    if (err) throw err;
                    else {}
                });
                con.on('error', function(err) {
                    console.log("W[UPDATE] - [mysql error]",err);
                });

            }
        }
        });
        con.on('error', function(err) {
            console.log("W[SELECT] - [mysql error]",err);
        });
            
        //Loser

        var usrLoser = finalDataUsers[data.id].nick1!=finalDataUsers[data.id].winner?finalDataUsers[data.id].nick1:finalDataUsers[data.id].nick2;

        con.query("SELECT Livello,EXP FROM giocatore WHERE Nickname='"+usrLoser+"'", function (err, result, fields) {
            if (err) throw err;
            else{
                if(result=='') {}        
                else{
                    liv=result[0].Livello;
                    exp=result[0].EXP;
    
                    exp+=pointLoser;
                    if(liv < livEXP.length && exp >= livEXP[liv]  ) liv++;
    
                    con.query("UPDATE giocatore SET Livello='"+liv+"', EXP='"+exp+"' WHERE Nickname='"+usrLoser+"'", function (err, result, fields) {
                        if (err) throw err;
                        else {}
                    });
                    con.on('error', function(err) {
                        console.log("L[UPDATE] - [mysql error]",err);
                    });
    
                }
            }
        });
        con.on('error', function(err) {
            console.log("L[SELECT] - [mysql error]",err);
        });

       /* //TEST
        con.query("SELECT Nickname,Livello,EXP FROM giocatore", function (err, result, fields) {
        if (err) throw err;
        else{
            for(var i=0;i<result.length;i++){
                console.log("TEST DB ",result[i].Nickname," ",result[i].Livello," ",result[i].EXP);
            }
        }
        });
        con.on('error', function(err) {
            console.log("W - [mysql error]",err);
        });
        //END TEST */
    });

    // Riavvio instanza data.id serverGame
     
    console.log("PADRE [Partita conclusa] -  Sto per riavviare il figlio serverGame[",data.id,"]!");
    //process.kill(serverGame[data.id], 'SIGTERM')
    
    // Eliminazione terna {serverGame,nick1,nick2}
    /* var index;
    for(var i=0;i<2;i++){
        i==0 ? index = usersPlayGame.indexOf(finalDataUsers[data.id].nick1)
                        : index = usersPlayGame.indexOf(finalDataUsers[data.id].nick2);
        if (index > -1) {
            usersPlayGame.splice(index, 1);
        }   
    } */
    
}


serverGame[0].on("message", (data) =>{
    switch(data.event){
        case "myPosition":{
            child_process.send(data);
            break;
        }
        case "rivalPosition":{
            child_process.send(data);
            break;
        }
        case "moveRivalPosition":{
            child_process.send(data);
            break;
        }
        case "positionBall":{
            child_process.send(data);
            break;
        }
        case "users_game":{
            child_process.send(data);
            break;
        }
        case "setIDPorta":{
            child_process.send(data);
            break;
        }
        case "start_game":{
            child_process.send(data);
            break;
        }
        case "finishGame":{
            child_process.send(data);
            break;
        }
        case "refreshScoreGame":{
            child_process.send(data);
            break;
        }
        case "puckPosition":{
            child_process.send(data);
            break;
        }
        case "updateDataDB":{
            updateStatPlayers(data);
        }
        case "setPositionPuck":{
            child_process.send(data);
            break;
        }
        case "stopServerGame":{
            console.log("PADRE - RIAVVIO FIGLIO EFFETTUATO, pos:",data.id);
            //serverGame[data.id] = fork("serverGame.js");
            room[data.id] = false;
            instanceServerUsers.splice(data.id,1); 
        }
    }

});


serverGame[1].on("message", (data) =>{
    
    switch(data.event){
        case "myPosition":{
            child_process.send(data);
            break;
        }
        case "rivalPosition":{
            child_process.send(data);
            break;
        }
        case "moveRivalPosition":{
            child_process.send(data);
            break;
        }
        case "positionBall":{
            child_process.send(data);
            break;
        }
        case "users_game":{
            child_process.send(data);
            break;
        }
        case "setIDPorta":{
            child_process.send(data);
            break;
        }
        case "start_game":{
            child_process.send(data);
            break;
        }
        case "finishGame":{
            child_process.send(data);
            break;
        }
        case "refreshScoreGame":{
            child_process.send(data);
            break;
        }
        case "puckPosition":{
            child_process.send(data);
            break;
        }
        case "updateDataDB":{
            updateStatPlayers(data);
        }
        case "setPositionPuck":{
            child_process.send(data);
            break;
        }
        case "stopServerGame":{
            console.log("PADRE - RESET FIGLIO EFFETTUATO, pos:",data.id);
            //serverGame[data.id] = fork("serverGame.js");
            room[data.id] = false;
            instanceServerUsers.splice(data.id,1); 
        }
    }

});

serverGame[2].on("message", (data) =>{
    
    switch(data.event){
        case "myPosition":{
            child_process.send(data);
            break;
        }
        case "rivalPosition":{
            child_process.send(data);
            break;
        }
        case "moveRivalPosition":{
            child_process.send(data);
            break;
        }
        case "positionBall":{
            child_process.send(data);
            break;
        }
        case "users_game":{
            child_process.send(data);
            break;
        }
        case "setIDPorta":{
            child_process.send(data);
            break;
        }
        case "start_game":{
            child_process.send(data);
            break;
        }
        case "finishGame":{
            child_process.send(data);
            break;
        }
        case "refreshScoreGame":{
            child_process.send(data);
            break;
        }
        case "puckPosition":{
            child_process.send(data);
            break;
        }
        case "updateDataDB":{
            updateStatPlayers(data);
        }
        case "setPositionPuck":{
            child_process.send(data);
            break;
        }
        case "stopServerGame":{
            console.log("PADRE - RESET FIGLIO EFFETTUATO, pos:",data.id);
            //serverGame[data.id] = fork("serverGame.js");
            room[data.id] = false;
            instanceServerUsers.splice(data.id,1); 
        }
    }

});


serverGame[3].on("message", (data) =>{
    
    switch(data.event){
        case "myPosition":{
            child_process.send(data);
            break;
        }
        case "rivalPosition":{
            child_process.send(data);
            break;
        }
        case "moveRivalPosition":{
            child_process.send(data);
            break;
        }
        case "positionBall":{
            child_process.send(data);
            break;
        }
        case "users_game":{
            child_process.send(data);
            break;
        }
        case "setIDPorta":{
            child_process.send(data);
            break;
        }
        case "start_game":{
            child_process.send(data);
            break;
        }
        case "finishGame":{
            child_process.send(data);
            break;
        }
        case "refreshScoreGame":{
            child_process.send(data);
            break;
        }
        case "puckPosition":{
            child_process.send(data);
            break;
        }
        case "updateDataDB":{
            updateStatPlayers(data);
        }
        case "setPositionPuck":{
            child_process.send(data);
            break;
        }
        case "stopServerGame":{
            console.log("PADRE - RESET FIGLIO EFFETTUATO, pos:",data.id);
            //serverGame[data.id] = fork("serverGame.js");
            room[data.id] = false;
            instanceServerUsers.splice(data.id,1); 
        }
    }

});
/* COMUNICAZIONE DA PADRE A FIGLIO */
/*
child_process.send({
    message: `Inviato da processo padre con PID: ${process.pid}\n`
});
*/

var serverHTTP = http.createServer((req,res) =>{


    //console.log("Messaggio ricevuto", req.url);

    if (req.method == "GET") {

        console.log(req.url);

        if(req.url.indexOf('index.html') != -1){
                fs.readFile(__dirname + '/index.html', function (err, data) {
                if (err) console.log(err);
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(data);
                res.end();
            });
        }
        else if(req.url.indexOf('registration.html') != -1){
            fs.readFile(__dirname + '/registration.html', function (err, data) {
                if (err) console.log(err);
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(data);
                res.end();
            });
        }
        else if(req.url.indexOf('contact.html') != -1){
            fs.readFile(__dirname + '/contact.html', function (err, data) {
                if (err) console.log(err);
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(data);
                res.end();
            });
        }
        else if(req.url.indexOf('phaser.js') != -1){
            fs.readFile(__dirname + '/www/js/phaser.js', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/javascript'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('socket.io.js') != -1){
            fs.readFile(__dirname + '/www/js/socket.io.js', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/javascript'});
            res.write(data);
            res.end();
            });
    
        }
        else if(req.url.indexOf('game.js') != -1){
            fs.readFile(__dirname + '/www/js/game.js', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/javascript'});
            res.write(data);
            res.end();
            });    
        }
        else if(req.url.indexOf('test.js') != -1){ 
            fs.readFile(__dirname + '/www/js/test.js', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/javascript'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('js/modernizr-2.6.2.min.js') != -1){ 
            fs.readFile(__dirname + '/js/modernizr-2.6.2.min.js', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/javascript'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('js/jquery.min.js') != -1){ 
            fs.readFile(__dirname + '/js/jquery.min.js', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/javascript'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('js/jquery.easing.1.3.js') != -1){ 
            fs.readFile(__dirname + '/js/jquery.easing.1.3.js', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/javascript'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('js/bootstrap.min.js') != -1){ 
            fs.readFile(__dirname + '/js/bootstrap.min.js', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/javascript'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('js/jquery.waypoints.min.js') != -1){ 
            fs.readFile(__dirname + '/js/jquery.waypoints.min.js', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/javascript'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('js/main.js') != -1){ 
            fs.readFile(__dirname + '/js/main.js', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/javascript'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('sfondoWeb2.png') != -1){ 

            fs.readFile(__dirname + '/images/sfondoWeb2.png', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
            });
    
        }
        else if(req.url.indexOf('Sfondo_.png') != -1){ 

            fs.readFile(__dirname + '/www/img/Sfondo_.png', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('lineRed.png') != -1){ 

            fs.readFile(__dirname + '/www/img/lineRed.png', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('lineRedsmall.png') != -1){ 

            fs.readFile(__dirname + '/www/img/lineRedSmall.png', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('lineGreen.png') != -1){ 

            fs.readFile(__dirname + '/www/img/lineGreen.png', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('lineGreenSmall.png') != -1){ 

            fs.readFile(__dirname + '/www/img/lineGreenSmall.png', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('lineYellow.png') != -1){ 

            fs.readFile(__dirname + '/www/img/lineYellow.png', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('lineYellowSmall.png') != -1){ 

            fs.readFile(__dirname + '/www/img/lineYellowSmall.png', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('lineBlue.png') != -1){ 

            fs.readFile(__dirname + '/www/img/lineBlue.png', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('lineBlueSmall.png') != -1){ 

            fs.readFile(__dirname + '/www/img/lineBlueSmall.png', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('lineCyan.png') != -1){ 

            fs.readFile(__dirname + '/www/img/lineCyan.png', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('lineCyanSmall.png') != -1){ 

            fs.readFile(__dirname + '/www/img/lineCyanSmall.png', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('porta.png') != -1){ 

            fs.readFile(__dirname + '/www/img/porta.png', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('striker.png') != -1){
            fs.readFile(__dirname + '/www/img/striker.png', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('puck.png') != -1){ 
            fs.readFile(__dirname + '/www/img/puck.png', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('img_bg_1.jpg') != -1){ 
            fs.readFile(__dirname + '/images/img_bg_1.jpg', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('img_bg_2.jpg') != -1){ 
            fs.readFile(__dirname + '/images/img_bg_2.jpg', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('loader.gif') != -1){ 
            fs.readFile(__dirname + '/images/loader.gif', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('loc.png') != -1){ 
            fs.readFile(__dirname + '/images/loc.png', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('person1.jpg') != -1){ 
            fs.readFile(__dirname + '/images/person1.jpg', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('work-1.jpg') != -1){ 
            fs.readFile(__dirname + '/images/work-1.jpg', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('work-2.jpg') != -1){ 
            fs.readFile(__dirname + '/images/work-2.jpg', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('work-3.jpg') != -1){ 
            fs.readFile(__dirname + '/images/work-3.jpg', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('work-4.jpg') != -1){ 
            fs.readFile(__dirname + '/images/work-4.jpg', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('work-5.jpg') != -1){ 
            fs.readFile(__dirname + '/images/work-5.jpg', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
            });
        }
        else if(req.url.indexOf('work-6.jpg') != -1){ 
            fs.readFile(__dirname + '/images/work-6.jpg', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
            });
        }







        else if(req.url.indexOf('glyphicons-halflings-regular.eot') != -1){
            fs.readFile(__dirname + '/fonts/bootstrap/glyphicons-halflings-regular.eot', function (err, data) {
                if (err) console.log(err);
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(data);
                res.end();
            });
        }
        else if(req.url.indexOf('glyphicons-halflings-regular.svg') != -1){
            fs.readFile(__dirname + '/fonts/bootstrap//glyphicons-halflings-regular.svg', function (err, data) {
                if (err) console.log(err);
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(data);
                res.end();
            });
        }
        else if(req.url.indexOf('glyphicons-halflings-regular.ttf') != -1){
            fs.readFile(__dirname + '/fonts/bootstrap/glyphicons-halflings-regular.ttf', function (err, data) {
                if (err) console.log(err);
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(data);
                res.end();
            });
        }
        else if(req.url.indexOf('glyphicons-halflings-regular.woff') != -1){
            fs.readFile(__dirname + '/fonts/bootstrap/glyphicons-halflings-regular.woff', function (err, data) {
                if (err) console.log(err);
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(data);
                res.end();
            });
        }
        else if(req.url.indexOf('glyphicons-halflings-regular.woff2') != -1){
            fs.readFile(__dirname + '/fonts/bootstrap/glyphicons-halflings-regular.woff2', function (err, data) {
                if (err) console.log(err);
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(data);
                res.end();
            });
        }

        else if(req.url.indexOf('icomoon.eot') != -1){
            fs.readFile(__dirname + '/fonts/icomoon/icomoon.eot', function (err, data) {
                if (err) console.log(err);
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(data);
                res.end();
            });
        }
        else if(req.url.indexOf('icomoon.svg') != -1){
            fs.readFile(__dirname + '/fonts/icomoon/icomoon.svg', function (err, data) {
                if (err) console.log(err);
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(data);
                res.end();
            });
        }
        else if(req.url.indexOf('icomoon.ttf') != -1){
            fs.readFile(__dirname + '/fonts/icomoon/icomoon.ttf', function (err, data) {
                if (err) console.log(err);
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(data);
                res.end();
            });
        }
        else if(req.url.indexOf('icomoon.woff') != -1){
            fs.readFile(__dirname + '/fonts/icomoon/icomoon.woff', function (err, data) {
                if (err) console.log(err);
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(data);
                res.end();
            });
        }













        else if(req.url.indexOf('prova.css') != -1){
            fs.readFile(__dirname + './prova.css', function (err, data) {
                if (err) console.log(err);
                res.writeHead(200, {'Content-Type': 'text/css'});
                res.write(data);
                res.end();
            });
        }
        else if(req.url.indexOf('css/animate.css') != -1){
            fs.readFile(__dirname + '/css/animate.css', function (err, data) {
                if (err) console.log(err);
                res.writeHead(200, {'Content-Type': 'text/css'});
                res.write(data);
                res.end();
            });
        }

        else if(req.url.indexOf('css/icomoon.css') != -1){
            fs.readFile(__dirname + '/css/icomoon.css', function (err, data) {
                if (err) console.log(err);
                res.writeHead(200, {'Content-Type': 'text/css'});
                res.write(data);
                res.end();
            });
        }
        else if(req.url.indexOf('css/bootstrap.css') != -1){
            fs.readFile(__dirname + '/css/bootstrap.css', function (err, data) {
                if (err) console.log(err);
                res.writeHead(200, {'Content-Type': 'text/css'});
                res.write(data);
                res.end();
            });
        }
        else if(req.url.indexOf('css/style.css') != -1){
            fs.readFile(__dirname + '/css/style.css', function (err, data) {
                if (err) console.log(err);
                res.writeHead(200, {'Content-Type': 'text/css'});
                res.write(data);
                res.end();
            });
        }
        else if(req.url.indexOf('style.css') != -1){ //req.url has the pathname, check if it conatins '.css'
            fs.readFile(__dirname + '/www/css/style.css', function (err, data) {
                if (err) console.log(err);
                res.writeHead(200, {'Content-Type': 'text/css'});
                res.write(data);
                res.end();
            });
        }
        else if(req.url.indexOf('bootstrap.min.css') != -1){ //req.url has the pathname, check if it conatins '.css'
            fs.readFile(__dirname + '/www/bootstrap/css/bootstrap.min.css', function (err, data) {
                if (err) console.log(err);
                res.writeHead(200, {'Content-Type': 'text/css'});
                res.write(data);
                res.end();
            });
        }
        else{
            res.writeHead(200, { "Content-Type": "text/html" });
            fs.createReadStream("./index.html", "UTF-8").pipe(res);
        }



                 










        

    } 
    else if (req.method == "POST") {
        
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); // convert Buffer to string
        });
        req.on('end', () => {
            // Split dati ricavati da richiesta POST
            var contenitore = [];
            contenitore=body.split("&");
            contenitore=contenitore.toString();
            contenitore = contenitore.replace(",", "=")
            contenitore=contenitore.split("=");
            

            for(var i=0;i<contenitore.length;i=i+2){
                
                if(contenitore[i]=="Registration"){
                    /* Re-Indirizzamento form registrazione */
                    console.log("Re-Indirizzamento");
                    res.writeHead(200, { "Content-Type": "text/html" });
                    fs.createReadStream("./Registration.html", "UTF-8").pipe(res);
                }
                else if(contenitore[i]=="btnMainGame"){
                    console.log("Ritorno sulla pagina MainGame...!->",contenitore);
                    
                    var con = mysql.createConnection({
                        host: "127.0.0.1",
                        user: "root",
                        password: "",
                        database: "dbgiocohockey"
                    });
                    if(con) {}
                    else{
                        console.log("Connessione Fallita!\nImpossibile effettuare l'accesso per la registrazione!")
                    }

                    con.connect(function(err) {
                        if (err) throw err;
                        var usr = contenitore[1];
                        con.query("SELECT EXP FROM giocatore WHERE Nickname='"+usr+"'", function (err, result, fields) {
                            if (err) throw err;
                            else{
                                var userRoomPlay = getNickUsers();
                                    
                                if(result==''){

                                    res.setHeader('Set-Cookie', ['room1='+room[0]+'','room2='+room[1]+'','room3='+room[2]+'','room4='+room[3]+'','namePlayer='+userRoomPlay+'']);
                                    res.writeHead(200, { "Content-Type": "text/html" });
                                    fs.createReadStream("./mainGame.html", "UTF-8").pipe(res);
                                }
                                else{
                                    res.setHeader('Set-Cookie', ['ex='+result[0].EXP+'','esp_prev='+result[0].EXP+'','room1='+room[0]+'','room2='+room[1]+'','room3='+room[2]+'','room4='+room[3]+'','namePlayer='+userRoomPlay+'']);

                                    res.writeHead(200, { "Content-Type": "text/html" });
                                    fs.createReadStream("./mainGame.html", "UTF-8").pipe(res);     
                                }
                            }
                        });
                        con.on('error', function(err) {
                            console.log("[mysql error]",err);
                          });
                    })               
                
                }
                else if(contenitore[i]=="RegUsername"){
                    /* ZONA QUERY SQL REGISTRATION */
                    console.log("Registrazione");

                    var con = mysql.createConnection({
                        host: "127.0.0.1",
                        user: "root",
                        password: "",
                        database: "dbgiocohockey"
                    });
                    if(con) {}
                    else{
                        console.log("Connessione Fallita!\nImpossibile effettuare la registrazione!")
                    }

                    con.connect(function(err) {
                        if (err) throw err;
                        var usr = contenitore[1];
                        var psw = contenitore[3];
                        con.query("INSERT INTO giocatore(Nickname, Password, Livello, EXP) VALUES ('"+usr+"','"+psw+"','0','0')", function (err, result, fields) {
                        
                            if(err){
                                console.log("REGISTRAZIONE FALLITA!");
                                fs.readFile(__dirname + '/registrationFalse.html', function (err, data) {
                                    if (err) console.log(err);
                                    res.writeHead(200, {'Content-Type': 'text/html'});
                                    res.write(data);
                                    res.end();
                                });
                            }
                            else{
                                console.log("REGISTRAZIONE EFFETTUATA!");
                                fs.readFile(__dirname + '/registrationTrue.html', function (err, data) {
                                    if (err) console.log(err);
                                    res.writeHead(200, {'Content-Type': 'text/html'});
                                    res.write(data);
                                    res.end();
                                });
                            }
                        });
                    })
                    
                }
                else if(contenitore[i]=="LoginUsr"){
                    /* ZONA QUERY SQL LOGIN */
                    
                    var con = mysql.createConnection({
                        host: "127.0.0.1",
                        user: "root",
                        password: "",
                        database: "dbgiocohockey"
                    });
                    if(con) {}
                    else{
                        console.log("Connessione Fallita!\nImpossibile accedere al database per la Login!")
                    }

                    con.connect(function(err) {
                        if (err) throw err;
                        var usr = contenitore[1];
                        var psw = contenitore[3];
                        con.query("SELECT Nickname,Password,Livello,EXP FROM giocatore WHERE Nickname='"+usr+"' AND Password='"+psw+"'", function (err, result, fields) {
                            if (err) throw err;
                            else{
                                if(result==''){
                                    fs.readFile(__dirname + '/loginError.html', function (err, data) {
                                        if (err) console.log(err);
                                        res.writeHead(200, {'Content-Type': 'text/html'});
                                        res.write(data);
                                        res.end();
                                    }); 
                                }
                                else{
                                    console.log("ACCESSO EFFETTUATO DA:",usr);
                                    
                                    usersConnected[usersConnected.length] = usr;

                                    ///789-CAZZO DI BUG///
                                    var userRoomPlay = getNickUsers();

                                    res.setHeader('Set-Cookie', ['nick='+result[0].Nickname+'', 'liv='+result[0].Livello+'', 'ex='+result[0].EXP+'','esp_prev='+result[0].EXP+'','room1='+room[0]+'','room2='+room[1]+'','room3='+room[2]+'','room4='+room[3]+'','namePlayer='+userRoomPlay+'']);
                                    res.writeHead(200, { "Content-Type": "text/html" });
                                    fs.createReadStream("./mainGame.html", "UTF-8").pipe(res);
                                }
                                
                            }
                        });
                        con.on('error', function(err) {
                            console.log("[mysql error]",err);
                          });
                    })
                }
                else if(contenitore[i]=="PlayGame"){
                    /* Re-Indirizzamento form StartGame */
                    ///789///
                    console.log("DATI userPlayGame: ",usersPlayGame);
                    console.log("CONTENUTO RICEVUTO: ",contenitore, "-> ",contenitore[2]);
                    
                    if( (contenitore[2]=="1" && room[0]==false) ||
                        (contenitore[2]=="2" && room[1]==false) ||
                        (contenitore[2]=="3" && room[2]==false) ||
                        (contenitore[2]=="4" && room[3]==false) ||
                        (contenitore[2]=="random" && (room[0]==false || room[1]==false || room[2]==false || room[3]==false))){
                        // Scelta stanza(partita) numero 01
                        res.setHeader('Set-Cookie', ['selectRoom='+contenitore[2]+'']);
                        res.writeHead(200, { "Content-Type": "text/html" });
                        fs.createReadStream("./startGame.html", "UTF-8").pipe(res);
                    }
                    else{
                        // Caso nel quale tutte le stanze/stanza selezionata sono occupate
                        ///789///
                        
                        var userRoomPlay = getNickUsers();
                        console.log("RIS FINALE-> ",userRoomPlay);
                        res.setHeader('Set-Cookie', ['room1='+room[0]+'','room2='+room[1]+'','room3='+room[2]+'','room4='+room[3]+'','namePlayer='+userRoomPlay+'']);
                        res.writeHead(200, { "Content-Type": "text/html" });
                        fs.createReadStream("./mainGame.html", "UTF-8").pipe(res);
                    }                    
                }
                else if(contenitore[i]=="ENDGame"){
                    /* Evento fine partita */
                    var ris="perso";
                    var nick=contenitore[2];
                    var liv;
                    var exp;

                    for(var j=0;j<finalDataUsers.length;j++){
                        if(finalDataUsers[j]!=0 && (finalDataUsers[j].nick1==nick || finalDataUsers[j].nick2==nick)){
                            if(finalDataUsers[j].winner==nick){
                                ris="vinto";
                                break;
                            }
                        }
                    }

                    var con = mysql.createConnection({
                        host: "127.0.0.1",
                        user: "root",
                        password: "",
                        database: "dbgiocohockey"
                    });
                    if(con) {}
                    else{
                        console.log("Connessione Fallita!\nImpossibile prelevare i dati del giocatore a fine partita!")
                    }
                    con.query("SELECT Livello,EXP FROM giocatore WHERE Nickname='"+nick+"'", function (err, result, fields) {
                    if (err) throw err;
                    else{
                        if(result=='') {}        
                        else{
                            liv=result[0].Livello;
                            exp=result[0].EXP;
                            
                            res.setHeader('Set-Cookie', ['result='+ris+'','liv='+liv+'','ex='+exp+'']);
                            res.writeHead(200, { "Content-Type": "text/html" });
                            fs.createReadStream("./ENDGame.html", "UTF-8").pipe(res);
                        }
                    }
                    });
                    con.on('error', function(err) {
                        console.log("W - [mysql error]",err);
                    });
                      
                }
                
            }

            //console.log("BODY->",body);
        });

    }

}).listen(port);