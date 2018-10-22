console.log("--------------SONO IL FIGLIOOOO!!");
var express = require('express');
var app = express();
var EventEmitter = require('events').EventEmitter;          // Forse
var logger = new EventEmitter();
var port = 8081;
var logs = require("./log");
var http = require('http');
                var serverWebSocket = http.createServer(app);
//var x = require ('child_process'); 

                var listener = require('socket.io')(serverWebSocket);
                //if(socketServerWeb) console.log("SONO IN ASCOLTO");

/*                 socketServerWeb.listen(port, () =>{
                    console.log("socketServer avviato sulla porta ",listener.address().port,"...");
                }); */

listener.listen(8081, function(){
    console.log('Listening on port ' + listener.address().port); //Listening on port 8888
});

process.on('message', (data) => {
    console.log('Processo Figlio ha ricevuto: ', data);
//    process.disconnect();
});

//process.send({ it: 'Ciao', en: 'Hello' });

logger.on("info", (message) =>{
    logs.info(message);
});

logger.on("error", (message) =>{
    logs.error(message);
});

//socketServerWeb.on('connection', (client) =>{
    listener.on('connection', (client) =>{
    console.log("-----------------socketClient: Qualcuno ha mandato un messaggio alla socket!");
    
//    console.log("contenuto:\n",client);

//    console.log("CONTENUTO=>",client);

    client.on('login', (data) =>{
            
        var oggettoDaSalvare = {
            socket : client,
            nickname: data.nickname
        }
        console.log("SONO DENTRO LA LOGIN!", oggettoDaSalvare.nickname);
    //  process.send({ obj:oggettoDaSalvare.nickname });  questo caso funziona perchè inviamo una stringa
        process.send( JSON.stringify({socket: oggettoDaSalvare.socket, nickname: oggettoDaSalvare.nickname}) );
    });

});

