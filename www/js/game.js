var app = {};
app.rival = {};
app.start = false;
app.posX;
app.posY;
app.rival.nickname;
app.rival.posX;
app.rival.posY;
app.rival.score = 0;
var puck;
var textScore;
var textGol;
var textEndGame;
app.idPorta;
app.score = 0;
app.bool = false;
app.boolBall = false;
app.posBallX;
app.posBallY;
app.nickname;
app.puck = {};
app.changePuck = false;
app.timer = 3000;
app.respawnPuck = false;
app.finishGame = false;
app.EnD = false;
app.stanza;
app.check = false;
app.velocity=0;
var socket = io('http://127.0.0.1:8081');

function delayTime(spawn){
    app.check=true;
    setTimeout(function myTime(){
        if(spawn == true){
            app.respawnPuck=true;
            
        }
        else{
            resocontoPartita("","ENDGame",app.nickname);
        }
    },app.timer);
}

var elementsCookie = document.cookie.split('; ');

for(var i=0;i<elementsCookie.length;i++){
    if(elementsCookie[i].substr(0,4)=="nick"){
        var tmp = elementsCookie[i].split('=');
        var tmp = tmp[1].split(';');
        app.nickname = tmp[0];
    }
    if(elementsCookie[i].substr(0,10)=="selectRoom"){
        var tmp = elementsCookie[i].split('=');
        var tmp = tmp[1].split(';');
        app.stanza = tmp[0];
    }
}
console.log("QUESTA è LA STANZA-> ",app.stanza);

function resocontoPartita(path, nameURL, param,method){
    method = "post";
    
    var form = document.createElement("form");
    form.setAttribute("method", method);

    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", nameURL);

    form.appendChild(hiddenField);

    var hiddenField2 = document.createElement("input");
    hiddenField2.setAttribute("type", "hidden");
    hiddenField2.setAttribute("name", param);

    form.appendChild(hiddenField2);


    document.body.appendChild(form);
    form.submit();
}


socket.emit("requestStartGame", {nickname:app.nickname,stanza:app.stanza});

socket.on("users_game", (data) =>{
    app.rival.nickname=data.rival;
});

socket.on("myPosition", (data) =>{
    app.posX = data.posX;
    app.posY = data.posY;
});

socket.on("rivalPosition", (data) =>{
    app.rival.posX = data.posX;
    app.rival.posY = data.posY;
});

socket.on("moveRivalPosition", (data) =>{
    app.rival.posX = data[0];
    app.rival.posY = data[1]; 
});

socket.on("setPositionPuck", (data) =>{
    app.posBallX=data[0];
    app.posBallY=data[1];
});

socket.on("puckPosition", (data) =>{
    app.changePuck=false;
    app.posBallX=data[0];
    app.posBallY=data[1];
});

socket.on("setIDPorta", (data) =>{
    app.idPorta = data.idPorta;
});

socket.on("refreshScoreGame", (data) =>{
    if(data[0] == app.nickname){
        app.score = data[1];
    }
    else{
        app.rival.score = data[1];
    }
    app.bool = true;
});

socket.on("positionBall", (data) =>{
    app.posBallX = data[0];
    app.posBallY = data[1]; 
    
    app.boolBall = true;
});

socket.on("start_game", (data) => {
    app.start=data.start;
    
    console.log("Inizia la partita! - Prelevo i dati necessarti per giocare...");
    socket.emit("rivalPosition",{nickname:app.nickname,nickname_rival:app.rival.nickname});
   
    inizio();
});

socket.on("finishGame", () =>{
    app.finishGame=true;
    app.EnD=true;
});

//socket.emit("disconnection", {nickname:app.nickname});

if(!app.start){
    //console.log("Attendi l'avversario...");
}

inizio = (data) =>{
    
var config = {
     type:Phaser.AUTO,
    width:800,
    height:900,
    parent: 'campo',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        },
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
}

var graphips;
var game = new Phaser.Game(config);

var striker1;
var striker2;

// Da togliere in futuro
var nickname;

var porta1;
var porta2;

var border = [];
var colorBorder = ['lineRed','lineRedSmall','lineGreen','lineGreenSmall','lineYellow','lineYellowSmall','lineBlue','lineBlueSmall'];
var positionBorderX = [18,175,785,620,18, 180,785,620];
var positionBorderY = [225,10,225,10,675, 890,675,890];

// Funzione di caricamento delle immagini all'interno il gioco
function preload(){
    this.load.image('background', "Sfondo_.png");

    this.load.image('lineRed', "lineRed.png");
    this.load.image('lineRedSmall', "lineRedsmall.png");

    this.load.image('lineGreen', "lineGreen.png");
    this.load.image('lineGreenSmall', "lineGreenSmall.png");
    
    this.load.image('lineYellow', "lineYellow.png");
    this.load.image('lineYellowSmall', "lineYellowSmall.png");
    
    this.load.image('lineBlue', "lineBlue.png");
    this.load.image('lineBlueSmall', "lineBlueSmall.png");
    
    this.load.image('lineCyan', "lineCyan.png");
    this.load.image('lineCyanSmall', "lineCyanSmall.png");
    
    this.load.image('porta',"porta.png");

    this.load.image('striker1',"striker.png");
    this.load.image('striker2',"striker.png");
    this.load.image('puck',"puck.png");
}

