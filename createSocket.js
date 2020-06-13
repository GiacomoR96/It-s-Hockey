console.log('Avvio processo socketServer..');
var express = require('express');
var app = express();
var http = require('http');
var usersSocket = [];
var socket = require('socket.io')(http.createServer(app));

function findNickname(socket) {
    for(var i=0; i<usersSocket.length; i++) {
        if(usersSocket[i].socket == socket) {
            return usersSocket[i].nickname;
        }
    }
    return null;
}

socket.listen(8081, function() {
    console.log('socketServer sono in ascolto sulla porta ' + socket.address().port); 
});

socket.on('connection', (client) => {
    console.log('socketServer: Qualcuno ha mandato un messaggio sulla socket.');

    client.on('updateSocket', (nickname) => {
        var index = findSocketIndex(nickname);
        if (index == null || index == undefined) {
            client.emit('redirect', {path: '/errorPage.html', message: `PAGINA NON TROVATA!`});
        } else {
            usersSocket[index].socket = client;
            client.emit('updateSocket');
        }
    });

    client.on('dataUser', () => {
        process.send({event:'dataUser', nickname: findNickname(client)});
    });

    client.on('getRooms', () => {
        process.send({event:'getRooms', nickname: findNickname(client)});
    });

    client.on('joinIntoRoom', (data) => {
        process.send({event:'joinIntoRoom', nickname: findNickname(client), data: data.data});
    });

    client.on('createRoom', (data) => {
        process.send({event:'createRoom', nickname: findNickname(client), data: data.data});
    });

    client.on('loginUser', (data) => {
        var index = findSocketIndex(data.data.nickname);
        if((index != null || index != undefined) && usersSocket[index].socket) {
            usersSocket[index].socket.emit('redirect', {path: '/errorPage.html', message: `Qualcuno ha effettuato l'accesso al tuo account!`});
            usersSocket.splice(index, 1);
        }

        var socketClient = {
            socket : client,
            nickname: data.data.nickname
        }
        usersSocket.push(socketClient);
        process.send({event:'loginUser', data: data.data});
    });
    
    client.on('registrationUser', (data) => {
        var socketClient = {
            socket : client,
            nickname: data.data.nickname
        }
        usersSocket.push(socketClient);
        process.send({event:'registrationUser', data: data.data});
    });

    client.on('logout', () => {
        usersSocket.splice(findSocketIndex(findNickname(client)), 1);
    });

    client.on('cancelGameWaiting', () => {
        process.send({event:'cancelGameWaiting', nickname: findNickname(client)});
    });

    client.on('cancelGameLoading', () => {
        process.send({event:'cancelGameLoading', nickname: findNickname(client)});
    });

    client.on('requestStartGame', (data) =>{
        process.send({event:'requestStartGame', nickname: findNickname(client)});
    });

    client.on('puckPosition', (data) => {
        process.send({event:'puckPosition', nickname: findNickname(client), data: data.data});
    });

    client.on('moveMyPosition', (data) => {
        process.send({event:'moveMyPosition', nickname: findNickname(client), data: data.data});
    });

    client.on('goalSuffered', () => {
        process.send({event:'goalSuffered', nickname: findNickname(client)});
    });

    client.on('matchReport', () => {
        process.send({event:'matchReport', nickname: findNickname(client)});
    });

    client.on('backToMain', () => {
        client.emit('redirect', {path: '/mainGame.html'});
    });

    client.on('quickGame', () =>{
        process.send({event:'quickGame', nickname: findNickname(client)});
    });

});

function getSocket(nickname) {
    for(var i=0; i<usersSocket.length; i++) {
        if(usersSocket[i].nickname == nickname) {
            return usersSocket[i].socket;
        }
    }
    return null;
}

function findSocketIndex(nickname) {
    for(var i=0; i<usersSocket.length; i++) {
        if(usersSocket[i].nickname == nickname) {
            return i;
        }
    }
    return null;
}

process.on('message', (data) => {
    console.log('Messaggio mandato: \t',data);
    var socketClient = getSocket(data.nickname);
    switch(data.event){
        case 'getRooms': {
            socketClient.emit(data.event, data.data);
            break;
        }
        case 'busyRoom': {
            socketClient.emit(data.event);
            break;
        }
        case 'passwordError': {
            socketClient.emit(data.event);
            break;
        }
        case 'updateRooms': {
            socket.sockets.emit('getRooms', data.data);
        }
        case 'redirect': {
            socketClient.emit(data.event, data.data);
            break;
        }
        case 'endSocket': {
            socketClient.emit('redirect', data.data);
            usersSocket.splice(findSocketIndex(data.nickname), 1);
            break;
        }
        case 'dataUser': {
            socketClient.emit(data.event, data.data);
            break;
        }
        case 'waitingPlayer': {
            socketClient.emit(data.event);
            break;
        }
        case 'waitingGame': {
            socketClient.emit(data.event);
            break;
        }
        case 'eraseRoom': {
            socketClient.emit(data.event);
            break;
        }
        case 'puckPosition': {
            socketClient.emit(data.event,data.data);
            break;
        }
        case 'rivalData': {
            socketClient.emit(data.event,data.data);
            break;
        }
        case 'myPosition': {
            socketClient.emit(data.event,data.data);
            break;
        }
        case 'launchGame': {
            socketClient.emit(data.event);
            break;
        }
        case 'moveRivalPosition': {
            socketClient.emit(data.event,data.data);
            break;
        }
        case 'refreshScoreGame': {
            socketClient.emit(data.event,data.data);
            break;
        }
        case 'finishGame': {
            socketClient.emit(data.event,data.data);
            break;
        }
        case 'setPuckPosition': {
            socketClient.emit(data.event,data.data);
            break;
        }
        case 'continueGame': {
            socketClient.emit(data.event,data.data);
            break;
        }
        case 'matchReport': {
            socketClient.emit(data.event,data.data);
            break;
        }
        case 'notFoundRoom': {
            socketClient.emit(data.event);
            break;
        }
    }
});