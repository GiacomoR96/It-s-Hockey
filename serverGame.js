/* Inizializzazione del figlio */

var express = require("express");
var app = express();

console.log("ServerGiocoFiglio avviato...",process.pid);

var nickname1;
var nickname2;
var id;

var dataClients = [];
var initialPositionClients = [400,700,400,700];
var initialPositionBall = [400,450];    //400,565
var punteggioPartita = [];
var punteggioFinale = 1;               //7
var posBaseX = 400;
var posBaseY = 450;

function delayTime(){
    setTimeout(function myTime(){
        //console.log("CAZZO DI BUG!");
        reset();
        process.send({id:id,event:"stopServerGame"});
        //console.log(process.pid," -> STO STACCASTACCANDO TUTTO");
        //process.exit();        
    },5000);
}

reset = () =>{
    // BELLE STE ARROW FUNCTION ♥ (CAZZO DI BUG)
    nickname1 = nickname2 = "";

    dataClients = [];
    initialPositionClients = [400,700,400,700];
    punteggioPartita = [];    
}

process.on("message", (data) => {
    //console.log("SERVER_GAME ha ricevuto: ",data);

    switch(data.event){
        case "id":{
            id = data.indice;
            break;
        }
        case "startUpServer":{
            console.log("F - startUpServer");
            nickname1 = data.nick1;
            nickname2 = data.nick2;
            
            for(var i=0;i<2;i++){

                var x = initialPositionClients[0]?initialPositionClients[0]:null;
                var y = initialPositionClients[1]?initialPositionClients[1]:null;
                initialPositionClients.splice(0, 2);

                var dataCurrentClient = {
                    posX : x,
                    posY : y,
                    nickname: i==0?nickname1:nickname2
                }

                dataClients[i] = dataCurrentClient;
                 console.log(".....................................");
            /*    console.log("SERVER_FIGLIO_DataClient:",dataClients[i]); */
                punteggioPartita[i] = 0;
                var nick = (i==0)?nickname1:nickname2;
                var nick_rival = {
                    rival: (i==0)?nickname2:nickname1
                }
                var val_i = {idPorta:i};
                console.log("Valore nick:",nick,"Valore nick_rival:",nick_rival);
                process.send({id:id,nick:nick,event:"positionBall",data: initialPositionBall});
                process.send({id:id,nick:nick,event:"users_game",rival:nick_rival});
                process.send({id:id,nick:nick,event:"setIDPorta", idPorta:val_i});
                process.send({id:id,nick:nick,event:"start_game", start:true});
                console.log("F - fine");
            }
            break;
        }
        case "myPosition":{

            if(data.nick==nickname1)    process.send({id:id,nick:nickname1,event:"myPosition",data:dataClients[0]});
            else                        process.send({id:id,nick:nickname2,event:"myPosition",data:dataClients[1]});

            break;
        }
        case "rivalPosition": {
            var tmp;
            if(data.nick==nickname1){
                tmp = {
                    posX : dataClients[1].posX,
                    posY : dataClients[1].posY-500,
                    nickname: nickname2
                }
                process.send({id:id,nick:nickname2,event:"rivalPosition",data:tmp});
            }
            else{
                tmp = {
                    posX : dataClients[0].posX,
                    posY : dataClients[0].posY-500,
                    nickname: nickname2
                }
                process.send({id:id,nick:nickname1,event:"rivalPosition",data:tmp});
            }
            break;
        }
        case "puckInitialize": {
            
            break;
        }
        case "puckPosition": {
            // FARE QUI LA SPECULARITA'
            var name = (data.nick==nickname1)?nickname2:nickname1;
            //console.log("MANDO 111!");

            //console.log("PUCK RICEVUTO: ",data[0],",",data[1]);

            var position = {
                posX : data.data[0],
                posY : data.data[1]
            };

            /* position.posX = data[0];
            position.posY = data[1]; */
            //console.log("VALORE PUCK: ",position);
           
            var risY;
            var risX;

            var diffY = posBaseY-position.posY;
            var diffX = posBaseX-position.posX;

            risY=posBaseY+diffY;
            risX=posBaseX+diffX;

            var tmp = position;
            tmp.posY=risY;
            tmp.posX=risX;

            //console.log("MANDO PUCK: ",tmp.posX,"---",tmp.posY);

           /*  if(data.nick==nickname1)    process.send({id:id,nick:nickname2,event:"moveRivalPosition",data:});
            else                        process.send({id:id,nick:nickname1,event:"moveRivalPosition",data:[tmp.posX,tmp.posY]});
  */
            process.send({id:id,nick:name,event:"puckPosition",data:[tmp.posX,tmp.posY]});






            //console.log("PUCK_POSITION!!!111|!!1!1!-///0",data,"\n\n");
            //puck = data.data.puck;
            /* console.log("SONO ",data.nick," con PUCK!->",
            data.data.angle,
            data.data.angularAcceleration,
            data.data.angularDrag,
            data.data.angularVelocity,
            data.data.bottom,
            data.data.center,
            data.data.embedded,
            data.data.left,
            data.data.newVelocity,
            data.data.position,
            data.data.prev,
            data.data.right,
            data.data.speed,
            data.data.transform,
            data.data.touching,
            data.data.velocity,
            data.data.wasTouching,
            ); */
            
            //}
            /* else{
                console.log("MANDO 222!");
                process.send({id:id,nick:nickname1,event:"puckPosition",
                data:[data.data.angle,
                    data.data.angularAcceleration,
                    data.data.angularDrag,
                    data.data.angularVelocity,
                    data.data.bottom,
                    data.data.center,
                    data.data.embedded,
                    data.data.left,
                    data.data.newVelocity,
                    data.data.position,
                    data.data.prev,
                    data.data.right,
                    data.data.speed,
                    data.data.transform,
                    data.data.touching,
                    data.data.velocity,
                    data.data.wasTouching]});
            } */
            break;
        }
        case "moveMyPosition": {

            var i = (data.nick==nickname1)?0:1;
            dataClients[i].posX = data.data.x;
            dataClients[i].posY = data.data.y;

            var risY;
            var risX;

            var diffY = posBaseY-dataClients[i].posY;
            var diffX = posBaseX-dataClients[i].posX;

            risY=posBaseY+diffY;
            risX=posBaseX+diffX;

            var tmp = dataClients[i];
            tmp.posY=risY;
            tmp.posX=risX;

            if(data.nick==nickname1)    process.send({id:id,nick:nickname2,event:"moveRivalPosition",data:[tmp.posX,tmp.posY]});
            else                        process.send({id:id,nick:nickname1,event:"moveRivalPosition",data:[tmp.posX,tmp.posY]});

            break;
        }
        case "goalSuffered": {

            var i = (data.nick==nickname1)?1:0;
            punteggioPartita[i]+=1;
            
            if(punteggioPartita[0] >= punteggioFinale || punteggioPartita[1] >= punteggioFinale){
                process.send({id:id,nick:nickname1,event:"finishGame"});
                process.send({id:id,nick:nickname2,event:"finishGame"});
                //  punteggioPartita[1] == nickname1
                //  punteggioPartita[0] == nickname2
                //      console.log("NICKNAME 1-",nickname1,punteggioPartita[1]);
                //      console.log("NICKNAME 2-",nickname2,punteggioPartita[0]);
                process.send({id:id,event:"updateDataDB",nick1:nickname1,nick2:nickname2,winner:punteggioPartita[1]>punteggioPartita[0]?nickname1:nickname2});
                
                
                
                console.log("F - CAZZO DI BUG!");
                delayTime();
            }

            // QUELLO CHE HA SUBITO (VANTAGGIO DI POSIZIONE)
            
            process.send({id:id,nick:nickname1,event:"refreshScoreGame",data: [nickname1, punteggioPartita[0]]});
            process.send({id:id,nick:nickname1,event:"refreshScoreGame",data: [nickname2, punteggioPartita[1]]});

            var name = (data.nick==nickname1)?nickname1:nickname2;
            //console.log("MANDO 111!");
            process.send({id:id,nick:name,event:"setPositionPuck",data:[400,650]});
            

            
            // QUELLO CHE HA SEGNATO
            process.send({id:id,nick:nickname2,event:"refreshScoreGame",data: [nickname1, punteggioPartita[0]]});
            process.send({id:id,nick:nickname2,event:"refreshScoreGame",data: [nickname2, punteggioPartita[1]]});
            
            var name = (data.nick==nickname1)?nickname2:nickname1;
            process.send({id:id,nick:name,event:"setPositionPuck",data:[400,250]});

            console.log("\t\tPUNTEGGIO: ",punteggioPartita);
            break;
        }
        

    }



});