function create(){
 /*    
    // Attraverso questo è possibile utilizzare il MultiTouch aggiungendo un puntatore (Poichè ne abbiamo uno di default)
    this.input.addPointer();
 */
    // Settiamo lo sfondo del gioco
    this.image = this.add.image(400,450,'background');

   
    // Creazione dei bordi
    for(var i=0;i<8;i++){
        border[i] = this.physics.add.sprite(positionBorderX[i],positionBorderY[i],colorBorder[i]);
       
       
        border[i].setDataEnabled();
        border[i].name = colorBorder[i];
        border[i].data.set('number',i);
        border[i].setImmovable();
    }

    porta1 = this.physics.add.sprite(402,3,'porta');
    porta1.setImmovable();
    porta1.setVisible(false);
    porta1.name = app.rival.nickname;
    porta2 = this.physics.add.sprite(402,898,'porta');
    porta2.setImmovable();
    porta2.setVisible(false);
    porta2.name = app.nickname;


    textGol = this.add.text(290, 410, "Goal!", { font: '75px Courier', fill: '#000000' });
    textGol.setVisible(false);
    textEndGame = this.add.text(135, 410, "Finish game!", { font: '75px Courier', fill: '#000000' });
    textEndGame.setVisible(false);

    textScore = this.add.text(5, 498, (app.score+' - '+app.rival.score), { font: '32px Courier', fill: '#000000' });
    textScore.angle = -90;

    // Inizializzazione Striker1
    striker1 = this.physics.add.sprite(app.rival.posX,app.rival.posY,'striker1').setInteractive({ draggable: true});
    striker1.body.setCircle(40);

    // Qui inizializziamo Striker2 e lo rendiamo trascinabile
    striker2 = this.physics.add.sprite(app.posX,app.posY,'striker2').setInteractive({ draggable: true});
    striker2.body.setCircle(40);

//   var style2 = {font: "25px Arial Black", color: "black", wordWrap:true, wordWrapWidth: striker2.width,  align: "center"};
    var style2 = {font: "25px Arial", fill: "#ff0044", wordWrap: { width: 300 }, wordWrapWidth: striker2.width, align: "center", backgroundColor: "#ffff00"  }
    nickname = this.add.text(50,50, app.nickname, style2);
   
    // Tramite questa funzione è possibile trascinare lo striker con il cursore
    striker2.on('drag', function(pointer, dragX, dragY){
        
        if(dragY>490 && dragY<840 && dragX>75 && dragX<725){
            this.x = dragX;
            this.y = dragY;
            app.posX = dragX;
            app.posY = dragY;
            //app.velocity++;
            if(!app.EnD){
                socket.emit("moveMyPosition", {nickname:app.nickname, x:app.posX, y:app.posY});
            }
        }  
    });
    striker2.setImmovable();
    
    
    puck = this.physics.add.sprite(app.posBallX,app.posBallY, 'puck');
    puck.body.setCircle(20);
//    puck.body.setVelocity(100,200);
    puck.body.setBounce(1,1);

    puck.body.collideWorldBounds = true;
        
    this.physics.add.collider(puck, striker2);
    this.physics.add.collider(puck, border);
    this.physics.add.collider([striker1,striker2], border);
    this.physics.add.collider(puck,[porta1,porta2]);

    graphics = this.add.graphics(0,0);
}


function update(){
    //app.velocity++;
    //console.log("--->",app.velocity);
    if(app.changePuck){
        socket.emit("puckPosition",{nickname:app.nickname,
            data:[puck.x, puck.y]
        });
    }
    else{
        puck.x=app.posBallX;
        puck.y=app.posBallY;
    }
    
    striker1.x = app.rival.posX;
    striker1.y = app.rival.posY;

    nickname.x = striker2.x - 65;
    nickname.y = Math.floor(striker2.y + striker2.height / 2);
    
    if(app.bool){
        textScore.setVisible(false);
        textScore = this.add.text(5, 498, (app.score+' - '+app.rival.score), { font: '32px Courier', fill: '#000000' });
        textScore.angle = -90;
        app.bool = false;
    }
    if(app.boolBall){
        puck.x = app.posBallX;
        puck.y = app.posBallY;
        app.boolBall = false;
    }

    // Collisione puck con striker2
    this.physics.world.collide(puck,striker2,(data)=>{
        console.log("Collision!");
        puck.setVelocity(0, Phaser.Math.Between(100, 500));
        //puck.setAngularDrag(90);
        console.log("COLPISCO PUCK->",puck);
        
        if(app.changePuck==false){
            socket.emit("puckPosition",{nickname:app.nickname,
                data:[puck.x, puck.y]
            });
            app.changePuck=true;
        }
    });

    // Collisione puck con porta1
    this.physics.collide(puck,porta1,()=>{
        app.changePuck=false;
        puck.destroy();
        textGol.setVisible(true);
        delayTime(true);
    });

    // Collisione puck con porta2
    this.physics.collide(puck,porta2,()=>{
        app.changePuck=false;
        puck.destroy();
        textGol.setVisible(true);
        if(app.nickname == porta2.name){
            socket.emit("goalSuffered",{nickname:app.nickname});
            delayTime(true);
        }
    });

    if(app.check){
        puck.setVisible(false);
    }

    // Respawn pallina dopo il goal
    if(app.respawnPuck && app.check){
        app.respawnPuck=false;
        app.check=false;
        textGol.setVisible(false);

        if(app.finishGame){
            textEndGame.setVisible(true);
            delayTime(false);
        }
        else{
            puck = this.physics.add.sprite(app.posBallX,app.posBallY,'puck');
            puck.body.setCircle(20);
        
            puck.body.collideWorldBounds = true;
                
            this.physics.add.collider(puck, striker2);
            this.physics.add.collider(puck, border);
            this.physics.add.collider([striker1,striker2], border);
            //textGol.setVisible(false);
        }

    }

    this.physics.collide(puck,border,(data)=>{
        console.log("Collision!");
        puck.setVelocity(0, Phaser.Math.Between(100,500));
        puck.setAngularDrag(120);
    });



}
}