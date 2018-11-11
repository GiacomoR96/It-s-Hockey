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

for(var i=0;i<4;i++){
    serverGame[i] = fork("serverGame.js");      // serverGame[serverGame.length]
}

var usersConnected = [];
var usersPlayGame = [];
var countUsers = 0;

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

    var indiceServer;

    for(var i = 0; i < usersPlayGame.length; i++) {
        if(data.nick == usersPlayGame[i]) {         
            if(i % 2 == 1 || i == 0) {
                indiceServer = parseInt(i/2);
            }
            else{
                indiceServer = (i/2)-1;
            }
            i = usersPlayGame.length;
        }
    }
    console.log("PADRE_INDICE:",indiceServer);
    switch(data.event){
        case "login":{
        //    console.log("PADRE - DATI ricevuti dalla socket:",data);
            usersPlayGame[countUsers] = data.nick;
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
            serverGame[indiceServer].send({event:"id",indice:indiceServer});
            serverGame[indiceServer].send(data);
            break;
        }
    }

});

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


//    console.log("Messaggio ricevuto", req.url);

    if (req.method == "GET") {

        console.log(req.url);

        if(req.url.indexOf('.html') != -1){ //req.url has the pathname, check if it conatins '.html'

            fs.readFile(__dirname + '/Index.html', function (err, data) {
                if (err) console.log(err);
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(data);
                res.end();
            });

        }

        else if(req.url.indexOf('phaser.js') != -1){ //req.url has the pathname, check if it conatins '.js'

            fs.readFile(__dirname + '/www/js/phaser.js', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/javascript'});
            res.write(data);
            res.end();
            });
    
        }
        else if(req.url.indexOf('socket.io.js') != -1){ //req.url has the pathname, check if it conatins '.js'

            fs.readFile(__dirname + '/www/js/socket.io.js', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/javascript'});
            res.write(data);
            res.end();
            });
    
        }
        else if(req.url.indexOf('game.js') != -1){ //req.url has the pathname, check if it conatins '.js'

            fs.readFile(__dirname + '/www/js/game.js', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/javascript'});
            res.write(data);
            res.end();
            });
    
        }
        else if(req.url.indexOf('test.js') != -1){ //req.url has the pathname, check if it conatins '.js'

            fs.readFile(__dirname + '/www/js/test.js', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/javascript'});
            res.write(data);
            res.end();
            });
    
        }
        else if(req.url.indexOf('sfondoWeb2.png') != -1){ //req.url has the pathname, check if it conatins '.js'

            fs.readFile(__dirname + '/www/img/sfondoWeb2.png', function (err, data) {
            if (err) console.log(err);
            res.writeHead(200, {'Content-Type': 'text/html'});
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
            fs.createReadStream("./Index.html", "UTF-8").pipe(res);
        }



                 










        

    } 
    else if (req.method == "POST") {
        
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
                else if(contenitore[i]=="RegUsername"){
                    /* ZONA QUERY SQL REGISTRATION */
                    console.log("Registrazione");
                
                    con.connect(function(err) {
                        if (err) throw err;
                        var usr = contenitore[1];
                        var psw = contenitore[3];
                        con.query("INSERT INTO giocatore(Nickname, Password, Livello, EXP) VALUES ('"+usr+"','"+psw+"','0','0')", function (err, result, fields) {
                        
                            if(err){
                               res.end("Utente esistente!\nCambiare Nickname"); 
                            }
                            else{
                                console.log("REGISTRAZIONE EFFETTUATA!");
                                res.end("REGISTRAZIONE EFFETTUATA!\nPuoi accedere con le tue credenziali!");
                            }
                        });
                    })
                    
                }
                else if(contenitore[i]=="LoginUsr"){
                    /* ZONA QUERY SQL LOGIN */
                    console.log("Login");

                    con.connect(function(err) {
                        if (err) throw err;
                        var usr = contenitore[1];
                        var psw = contenitore[3];
                        con.query("SELECT Nickname,Password,Livello,EXP FROM giocatore WHERE Nickname='"+usr+"'", function (err, result, fields) {
                            if (err){}
                            else{
                                console.log("RESULT->",result[0].Nickname);
                                if(result[0].Nickname==usr && result[0].Password==psw){
                                    console.log("ACCESSO EFFETTUATO DA:",usr);
                                    usersConnected[usersConnected.length] = usr;
                                    console.log("GIOCATORE LOGGATO->",usersConnected[usersConnected.length-1]);

                                    console.log("VALORE RESTITUITO->",room);
                                    console.log("VALORE RESTITUITO->",room[0]);
                                    res.setHeader('Set-Cookie', ['nick='+result[0].Nickname+'', 'liv='+result[0].Livello+'', 'ex='+result[0].EXP+'','room1='+room[0]+'','room2='+room[1]+'','room3='+room[2]+'','room4='+room[3]+'']);
                                    res.writeHead(200, { "Content-Type": "text/html" });
                                    fs.createReadStream("./MainGame.html", "UTF-8").pipe(res);

                                }
                                else{  
                                    res.end("Utente NON esistente!\nRe-inserire le proprie credenziali");
                                }
                            }
                        });
                    })
                }
                else if(contenitore[i]=="PlayGame"){
                    /* Re-Indirizzamento form StartGame */
                    console.log("PlayGame");

                    usersPlayGame[usersPlayGame.length] = contenitore[1];
                    console.log("GIOCATORE CHE VUOLE GIOCARE->",usersPlayGame[usersPlayGame.length-1]);
                    

                    if(room[0]==false || room[1]==false || room[2]==false || room[3]==false){

                        if((usersPlayGame.length%2)==0){
                            // Avviare instanza figlio
                            for(var i=0;i<room.length;i++){
                                if(room[i]== false){
                                    room[i] = true;
                                    i = room.length;
                                }
                            }
                        }
                        res.writeHead(200, { "Content-Type": "text/html" });
                        fs.createReadStream("./www/StartGame.html", "UTF-8").pipe(res);
                    
                    }
                    else{
                        // Caso nel quale tutte le stanze sono occupate 
                        res.setHeader('Set-Cookie', ['room1='+room[0]+'','room2='+room[1]+'','room3='+room[2]+'','room4='+room[3]+'']);
                        res.writeHead(200, { "Content-Type": "text/html" });
                        fs.createReadStream("./MainGame.html", "UTF-8").pipe(res);
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