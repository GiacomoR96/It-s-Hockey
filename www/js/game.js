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
        defaultWidth: 800,
        defaultHeight: 900,
        fieldX: field.x,
        fieldY: field.y,
        fontPlayer: 15,
        textEndGame : null,
        textGol : null,
        textScore : null,
        stanza : null,
        delayFinishGame : 3000,
        finishGame : false,
        continueGame : false,
        refreshScore : false,
        goal: false,
        exitButton: null,
        sendMessageQuit: false
    }
};
var socket = io.connect('http://localhost:8080');

// Oggetti grafici Phaser
var puck;
var graphips;
var strikerRival;
var strikerPlayer;
var border = [];
var colorBorder = ['borderLeft','borderTop','borderRight','borderBottom'];
var positionBorderX = [18,400,785,400];
var positionBorderY = [450,10,450,890];

function exitPlayer() {
    socket.emit('exitPlayer');
}

function resetAction() {
    app.system.goal = false;
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
    app.system.sendMessageQuit = false;
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
    app.rival.posX = proportionsX(data.position[0]);
    app.rival.posY = proportionsY(data.position[1]);
});

socket.on('myPosition', (data) => {
    app.player.posX = proportionsX(data[0]);
    app.player.posY = proportionsY(data[1]);
});

socket.on('moveRivalPosition', (data) => {
    app.rival.posX = proportionsX(data[0]);
    app.rival.posY = proportionsY(data[1]);
});

socket.on('setPuckPosition', (data) => {
    app.ball.posX = proportionsX(data[0]);
    app.ball.posY = proportionsY(data[1]);
});

socket.on('continueGame', () => {
    app.system.continueGame = true;
});

