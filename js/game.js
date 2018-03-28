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
    this.enemySpeed = 2;
    this.castleX = 950;
    this.xOutsideMap = 1100;
    this.enemySpawnX = 10;
    this.lives = 100;
    this.spawnSpeed = 5000;
    this.spawnSpeedDecrement = 500;
    this.towerRange = 100;
};

// load asset files for our game
gameScene.preload = function() {
    // load images
    this.load.image('background', 'assets/bg.png');
    this.load.image('player', 'assets/player.png');
    this.load.image('dragon', 'assets/dragon.png');
    this.load.image('treasure', 'assets/treasure.png');
    this.load.image('tower', 'assets/tower.png');
    this.load.image('range', 'assets/range.png');
};

// executed once, after assets were loaded
gameScene.create = function() {
    let thisScene = this;

    this.bg = this.add.sprite(0, 0, 'background').setInteractive();
    this.bg.setOrigin(0,0); // change origin to the top-left of the sprite

    this.towerToMove = null;
    this.towers = [];
    this.bg.on('pointerdown', function (pointer) {
        if (thisScene.towerToMove !== null) {
            thisScene.towerToMove.x = pointer.downX;
            thisScene.towerToMove.y = pointer.downY;
            thisScene.towerToMove.alpha = 1;
            thisScene.towerToMove = null;
        }
    });

    this.treasure = this.add.sprite(this.sys.game.config.width - 80, this.sys.game.config.height / 2, 'treasure');
    this.treasure.setScale(0.6);

    this.enemies = this.add.group({key: 'dragon', repeat: 2, setXY: {x: 0, y: 50, stepY: 200}});
    Phaser.Actions.ScaleXY(this.enemies.getChildren(), -0.5, -0.5);
    Phaser.Actions.Call(this.enemies.getChildren(), function(enemy) {
        enemy.speed = Math.random() * this.enemySpeed + 1;
    }, this);

    document.getElementById('lives').innerHTML = this.lives + ' lives left';

    // if an enemy goes outside the map, we leave him invisible, so that we can use him later.
    this.enemiesToReuse = [];
    setTimeout(function () {spawnEnemy(thisScene)}, this.spawnSpeed);
    spawnTower(this)
};

// executed on every frame (60 times per second)
gameScene.update = function() {
    let keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    if (keyA.isDown)
    {
        // new Phaser.Geom.Circle(300, 100, 64);
        // this.add.sprite(0, 0, 'background')
        spawnTower(this);
    }
    /*
    // treasure collision
    if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), this.treasure.getBounds())) {
        this.gameOver();
    }
    */
    // enemy movement
    let enemies = this.enemies.getChildren();
    for (let i = 0; i < enemies.length; i++) {
        if (enemies[i].speed > 0) {
            enemies[i].x += enemies[i].speed;
            if (enemies[i].x >= this.castleX ) {
                deactivateEnemy(enemies[i], this);
                this.lives--;
            }

            // check if any tower ranges the enemy
            for (let j = 0; j < this.towers.length; j++) {
                let towerRange = new Phaser.Geom.Circle(this.towers[j].x, this.towers[j].y, this.towerRange);
                if (Phaser.Geom.Intersects.CircleToRectangle(towerRange, enemies[i].getBounds()))
                {
                    deactivateEnemy(enemies[i], this);

                }
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


    if (scene.spawnSpeed > 200) {
        scene.spawnSpeed -= scene.spawnSpeedDecrement;
    }
    if (scene.spawnSpeed < 200) {
        scene.spawnSpeed = 200;
    }

    setTimeout(function () {
        spawnEnemy(scene);
    }, scene.spawnSpeed);
}

function spawnTower(scene) {
    let tower = scene.add.sprite(700, 400, 'tower').setInteractive();
    scene.towers.push(tower);

    tower.on('pointerdown', function (pointer) {
        if (scene.towerToMove !== null) {
            scene.towerToMove.alpha = 1;
        }
        scene.towerToMove = tower;
        tower.alpha = 0.5;
    });
}

function deactivateEnemy (enemy, scene) {
    enemy.speed = 0;
    enemy.x = scene.xOutsideMap;
    scene.enemiesToReuse.push(enemy);
}