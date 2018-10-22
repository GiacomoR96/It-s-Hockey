// Client copia per effettuare la login

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
app.nickname = prompt("Inserisci il nickname");
app.nickname = "1";
var socket = io('http://localhost:8080'); 

if(!app.nickname) window.location.reload();
console.log("Nome utente: ",app.nickname);

socket.emit("login", {nickname:app.nickname});

socket.on("users_game", (data) =>{
    for(var i=0;i<data.users.length;i++){
        if(app.nickname!=data.users[i]){
            app.rival.nickname=data.users[i];
        }
    }
});

socket.on("myPosition", (data) =>{
    app.posX = data.posX;
    app.posY = data.posY;        
    console.log("DATI myPosition posX:",app.posX," posY:",app.posY);
});

socket.on("rivalPosition", (data) =>{
    app.rival.posX = data.posX;
    app.rival.posY = data.posY;
    console.log("DATI rivalPosition posX:",app.rival.posX," posY:",app.rival.posY);
});

socket.on("moveRivalPosition", (data) =>{
    app.rival.posX = data.posX;
    app.rival.posY = data.posY;
});

socket.on("puckPosition", (data) =>{
    puck = data.puck;                 //       SCRIVI....MANGIA.....BEVI!  
    console.log("DATI_PUCK  puck:",puck);
});

socket.on("setIDPorta", (data) =>{
    app.idPorta = data.idPorta;
    console.log("idPorta:",app.idPorta);
});

socket.on("refreshScoreGame", (data) =>{
    if(data.nickname == app.nickname){
        app.score = data.score;
        console.log("PUNTEGGIO di: ",app.nickname,", totale: ",app.score);
    }
    else{
        app.rival.score = data.score;
        console.log("PUNTEGGIO di: ",app.rival.nickname,", totale: ",app.rival.score);
    }
    app.bool = true;
});

socket.on("positionBall", (data) =>{
    app.posBallX = data.x;
    app.posBallY = data.y;
    app.boolBall = true;
});

socket.on("start_game", (data) => {
    app.start=data.start;
    
    console.log("Inizia la partita! - Prelevo i dati necessarti per giocare...");
    socket.emit("myPosition",{nickname:app.nickname});
    socket.emit("rivalPosition",{nickname:app.nickname,nickname_rival:app.rival.nickname});
   
    inizio();
});

socket.on("finishGame", () =>{
//    textEndGame.setVisible(true);
});

//socket.emit("disconnection", {nickname:app.nickname});

if(!app.start){
    console.log("Attendi l'avversario...");
}

