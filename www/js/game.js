var app = {
    ball : {
        posX : null,
        posY : null,
        lastMovement : false
    },
    player : {
        nickname : null,
        posX : null,
        posY : null,
        idPorta : null,
        score : 0
    },
    rival : {
        nickname : null,
        posX : null,
        posY : null,
        score : 0
    },
    system : {
        fontPlayer: 15,
        textEndGame : null,
        textGol : null,
        textScore : null,
        stanza : null,
        delayFinishGame : 3000,
        finishGame : false,
        continueGame : false,
        refreshScore : false
    }
};
var socket = io.connect('http://localhost:8081');

// Oggetti grafici Phaser
var puck;
var graphips;
var strikerRival;
var strikerPlayer;
var border = [];
var colorBorder = ['borderLeft','borderTop','borderRight','borderBottom'];
var positionBorderX = [18,400,785,400];
var positionBorderY = [450,10,450,890];

function resetAction() {
    app.system.continueGame = false;
    app.ball.lastMovement = false;
}

function setCookie(nameParams, paramsValue) {
    var d = new Date();
    d.setTime(d.getTime() + (1*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = nameParams + "=" + paramsValue + ";" + expires + ";";
}

socket.emit('updateSocket', $.cookie('key')).on('updateSocket', function() {
    app.player.nickname = $.cookie('key');
    socket.emit('requestStartGame');
});

socket.on('redirect', function(destination) {
    var key = Object.keys(destination)[1];
    var value = Object.values(destination);
    if (key == 'key') {
        setCookie(key, value[1]);
    }
    else if (key == 'message') {
        setCookie(key, value[1]);
    }
    window.location.replace(value[0]);
});

socket.on('rivalData', (data) => {
    app.rival.nickname = data.nickname;
    app.rival.posX = data.position.posX;
    app.rival.posY = data.position.posY;
});

socket.on('myPosition', (data) => {
    app.player.posX = data[0];
    app.player.posY = data[1];
});

socket.on('moveRivalPosition', (data) => {
    app.rival.posX = data[0];
    app.rival.posY = data[1]; 
});

socket.on('setPositionPuck', (data) => {
    app.ball.posX=data[0];
    app.ball.posY=data[1];
});

socket.on('continueGame', () => {
    app.system.continueGame = true;
});

socket.on('puckPosition', (data) => {
    app.ball.lastMovement=false;
    app.ball.posX=data[0];
    app.ball.posY=data[1];
});

socket.on('refreshScoreGame', (data) => {
    app.player.score = data.scorePlayer;
    app.rival.score = data.scoreRival;
    app.system.refreshScore = true;
});

socket.on('launchGame', () => {    
    console.log('Inizia la partita!');
    begin();
});

socket.on('finishGame', () => {
    app.system.finishGame = true;
});

function begin() {
    var config = {
        type:Phaser.AUTO,
        width:800,
        height:900,
        parent: 'campo',
        dom: {
            createContainer: true
        },
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
    new Phaser.Game(config);

    // Funzione di caricamento delle immagini all'interno il gioco
    function preload() {
        this.load.image('background', "/www/img/Sfondo_.png");
        this.load.image('borderLeft', "/www/img/borderLeft.png");
        this.load.image('borderTop', "/www/img/borderTop.png");
        this.load.image('borderRight', "/www/img/borderRight.png");
        this.load.image('borderBottom', "/www/img/borderBottom.png");

        this.load.image('strikerRival',"/www/img/striker.png");
        this.load.image('strikerPlayer',"/www/img/striker.png");
        this.load.image('puck',"/www/img/puck.png");
    }

    function create(){  
        // Settiamo lo sfondo del gioco
        this.image = this.add.image(400,450,'background');

        // Creazione dei bordi
        for(var i=0;i<4;i++){
            border[i] = this.physics.add.sprite(positionBorderX[i],positionBorderY[i],colorBorder[i]);

            border[i].setDataEnabled();
            border[i].name = colorBorder[i];
            border[i].data.set('number',i);
            border[i].setImmovable();
        }

        app.system.textGol = this.add.text(290, 410, "Goal!", { font: '75px Courier', fill: '#000000' });
        app.system.textGol.setVisible(false);
        app.system.textEndGame = this.add.text(135, 410, "Finish game!", { font: '75px Courier', fill: '#000000' });
        app.system.textEndGame.setVisible(false);

        app.system.textScore = this.add.text(5, 498, (app.player.score+' - '+app.rival.score), { font: '32px Courier', fill: '#000000' });
        app.system.textScore.angle = -90;

        // Inizializzazione Striker1
        strikerRival = this.physics.add.sprite(app.rival.posX, app.rival.posY,'strikerRival');
        strikerRival.body.setCircle(40);

        // Qui inizializziamo Striker2 e lo rendiamo trascinabile
        strikerPlayer = this.physics.add.sprite(app.player.posX, app.player.posY, 'strikerPlayer').setInteractive({ draggable: true});
        strikerPlayer.body.setCircle(40);
        strikerPlayer.body.setBounce(1,1);

        var div = document.createElement('div');
        div.style = `background-color: rgb(253, 175, 31); border-radius: 15px; height: 30px; padding: 0.5% 1%; font: ${app.system.fontPlayer}px Comic Sans MS; color: white; text-transform: uppercase`;
        div.innerText = app.rival.nickname;

        strikerRival.label = this.add.dom(app.rival.posX, app.rival.posY, div);

        // Tramite questa funzione è possibile trascinare lo striker con il cursore
        strikerPlayer.on('drag', function(pointer, dragX, dragY){

            if(dragY>490 && dragY<840 && dragX>75 && dragX<725){
                this.x = dragX;
                this.y = dragY;
                app.player.posX = dragX;
                app.player.posY = dragY;

                if(!app.system.finishGame){
                    socket.emit('moveMyPosition', {data: [app.player.posX, app.player.posY]});
                }
            }
        });
        strikerPlayer.setImmovable();

        puck = this.physics.add.sprite(app.ball.posX,app.ball.posY, 'puck');
        puck.body.setCircle(20);
        puck.body.setBounce(1,1);
        puck.body.collideWorldBounds = true;
        this.physics.add.collider(puck, border);
        this.physics.add.collider(puck, strikerPlayer);

        graphics = this.add.graphics(0,0);
    }

    function goal(puck) {
        app.ball.lastMovement=false;
        puck.destroy();
        app.system.textGol.setVisible(true);
    }

    function update(){
        if(app.ball.lastMovement) {
            socket.emit('puckPosition', {data: [puck.x, puck.y]});
            puck.setVelocity((puck.body.velocity.x) * 0.997, (puck.body.velocity.y) * 0.997);   // Decremento velocità di 3 millesimi a ciclo di update
        }
        else{
            puck.x=app.ball.posX;
            puck.y=app.ball.posY;
        }

        strikerRival.x = app.rival.posX;
        strikerRival.y = app.rival.posY;
        strikerRival.label.x = app.rival.posX;
        strikerRival.label.y = Math.floor(app.rival.posY - 60);

        if(app.system.refreshScore){
            app.system.textScore.setVisible(false);
            app.system.textScore = this.add.text(5, 498, (app.player.score+' - '+app.rival.score), { font: '32px Courier', fill: '#000000' });
            app.system.textScore.angle = -90;
            app.system.refreshScore = false;
        }

        this.physics.world.collide(puck, strikerPlayer, (data) => {
            var diffX = 0;
            var diffY = 0;
            if (puck.x < strikerPlayer.x && puck.y < strikerPlayer.y) {      // pallina in alto a sinistra
                diffX = strikerPlayer.x - puck.x;
                diffY = strikerPlayer.y - puck.y;
                puck.setVelocity(-10 * diffX, -10 * diffY);
            }
            else if (puck.x > strikerPlayer.x && puck.y < strikerPlayer.y) { // pallina in alto a destra
                diffX = strikerPlayer.x -puck.x;
                diffY = strikerPlayer.y -puck.y;
                puck.setVelocity(-10 * diffX, -10 * diffY);
            }
            else if (puck.x < strikerPlayer.x && puck.y > strikerPlayer.y) { // pallina in basso a sinistra
                diffX = strikerPlayer.x - puck.x;
                diffY = strikerPlayer.y - puck.y;
                puck.setVelocity(-10 * diffX, -10 * diffY);
            }
            else if (puck.x > strikerPlayer.x && puck.y > strikerPlayer.y) { // pallina in basso a destra
                diffX = strikerPlayer.x -puck.x;
                diffY = strikerPlayer.y -puck.y;
                puck.setVelocity(-10 * diffX, -10 * diffY);
            }

            if(app.ball.lastMovement==false) {
                socket.emit('puckPosition', {data: [puck.x, puck.y]});
                app.ball.lastMovement=true;
            }
        });

        // Zona porta del rivale
        if(puck.x >346 && puck.x<455 && puck.y>0 && puck.y<45) {
            goal(puck);
        }

        // Zona porta del player
        if(puck.x >346 && puck.x<455 && puck.y>855 && puck.y<900) {
            goal(puck);
            socket.emit('goalSuffered');
        }

        if(app.system.finishGame) {
            app.system.textGol.setVisible(false);
            app.system.textEndGame.setVisible(true);
        }

        if(app.system.continueGame) { 
            resetAction();
            app.system.textGol.setVisible(false);

            puck = this.physics.add.sprite(app.ball.posX,app.ball.posY,'puck');
            puck.body.setCircle(20);
            puck.body.setBounce(1,1);
            puck.body.collideWorldBounds = true;
            this.physics.add.collider(puck, border);
            this.physics.add.collider(puck, strikerPlayer);
        }
    }
}