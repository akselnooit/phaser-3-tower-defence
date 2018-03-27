// create a new scene named "Game"
let gameScene = new Phaser.Scene('Game');

// our game's configuration
let config = {
    type: Phaser.AUTO,  //Phaser will decide how to render our game (WebGL or Canvas)
    width: 1000, // game width
    height: 600, // game height
    scene: gameScene // our newly created scene
};

// create the game, and pass it the configuration
let game = new Phaser.Game(config);

// some parameters for our scene (our own customer variables - these are NOT part of the Phaser API)
gameScene.init = function() {
    this.playerSpeed = 5;
    this.enemySpeed = 2;
    this.towerX = 950;
    this.xOutsideMap = 1100;
    this.enemySpawnX = 10;
    this.lives = 100;
    this.spawnSpeed = 5000;
    this.spawnSpeedDecrement = 500;
};

// load asset files for our game
gameScene.preload = function() {

    // load images
    this.load.image('background', 'assets/bg.png');
    this.load.image('player', 'assets/player.png');
    this.load.image('dragon', 'assets/dragon.png');
    this.load.image('treasure', 'assets/treasure.png');
};

// executed once, after assets were loaded
gameScene.create = function() {
    let bg = this.add.sprite(0, 0, 'background');
    bg.setOrigin(0,0); // change origin to the top-left of the sprite

    // this.player = this.add.sprite(40, this.sys.game.config.height / 2, 'player');
    // this.player.setScale(0.5);
    // goal

    this.treasure = this.add.sprite(this.sys.game.config.width - 80, this.sys.game.config.height / 2, 'treasure');
    this.treasure.setScale(0.6);

    // group of enemies

    this.enemies = this.add.group({
        key: 'dragon',
        repeat: 2,
        setXY: {
            x: 0,
            y: 50,
            // stepX: 80,
            stepY: 200
        }
    });

    // if an enemy goes outside the map, we leave him invisible, so that we can use him later.
    this.enemiesToReuse = [];

    let thisScene = this;
    setTimeout(function () {
        spawnEnemy(thisScene);
    }, this.spawnSpeed);

    // scale enemies
    Phaser.Actions.ScaleXY(this.enemies.getChildren(), -0.5, -0.5);
    // set speeds
    Phaser.Actions.Call(this.enemies.getChildren(), function(enemy) {
        enemy.speed = Math.random() * this.enemySpeed + 1;
    }, this);

    // player is alive
    this.isPlayerAlive = true;
    document.getElementById('lives').innerHTML = this.lives + ' lives left';
};

// executed on every frame (60 times per second)
gameScene.update = function() {
    if (!this.isPlayerAlive) {
        return;
    }
    /*
    // check for active input
    if (this.input.activePointer.isDown) {
        // player walks
        this.player.x += this.playerSpeed;
        // player walks
    }
    // treasure collision
    if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), this.treasure.getBounds())) {
        this.gameOver();
    }
    */
    // enemy movement
    let enemies = this.enemies.getChildren();
    let numEnemies = enemies.length;
    for (let i = 0; i < numEnemies; i++) {
        if (enemies[i].speed > 0) {
            enemies[i].x += enemies[i].speed;
            if (enemies[i].x >= this.towerX ) {
                enemies[i].speed = 0;
                enemies[i].x = this.xOutsideMap;
                this.lives--;
            }
        }
    }
    document.getElementById("lives").innerHTML = this.lives + ' lives left';
};

// end the game
gameScene.gameOver = function() {
    // flag to set player is dead
    this.isPlayerAlive = false;
    // shake the camera
    this.cameras.main.shake(500);

    // fade camera
    this.time.delayedCall(250, function() {
        this.cameras.main.fade(250);
    }, [], this);

    // restart game
    this.time.delayedCall(500, function() {
        this.scene.manager.bootScene(this);
    }, [], this);

    // reset camera effects
    this.time.delayedCall(600, function() {
        this.cameras.main.resetFX();
    }, [], this);
};

function spawnEnemy(scene) {
    let newEnemy;
    if (scene.enemiesToReuse.length === 0) {
        newEnemy = scene.add.sprite(scene.enemySpawnX, Math.random() * 500 + 50, 'dragon');
        scene.enemies.add(newEnemy);
    } else {
        newEnemy = scene.enemiesToReuse.pop();
    }

    newEnemy.x = scene.enemySpawnX;
    newEnemy.y = Math.random() * 500 + 50;
    newEnemy.speed = Math.random() * scene.enemySpeed + 1;
    newEnemy.scaleX = newEnemy.scaleY = 0.5;

    scene.spawnSpeed -= scene.spawnSpeedDecrement;
    setTimeout(function () {
        spawnEnemy(scene);
    }, scene.spawnSpeed);
}