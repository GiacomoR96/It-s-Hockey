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
var finalDataUsers = [];

var livEXP = [10,25,45,75,115,165,230,310,405,530];
var pointWinner=7;
var pointLoser=3;
// 10 15 20 30 40 50 65 80 95 125


for(var i=0;i<4;i++){
    serverGame[i] = fork("serverGame.js");      // serverGame[serverGame.length]
}

var usersConnected = [];
var usersPlayGame = [];
var countUsers = 0;
var numUser = 0;
var instanceServerUsers = [];

/* STANZA LIBERA = false, OCCUPATA =  true */
var room = [false, false, false, false];

/* COMUNICAZIONE DA FIGLIO_SOCKET A PADRE */
child_process.on("message", (data) =>{


    /* if(indice%2==1 || indice == 0) {
        int x = indice/2;
    }
    else {
        int y = (indice/2)-1;
    } */
    /* Gestire il tutto con un array di oggetti
        ove ogni indice del server corrispondono 2 nick
        e appena arriva un messaggio, se il nick del tizio
        che ha mandato il messaggio è gia' dentro un oggetto
        di questo array allora l'indiceServer corrispondera'
        al valore dell'indice dell'oggetto dove e' stato
        trovato il record, altrimenti aspetta un nuovo avversario
    */ 
    var indiceServer = -1;
    //console.log("VALORE ATTUALE RICEVUTO:",data.nick);
//    if(usersPlayGame.includes(data.nickname)) {
//        console.log("SONO DENTRO .includes");
    for(var i=0;i<instanceServerUsers.length;i++){
        //console.log("CICLO SINO A :",instanceServerUsers.length);
        if(instanceServerUsers[i].nick1==data.nick || instanceServerUsers[i].nick2==data.nick){
            indiceServer = instanceServerUsers[i].indice;
            //console.log("HO PRELEVATO IL VALORE: ",indiceServer,"! (",instanceServerUsers[i].indice,")");
        }
    }
    if(indiceServer==-1){
        usersPlayGame[numUser] = data.nick;
        numUser++;
        
        //console.log("Incremento... ");
        if(numUser % 2 == 0 && room.includes(false)){
            indiceServer = room.indexOf(false);
            room[indiceServer] = true;
            //console.log("valori presenti dentro usersPlayGame->",usersPlayGame);
        
            instanceServerUsers[indiceServer]={ indice:indiceServer, nick1:usersPlayGame[(usersPlayGame.length)-2], nick2:usersPlayGame[(usersPlayGame.length)-1], blabla:-1 };
           //console.log("TERNA--->",instanceServerUsers[indiceServer]);
        }
    }
    //for(var i = 0; i < usersPlayGame.length; i++) {
        
    //    if(data.nick == usersPlayGame[i]) {         
            
            /*     indiceServer = parseInt(i/2);
            }
            else{
                indiceServer = (i/2)-1;
            }
            i = usersPlayGame.length; */
        //}
    //}
    //console.log("PADRE_INDICE:",indiceServer);
    switch(data.event){
        case "login":{
            console.log("---------------SONO DENTRO la LOGIN con ",data.nick);
        //    console.log("PADRE - DATI ricevuti dalla socket:",data);
            countUsers++; 
            if(countUsers%2 == 0){
            //    console.log("VOGLIO AVVIARE IL GIOCO!");
                //Avviamo uno dei serverGame per iniziare la partita
//                serverGame[serverGame.length] = fork('serverGame.js');

                serverGame[indiceServer].send({event:"id",indice:indiceServer});
            //    for(var i=0;i<usersPlayGame.length;i++) console.log("**********************************PERSONE PRESENTI ",usersPlayGame[i]);
                serverGame[indiceServer].send({
                    event:"login",
                    nick1:usersPlayGame[(usersPlayGame.length)-2],
                    nick2:usersPlayGame[(usersPlayGame.length)-1]
                });
            }
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
            console.log("EVENTO puckPosition DA:",data.nick);
            //console.log("******************************************\n+++++++++++++++++++++++++++++++++++++++++++\nPADRE MY POSITION->",data);
            
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

    //console.log("NICK PRESENTI ALLA FINE:",usersPlayGame);

});

updateStatPlayers = (data) =>{
    finalDataUsers[data.id]={nick1:data.nick1,nick2:data.nick2,winner:data.winner};
    console.log("OGGETTO------------------>",finalDataUsers[data.id]);
    
    console.log("Mi collego al DB...")
    var con = mysql.createConnection({
        host: "127.0.0.1",
        user: "root",
        password: "",
        database: "dbgiocohockey"
    });
    if(con){
        console.log("Connessione al DB effettuata!");
    }
    else{
        console.log("Connessione Fallita!")
    }

    con.connect(function(err) {
        if (err) throw err;
        
        var liv;
        var exp;

        //Winner
        
        var usrWinner = finalDataUsers[data.id].nick1==finalDataUsers[data.id].winner?finalDataUsers[data.id].nick1:finalDataUsers[data.id].nick2;
        console.log("USER_WINNER->",usrWinner);
        //con.query("SELECT Livello,EXP FROM giocatore WHERE Nickname='"+usr+"' AND Password='"+psw+"'", function (err, result, fields) {
                        
        con.query("SELECT Livello,EXP FROM giocatore WHERE Nickname='"+usrWinner+"'", function (err, result, fields) {
        if (err) throw err;
        else{
            if(result==''){
                //console.log("STO CAZZO!");            
            }        
            else{
                //console.log("\nRESULT:\n",result,"\n\n");
                liv=result[0].Livello;
                exp=result[0].EXP;

                //console.log("1-CAZZO DI BUG,",liv,",",exp);

                //console.log("W - DATI DA DB-------PRIMA----->",liv,"_",exp);

                exp+=pointWinner;
                if(liv < livEXP.length && exp >= livEXP[liv]  ) liv++;

                con.query("UPDATE giocatore SET Livello='"+liv+"', EXP='"+exp+"' WHERE Nickname='"+usrWinner+"'", function (err, result, fields) {
                    if (err) throw err;
                    else{
                        //console.log("W - RISULTATO DB DOPO->",result);                   
                    }
                });
                con.on('error', function(err) {
                    console.log("W - [mysql error]",err);
                });

            }
        }
        });
        con.on('error', function(err) {
            console.log("W - [mysql error]",err);
        });
        
        
        
        //Loser

        var usrLoser = finalDataUsers[data.id].nick1!=finalDataUsers[data.id].winner?finalDataUsers[data.id].nick1:finalDataUsers[data.id].nick2;

        con.query("SELECT Livello,EXP FROM giocatore WHERE Nickname='"+usrLoser+"'", function (err, result, fields) {
            if (err) throw err;
            else{
                if(result==''){
                    //console.log("STO CAZZO!");            
                }        
                else{
                    //console.log("\nRESULT:\n",result,"\n\n");
                    liv=result[0].Livello;
                    exp=result[0].EXP;
    
                    //console.log("2-CAZZO DI BUG,",liv,",",exp);
    
                    //console.log("L - DATI DA DB-------PRIMA----->",liv,"_",exp);
    
                    exp+=pointLoser;
                    if(liv < livEXP.length && exp >= livEXP[liv]  ) liv++;
    
                    con.query("UPDATE giocatore SET Livello='"+liv+"', EXP='"+exp+"' WHERE Nickname='"+usrLoser+"'", function (err, result, fields) {
                        if (err) throw err;
                        else{
                            //console.log("L - RISULTATO DB DOPO->",result);                   
                        }
                    });
                    con.on('error', function(err) {
                        console.log("L - [mysql error]",err);
                    });
    
                }
            }
        });
        con.on('error', function(err) {
            console.log("L - [mysql error]",err);
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
            //console.log("SUCA PADRE->",data);
            child_process.send(data);
            break;
        }
        case "updateDataDB":{
            updateStatPlayers(data);
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
    }

});
/* COMUNICAZIONE DA PADRE A FIGLIO */
/*
child_process.send({
    message: `Inviato da processo padre con PID: ${process.pid}\n`
});
*/

var serverHTTP = http.createServer((req,res) =>{


    console.log("Messaggio ricevuto", req.url);

    if (req.method == "GET") {

        console.log(req.url);

        if(req.url.indexOf('index.html') != -1){
                fs.readFile(__dirname + '/index.html', function (err, data) {
                if (err) console.log(err);
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(data);
                res.end();
                console.log("MARCOMERDA");
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
        else if(req.url.indexOf('ENDGame.html') != -1){
            fs.readFile(__dirname + '/ENDGame.html', function (err, data) {
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
            console.log("ciaone");
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
        
        //  chunk.toString(); // convert Buffer to string
  
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); // convert Buffer to string
        });
        req.on('end', () => {
            var contenitore = [];
            contenitore=body.split("&");
        //    console.log("DIM.",contenitore.length,",CONT->",contenitore);
            contenitore=contenitore.toString();
            contenitore = contenitore.replace(",", "=")
        //    console.log("DIM.",contenitore.length,",CONT->",contenitore);
            contenitore=contenitore.split("=");
            
            console.log("DIM.",contenitore.length,",CONT->",contenitore);

            for(var i=0;i<contenitore.length;i=i+2){
                
                if(contenitore[i]=="Registration"){
                    /* Re-Indirizzamento form registrazione */
                    console.log("Re-Indirizzamento");
                    res.writeHead(200, { "Content-Type": "text/html" });
                    fs.createReadStream("./Registration.html", "UTF-8").pipe(res);
                }
                else if(contenitore[i]=="btnMainGame"){
                    /* Re-Indirizzamento form registrazione */
                    console.log("Ritorno sulla pagina MainGame...!");
                    res.writeHead(200, { "Content-Type": "text/html" });
                    fs.createReadStream("./mainGame.html", "UTF-8").pipe(res);
                }
                else if(contenitore[i]=="RegUsername"){
                    /* ZONA QUERY SQL REGISTRATION */
                    console.log("Registrazione");

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
                                //res.end("Utente esistente!\nCambiare Nickname"); 
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
                    console.log("Login--------------------------------");

                    console.log("Mi collego al DB...")
                    var con = mysql.createConnection({
                        host: "127.0.0.1",
                        user: "root",
                        password: "",
                        database: "dbgiocohockey"
                    });
                    if(con){
                        console.log("Connessione al DB effettuata!");
                    }
                    else{
                        console.log("Connessione Fallita!")
                    }

                    con.connect(function(err) {
                        if (err) throw err;
                        var usr = contenitore[1];
                        var psw = contenitore[3];
                        con.query("SELECT Nickname,Password,Livello,EXP FROM giocatore WHERE Nickname='"+usr+"' AND Password='"+psw+"'", function (err, result, fields) {
                            if (err) throw err;
                            else{
                                //console.log("RESULT->",result);
                                if(result==''){
                                    //console.log("STO CAZZO!");
                                    fs.readFile(__dirname + '/loginError.html', function (err, data) {
                                        if (err) console.log(err);
                                        res.writeHead(200, {'Content-Type': 'text/html'});
                                        res.write(data);
                                        res.end();
                                    }); 
                                    //res.end("Utente NON esistente!\nRe-inserire le proprie credenziali");
                                }
                                else{
                                //if(result[0].Nickname==usr && result[0].Password==psw){
                                    console.log("ACCESSO EFFETTUATO DA:",usr);
                                    usersConnected[usersConnected.length] = usr;
                                    console.log("GIOCATORE LOGGATO->",usersConnected[usersConnected.length-1]);

                                    console.log("VALORE RESTITUITO->",room);
                                    console.log("VALORE RESTITUITO->",room[0]);
                                    res.setHeader('Set-Cookie', ['nick='+result[0].Nickname+'', 'liv='+result[0].Livello+'', 'ex='+result[0].EXP+'','esp_prev='+result[0].EXP+'','room1='+room[0]+'','room2='+room[1]+'','room3='+room[2]+'','room4='+room[3]+'','namePlayer='+usersPlayGame+'']);
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
                    console.log("PlayGame");

                    usersPlayGame[usersPlayGame.length] = contenitore[1];
                    console.log("GIOCATORE CHE VUOLE GIOCARE->",usersPlayGame[usersPlayGame.length-1]);
                    

                    if(room[0]==false || room[1]==false || room[2]==false || room[3]==false){

                        res.writeHead(200, { "Content-Type": "text/html" });
                        fs.createReadStream("./startGame.html", "UTF-8").pipe(res);
                    
                    }
                    else{
                        // Caso nel quale tutte le stanze sono occupate 
                        res.setHeader('Set-Cookie', ['room1='+room[0]+'','room2='+room[1]+'','room3='+room[2]+'','room4='+room[3]+'']);
                        res.writeHead(200, { "Content-Type": "text/html" });
                        fs.createReadStream("./mainGame.html", "UTF-8").pipe(res);
                    }
                    
                }
                
            }

            console.log("BODY->",body);
        });
    


    }

}).listen(port);

//Richiamiamo il figlio facendogli eseguire la parte relativa al
//gioco
//const child = spawn ('pwd');
/* 
    var exec = require('child_process').exec;
    exec('node -v', function(error, stdout,stderr) {
        console.log('stdout: ', + stdout);
        console.log('stderr: ', + stderr);
        if(erro != null) {
            console.log('exec error: ', + error);
        }
    });

*/ 

/* 
 */ 

/* 
var serverWeb = http.createServer(app);
var socketServerWeb = require('socket.io')(serverWeb); */





//    console.log("Usr=",data.usr,"Pass=",data.psw);



//   obj.socket.emit("myPosition",dataClients[data.nickname]);


/* 
serverWeb.listen(port, () =>{
    logger.emit("info","Server avviato sulla porta ",port);
}); */