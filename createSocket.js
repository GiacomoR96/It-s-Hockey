/* client.on('login', (data) =>{
        
    var oggettoDaSalvare = {
        socket : client,
        nickname: data.nickname
    }

    // SITUAZIONE DEL LOGIN TRAMITE DISCONNESSIONE

    for(var i=0;i<clients_nickname.length;i++){
        if(data.nickname == clients_nickname[i]){
            clients[data.nickname] = oggettoDaSalvare;
            var obj = clients[clients_nickname[i]];

            obj.socket.emit("myPosition",dataClients[clients_nickname[i]]);

            for(var i=0;i<clients_nickname.length;i++){
                if(data.nickname != clients_nickname[i]){
                    obj.socket.emit("rivalPosition",dataClients[clients_nickname[i]]);
                    i=clients_nickname.length;
                }
            }

            //(PASSAGGIO POSIZIONE PALLINA)

            //(PASSAGGIO PUNTEGGIO PARTITA)
            obj.socket.emit("refreshScoreGame",{nickname: clients_nickname[0], score:punteggioPartita[clients_nickname[0]]});
            obj.socket.emit("refreshScoreGame",{nickname: clients_nickname[1], score:punteggioPartita[clients_nickname[1]]});
                           
            obj.socket.emit("start_game",{start:true});
            obj.socket.emit("users_game", {users: clients_nickname});
            
            // FORSE RETURN
            // return 0;
        }
    }    

    clients[data.nickname] = oggettoDaSalvare;    // viene salvato il nuovo client nell'array che contiene i riferimenti a tutti i client connessi
    clients_nickname.push(data.nickname);         // viene salvato il nickname nell'array contenente tutti i nickname dei client connessi
    console.log("Si è collegato il giocatore: ", data.nickname);
    console.log("Giocatori connessi: ", clients_nickname);

    if(clients_nickname.length>1){
        for(var i=0;i<clients_nickname.length;i++){
            if(clients[clients_nickname[i]]){
                
                if(!dataClients[clients_nickname[i]]){
                    
                    var x = initialPositionClients[0]?initialPositionClients[0]:null;
                    var y = initialPositionClients[1]?initialPositionClients[1]:null;
                    initialPositionClients.splice(0, 2);

                    var dataCurrentClient = {
                        posX : x,
                        posY : y,
                        nickname: clients_nickname[i]
                    }

                    dataClients[clients_nickname[i]] = dataCurrentClient;
                }
                
                punteggioPartita[clients_nickname[i]] = 0;

                var obj = clients[clients_nickname[i]];
                obj.socket.emit("positionBall", {x: initialPositionBall[0], y:initialPositionBall[1]});
                obj.socket.emit("users_game", {users: clients_nickname});
                obj.socket.emit("setIDPorta",{idPorta:i});
                obj.socket.emit("start_game",{start:true});
            }

        }
    }
}); */