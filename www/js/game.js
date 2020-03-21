var app = {
    player : {
        nickname : null,
        posX : null,
        posY : null,
        score : 0,
        idPorta : null
    },
    rival : {
        nickname : null,
        posX : null,
        posY : null,
        score : 0
    },
    ball : {
        posX : null,
        posY : null,
        lastMovement : false
    },
    system : {
        textEndGame : null,
        textGol : null,
        finishGame : false,
        textScore : null,
        refreshScore : false,
        delayRespawn : 3000,
        stanza : null,
        continueGame : false,
        isWaiting : false,

    }
};
var socket = io('http://127.0.0.1:8081');
var puck;

function delayTime() {
    app.system.isWaiting = true;
    setTimeout(function myTime() {
        if(app.system.finishGame == true) {
            resocontoPartita("","ENDGame",app.player.nickname);
        }
        else{
            app.system.continueGame = true;
        }
    },app.system.delayRespawn);
}

function resetAction() {
    app.system.continueGame = false;
    app.system.isWaiting = false;
    app.ball.lastMovement = false;
}

var elementsCookie = document.cookie.split('; ');

for(var i=0;i<elementsCookie.length;i++){
    if(elementsCookie[i].substr(0,4)=="nick"){
        var tmp = elementsCookie[i].split('=');
        var tmp = tmp[1].split(';');
        app.player.nickname = tmp[0];
    }
    if(elementsCookie[i].substr(0,10)=="selectRoom"){
        var tmp = elementsCookie[i].split('=');
        var tmp = tmp[1].split(';');
        app.system.stanza = tmp[0];
    }
}

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

socket.emit("requestStartGame", { nickname:app.player.nickname, stanza:app.system.stanza });

socket.on("users_game", (data) =>{
    app.rival.nickname=data.rival;
});

socket.on("myPosition", (data) =>{
    app.player.posX = data.posX;
    app.player.posY = data.posY;
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
    app.ball.posX=data[0];
    app.ball.posY=data[1];
});

socket.on("puckPosition", (data) =>{
    app.ball.lastMovement=false;
    app.ball.posX=data[0];
    app.ball.posY=data[1];
});

socket.on("setIDPorta", (data) =>{
    app.player.idPorta = data.idPorta;
});

socket.on("refreshScoreGame", (data) =>{
    if(data[0] == app.player.nickname){
        app.player.score = data[1];
    }
    else{
        app.rival.score = data[1];
    }
    app.system.refreshScore = true;
});

socket.on("start_game", () => {    
    console.log("Inizia la partita! - Prelevo i dati necessarti per giocare...");
    socket.emit("rivalPosition",{nickname:app.player.nickname,nickname_rival:app.rival.nickname});
    inizio();
});

socket.on("finishGame", () =>{
    app.system.finishGame=true;
});