socket.on('puckPosition', (data) => {
    app.ball.lastMovement=false;
    app.ball.posX = proportionsX(data[0]);
    app.ball.posY = proportionsY(data[1]);
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

window.addEventListener('beforeunload', function (e) {
    if(app.system.sendMessageQuit){
        socket.emit('quitPlayer');
    }
    return ''; 
});

socket.on('finishGame', () => {
    app.system.finishGame = true;
});

function proportionsX(value) {
    return (value*app.system.fieldX) / app.system.defaultWidth; 
}

function proportionsY(value) {
    return (value*app.system.fieldY) / app.system.defaultHeight; 
}

function proportionsReverse(valueX, valueY) {
    var resultX = (app.system.defaultWidth*valueX) / app.system.fieldX;
    var resultY = (app.system.defaultHeight*valueY) / app.system.fieldY;
    return [resultX, resultY];
}

function percentX(value) {
    var result = (value*100) / app.system.defaultWidth;
    if(result == 100) {
        return '1.0';
    }
    return `.${parseInt(result)}`;
}

function percentY(value) {
    var result = (value*100) / app.system.defaultHeight;
    if(result == 100) {
        return '1.0';
    }
    return `.${parseInt(result)}`;
}

function begin() {
    var config = {
        type: Phaser.AUTO,
        width: app.system.fieldX,
        height: app.system.fieldY,
        parent: 'field',
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

    function create() {
        // Settiamo lo sfondo del gioco
        this.image = this.add.image(app.system.fieldX * 0.5, app.system.fieldY * 0.5,'background');
        this.image.scaleX = percentX(app.system.fieldX);
        this.image.scaleY = percentY(app.system.fieldY);

        // Creazione dei bordi
        for(var i=0; i<4; i++) {
            border[i] = this.physics.add.sprite(proportionsX(positionBorderX[i]), proportionsY(positionBorderY[i]), colorBorder[i]);
            border[i].scaleX = percentX(app.system.fieldX);
            border[i].scaleY = percentY(app.system.fieldY);

            border[i].setDataEnabled();
            border[i].name = colorBorder[i];
            border[i].data.set('number',i);
            border[i].setImmovable();
        }

        app.system.textGol = this.add.text(proportionsX(290), proportionsY(410), 'Goal!', { font: `${proportionsX(75)}px Courier`, fill: '#000000' });
        app.system.textGol.setVisible(false);
        app.system.textEndGame = this.add.text(proportionsX(135), proportionsY(410), 'Fine partita!', { font: `${proportionsX(75)}px Courier`, fill: '#000000' });
        app.system.textEndGame.setVisible(false);

        app.system.textScore = this.add.text(proportionsX(5), proportionsY(498), (app.player.score+' - '+app.rival.score), { font: `${proportionsX(32)}px Courier`, fill: '#000000' });
        app.system.textScore.angle = -90;

        var button = document.createElement('button')
        button.style = `background-color: white; border-radius: 15px; outline:none; width: ${proportionsX(25)}px; padding: 0.5%; text-align: center; font: ${proportionsY(13)}px Comic Sans MS; color: black; text-transform: uppercase; word-wrap: break-word`;
        button.innerText = 'ABBANDONA';
        button.onclick = () => exitPlayer();
        app.system.exitButton = this.add.dom(proportionsX(782), proportionsY(450), button)

        // Inizializzazione Striker1
        strikerRival = this.physics.add.sprite(app.rival.posX, app.rival.posY,'strikerRival');
        strikerRival.scaleX = percentX(app.system.fieldX);
        strikerRival.scaleY = percentY(app.system.fieldY);
        strikerRival.body.setCircle(40);

        var div = document.createElement('div');
        div.style = `background-color: rgb(253, 175, 31); border-radius: 15px; height: ${proportionsY(30)}px; padding: 0.5% 1%; font: ${proportionsY(app.system.fontPlayer)}px Comic Sans MS; color: white; text-transform: uppercase`;
        div.innerText = app.rival.nickname;
        strikerRival.label = this.add.dom(app.rival.posX, Math.floor(app.rival.posY - proportionsY(60)), div);

        // Qui inizializziamo Striker2 e lo rendiamo trascinabile
        strikerPlayer = this.physics.add.sprite(app.player.posX, app.player.posY, 'strikerPlayer').setInteractive({ draggable: true});
        strikerPlayer.scaleX = percentX(app.system.fieldX);
        strikerPlayer.scaleY = percentY(app.system.fieldY);
        strikerPlayer.body.setCircle(40);
        strikerPlayer.body.setBounce(1,1);

        // Tramite questa funzione è possibile trascinare lo striker con il cursore
        strikerPlayer.on('drag', function(pointer, dragX, dragY) {

            if(dragY> proportionsY(490) && dragY< proportionsY(840) && dragX> proportionsX(75) && dragX< proportionsX(725)) {
                this.x = dragX;
                this.y = dragY;
                app.player.posX = dragX;
                app.player.posY = dragY;

                if(!app.system.finishGame) {
                    socket.emit('moveMyPosition', {data: proportionsReverse(app.player.posX, app.player.posY)});
                }
            }
        });
        strikerPlayer.setImmovable();

        puck = this.physics.add.sprite(app.ball.posX,app.ball.posY, 'puck');
        puck.scaleX = percentX(app.system.fieldX);
        puck.scaleY = percentY(app.system.fieldY);
        puck.body.setCircle(20);
        puck.body.setBounce(1,1);
        puck.body.collideWorldBounds = true;
        this.physics.add.collider(puck, border);
        this.physics.add.collider(puck, strikerPlayer);

        graphics = this.add.graphics(0,0);
        app.system.sendMessageQuit = true;
    }

    function goal() {
        app.ball.lastMovement=false;
        app.system.goal = true;
        puck.setVisible(false);
        app.system.textGol.setVisible(true);
    }

    function update() {
        if(app.ball.lastMovement && !app.system.goal) {
            socket.emit('puckPosition', {data: proportionsReverse(puck.x, puck.y)});
            puck.setVelocity((puck.body.velocity.x) * 0.997, (puck.body.velocity.y) * 0.997);   // Decremento velocità di 3 millesimi a ciclo di update
        }
        else{
            puck.x=app.ball.posX;
            puck.y=app.ball.posY;
        }

        strikerRival.x = app.rival.posX;
        strikerRival.y = app.rival.posY;
        strikerRival.label.x = app.rival.posX;
        strikerRival.label.y = Math.floor(app.rival.posY - proportionsY(60));

        if(app.system.refreshScore) {
            app.system.textScore.setVisible(false);
            app.system.textScore = this.add.text(proportionsX(5), proportionsY(498), (app.player.score+' - '+app.rival.score), { font: `${proportionsX(32)}px Courier`, fill: '#000000' });
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
                socket.emit('puckPosition', {data: proportionsReverse(puck.x, puck.y)});
                app.ball.lastMovement=true;
            }
        });

        // Zona porta del rivale
        if(!app.system.goal && puck.x > proportionsX(346) && puck.x < proportionsX(455) && puck.y > 0 && puck.y < proportionsY(45)) {
            goal(puck);
        }

        // Zona porta del player
        if(!app.system.goal && puck.x > proportionsX(346) && puck.x < proportionsX(455) && puck.y > proportionsY(855) && puck.y < proportionsY(app.system.defaultHeight)) {
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

            puck.x = app.ball.posX;
            puck.y = app.ball.posY;
            puck.setVisible(true);
        }
    }
}