inizio = (data) =>{
var config = {
    type:Phaser.AUTO,
    width:800,
    height:900,
    physics: {
        default: 'arcade',
        arcade: {
        //    debug: true
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
var colorBorder = ['line - red','line - red - small','line - green','line - green - small','line - yellow','line - yellow - small','line - blue','line - blue - small'];
var positionBorderX = [18,175,785,620,18, 180,785,620];
var positionBorderY = [225,10,225,10,675, 890,675,890];

function preload(){
    this.load.image('background', "assets/img/sfondo_.png");

    this.load.image('line - red', "assets/img/line - red.png");
    this.load.image('line - red - small', "assets/img/line - red - small.png");

    this.load.image('line - green', "assets/img/line - green.png");
    this.load.image('line - green - small', "assets/img/line - green - small.png");
    
    this.load.image('line - yellow', "assets/img/line - yellow.png");
    this.load.image('line - yellow - small', "assets/img/line - yellow - small.png");
    
    this.load.image('line - blue', "assets/img/line - blue.png");
    this.load.image('line - blue - small', "assets/img/line - blue - small.png");
    
    this.load.image('line - cyan', "assets/img/line - cyan.png");
    this.load.image('line - cyan - small', "assets/img/line - cyan - small.png");
    
    this.load.image('porta',"assets/img/porta.png");

    this.load.image('striker1','assets/img/striker.png');
    this.load.image('striker2','assets/img/striker.png');
    this.load.image('puck','assets/img/puck.png');
}

function create(){
 /*    
    // Attraverso questo è possibile utilizzare il MultiTouch aggiungendo un puntatore (Poichè ne abbiamo uno di default)
    this.input.addPointer();
 */
    // Settiamo lo sfondo del gioco
    this.image = this.add.image(400,450,'background');

   
    //Metodo per la creazione dei bordi
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

/*
    if(app.idPorta==0){
        porta1.name = app.nickname;
        console.log(app.nickname,",",porta1.idPorta);
    }
    else{
        porta2.name = app.nickname;
        console.log(app.nickname,",",porta2.idPorta);
    }
*/
    textScore = this.add.text(5, 498, (app.score+' - '+app.rival.score), { font: '32px Courier', fill: '#000000' });
    textScore.angle = -90;

    striker1 = this.physics.add.sprite(app.rival.posX,app.rival.posY,'striker1').setInteractive({ draggable: true});
    striker1.body.setCircle(40);
//    striker1.body.setBounce(1,1);

    // Qui inizializziamo i vari striker e li rendiamo trascinabili
    striker2 = this.physics.add.sprite(app.posX,app.posY,'striker2').setInteractive({ draggable: true});
    striker2.body.setCircle(40);
//    striker2.body.setBounce(1,1);

//   var style2 = {font: "25px Arial Black", color: "black", wordWrap:true, wordWrapWidth: striker2.width,  align: "center"};
    var style2 = {font: "25px Arial", fill: "#ff0044", wordWrap: { width: 300 }, wordWrapWidth: striker2.width, align: "center", backgroundColor: "#ffff00"  }
    nickname = this.add.text(50,50, app.nickname, style2);
   
    // Tramite questa funzione è possibile far spostare lo striker nella posizione del puntatore
    striker2.on('drag', function(pointer, dragX, dragY){
        
        if(dragY>490 && dragY<840 && dragX>75 && dragX<725){
            this.x = dragX;
            this.y = dragY;
            app.posX = dragX;
            app.posY = dragY;

            socket.emit("moveMyPosition", {nickname:app.nickname, x:app.posX, y:app.posY,nickname_rival:app.rival.nickname});
        }  
    });
    
    striker2.setImmovable();
    

    puck = this.physics.add.sprite(app.posBallX,app.posBallY, 'puck');
    puck.body.setCircle(20);
//    puck.body.setVelocity(100,200);
//    puck.body.setBounce(1,1);

    puck.body.collideWorldBounds = true;
        
    this.physics.add.collider(puck, [striker1,striker2]);
    this.physics.add.collider(puck, border);
    this.physics.add.collider([striker1,striker2], border);
 
    /* this.physics.add.overlap(puck, [porta1,porta2], ()=>{
        console.log("hit");
    }); */

    graphics = this.add.graphics(0,0);
}


function update(){
    
    striker1.x = app.rival.posX;
    striker1.y = app.rival.posY;
/*
    puck.x = app.posBallX;
    puck.y = app.posBallY;
*/
    nickname.x = striker2.x - 65;
    nickname.y = Math.floor(striker2.y + striker2.height / 2);
//    puck.body.acceleration = 0;
    
    if(app.bool){
        textGol.setVisible(true);
        textScore.setVisible(false);
        textScore = this.add.text(5, 498, (app.score+' - '+app.rival.score), { font: '32px Courier', fill: '#000000' });
        textScore.angle = -90;

/*
        var waitTill = new Date();
        //  new Date().getTime() +  new Date().getSeconds() * 2000
        console.log(waitTill);
        waitTill.setSeconds(waitTill.getSeconds()+2);
        while(waitTill > new Date()){
            textGol = this.add.text(290, 410, "Goal!", { font: '75px Courier', fill: '#000000' });
        
            console.log("Aspetto...");
        }

        if(waitTill < new Date){
            textGol.setVisible(false);
        } 

       //  setTimeout(() =>{
    //        textGol = this.add.text(290, 410, "Goal!", { font: '75px Courier', fill: '#000000' });
            
    //    },3000); 
*/
    //    textGol.setVisible(false);
        app.bool = false;
    }
    if(app.boolBall){
        puck.x = app.posBallX;
        puck.y = app.posBallY;
        app.boolBall = false;
    }


    this.physics.world.collide(puck, [striker1, striker2],(data)=>{
        console.log("Collision!");
    //    socket.emit("puckPosition",{puck:puck,nickname:app.nickname});
        puck.setVelocity(0, Phaser.Math.Between(100, 500));
        puck.setAngularDrag(90);
    })

    this.physics.collide(puck,porta2,()=>{
        console.log("Gol!");
        if(app.nickname == porta2.name){
            console.log("Gol subito sulla porta: ",porta2.name);
            socket.emit("goalSuffered",{nickname:app.nickname});
        }
    });


    this.physics.collide(puck,border,(data)=>{
        console.log("Collision!");
        puck.setVelocity(0, Phaser.Math.Between(100,500));
        puck.setAngularDrag(90); 
    //    socket.emit("puckPosition",{puck:puck,nickname:app.nickname});
 
 
 
    //    var i = border.data.get('number');
        

        /* Se vogliamo cambiare il colore del bordo dinamicamnte nel monento in cui il puck tocca uno dei bordi
            if(border.number == colorBorder[i]){
            if(i%2==0){
                border[i] = this.physics.add.sprite(positionBorderX[i],positionBorderY[i],'line - cyan');
            }
            else{
                border[i] = this.physics.add.sprite(positionBorderX[i],positionBorderY[i],'line - cyan - small');
            }
        }
        else{
            border[i] = this.physics.add.sprite(positionBorderX[i],positionBorderY[i],colorBorder[i]);
        } */
    });



}
}