inizio = (data) => {
    var config = {
        type:Phaser.AUTO,
        width:800,
        height:900,
        parent: 'campo',
        physics: {
            default: 'arcade',
            arcade: {
                debug: true
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

    var strikerRival;
    var strikerPlayer;
    var porta1;
    var porta2;
    var border = [];
    var colorBorder = ['lineRed','lineRedSmall','lineGreen','lineGreenSmall','lineYellow','lineYellowSmall','lineBlue','lineBlueSmall'];
    var positionBorderX = [18,175,785,620,18, 180,785,620];
    var positionBorderY = [225,10,225,10,675, 890,675,890];

    // Funzione di caricamento delle immagini all'interno il gioco
    function preload() {
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

        this.load.image('strikerRival',"striker.png");
        this.load.image('strikerPlayer',"striker.png");
        this.load.image('puck',"puck.png");
    }

    function create(){  
        // Attraverso questo è possibile utilizzare il MultiTouch aggiungendo un puntatore (Poichè ne abbiamo uno di default)
        // this.input.addPointer();

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
        porta2 = this.physics.add.sprite(402,898,'porta');
        porta2.setImmovable();
        porta2.setVisible(false);

        app.system.textGol = this.add.text(290, 410, "Goal!", { font: '75px Courier', fill: '#000000' });
        app.system.textGol.setVisible(false);
        app.system.textEndGame = this.add.text(135, 410, "Finish game!", { font: '75px Courier', fill: '#000000' });
        app.system.textEndGame.setVisible(false);

        app.system.textScore = this.add.text(5, 498, (app.player.score+' - '+app.rival.score), { font: '32px Courier', fill: '#000000' });
        app.system.textScore.angle = -90;

        // Inizializzazione Striker1
        strikerRival = this.physics.add.sprite(app.rival.posX,app.rival.posY,'strikerRival').setInteractive({ draggable: true});
        strikerRival.body.setCircle(40);

        // Qui inizializziamo Striker2 e lo rendiamo trascinabile
        strikerPlayer = this.physics.add.sprite(app.player.posX,app.player.posY,'strikerPlayer').setInteractive({ draggable: true});
        strikerPlayer.body.setCircle(40);
        strikerPlayer.body.setBounce(1,1);

        // Tramite questa funzione è possibile trascinare lo striker con il cursore
        strikerPlayer.on('drag', function(pointer, dragX, dragY){

            if(dragY>490 && dragY<840 && dragX>75 && dragX<725){
                this.x = dragX;
                this.y = dragY;
                app.player.posX = dragX;
                app.player.posY = dragY;

                if(!app.system.finishGame){
                    socket.emit("moveMyPosition", {nickname:app.player.nickname, x:app.player.posX, y:app.player.posY});
                }

            }
        });
        strikerPlayer.setImmovable();

        puck = this.physics.add.sprite(app.ball.posX,app.ball.posY, 'puck');
        puck.body.setCircle(20);
        puck.body.setBounce(1,1);
        puck.body.collideWorldBounds = true;
        this.physics.add.collider(puck, border);

        graphics = this.add.graphics(0,0);
    }

    function update(){
        if(app.ball.lastMovement){
            socket.emit("puckPosition",{nickname:app.player.nickname,
                data:[puck.x, puck.y]
            });
            puck.setVelocity((puck.body.velocity.x) * 0.997, (puck.body.velocity.y) * 0.997);   // Decremento velocità di 3 millesimi a ciclo di update
        }
        else{
            puck.x=app.ball.posX;
            puck.y=app.ball.posY;
        }

        strikerRival.x = app.rival.posX;
        strikerRival.y = app.rival.posY;

        if(app.system.refreshScore){
            app.system.textScore.setVisible(false);
            app.system.textScore = this.add.text(5, 498, (app.player.score+' - '+app.rival.score), { font: '32px Courier', fill: '#000000' });
            app.system.textScore.angle = -90;
            app.system.refreshScore = false;
        }

        this.physics.world.collide(puck, strikerPlayer, (data) => {
            var diffX = 0;
            var diffY = 0;
            if (puck.x < strikerPlayer.x && puck.y < strikerPlayer.y)       // pallina in alto a sinistra
            {   console.log("111111111111");
                //  Ball is on the left-hand side of the paddle
                diffX = strikerPlayer.x - puck.x;
                diffY = strikerPlayer.y - puck.y;
                puck.setVelocity(-10 * diffX, -10 * diffY);
            }
            else if (puck.x > strikerPlayer.x && puck.y < strikerPlayer.y)  // pallina in alto a destra
            {console.log("222222222222");
                //  Ball is on the right-hand side of the paddle
                diffX = strikerPlayer.x -puck.x;
                diffY = strikerPlayer.y -puck.y;
                puck.setVelocity(-10 * diffX, -10 * diffY);
            }
            else if (puck.x < strikerPlayer.x && puck.y > strikerPlayer.y)  // pallina in basso a sinistra
            {   console.log("♥♥♥");
                diffX = strikerPlayer.x - puck.x;
                diffY = strikerPlayer.y - puck.y;
                puck.setVelocity(-10 * diffX, -10 * diffY);
            }
            else if (puck.x > strikerPlayer.x && puck.y > strikerPlayer.y)  // pallina in basso a destra
            {   console.log("♪♪♪♪♪♪♪♪♪♪♪♪♪")
                diffX = strikerPlayer.x -puck.x;
                diffY = strikerPlayer.y -puck.y;
                puck.setVelocity(-10 * diffX, -10 * diffY);
            }

            if(app.ball.lastMovement==false) {
                socket.emit("puckPosition", {nickname: app.player.nickname,
                    data:[puck.x, puck.y]
                });
                app.ball.lastMovement=true;
            }           
        });

        // Collisione puck con porta1
        this.physics.collide(puck, porta1, ()=>{
            app.ball.lastMovement=false;
            puck.destroy();
            app.system.textGol.setVisible(true);
            puck.setVisible(false);
            delayTime();
        });

        // Collisione puck con porta2
        this.physics.collide(puck, porta2, ()=> {
            app.ball.lastMovement=false;
            puck.destroy();
            app.system.textGol.setVisible(true);
            puck.setVisible(false);
            socket.emit("goalSuffered", {nickname:app.player.nickname});
            delayTime();
        });

        if(app.system.finishGame){
            app.system.textEndGame.setVisible(true);
        }

        if(app.system.continueGame && app.system.isWaiting) { 
            resetAction();
            app.system.textGol.setVisible(false);

            puck = this.physics.add.sprite(app.ball.posX,app.ball.posY,'puck');
            puck.body.setCircle(20);
            puck.body.setBounce(1,1);
            puck.body.collideWorldBounds = true;
            this.physics.add.collider(puck, strikerPlayer);     // TODO : Valutare se da eliminare
            this.physics.add.collider(puck, border);
        }
    }
}