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
    this.points = 0;
    this.spawnSpeed = 3000;
    this.spawnSpeedDecrement = 50;
    this.spawnSpeedMin = 400;
    this.towerRange = 80;
    this.maxTowerMoves = 3;
};

// load asset files for our game
gameScene.preload = function() {
    // load images
    this.load.image('background', 'assets/bg.png');
    this.load.image('dragon', 'assets/dragon.png');
    this.load.image('tower', 'assets/tower.png');
    this.load.image('range', 'assets/range.gif');
};

// executed once, after assets were loaded
gameScene.create = function() {
    let thisScene = this;

    this.bg = this.add.sprite(0, 0, 'background').setInteractive();
    this.bg.setOrigin(0,0); // change origin to the top-left of the sprite
    this.spawnText = this.add.text(50, 550, 'Click A to spawn a Tower');
    this.spawnTextWait = this.add.text(50, 550, 'You can spawn a Tower each 5 sec');

    this.towerToMove = null;
    this.towers = [];
    this.towerCanBeSpawned = true;

    this.bg.on('pointerdown', function (pointer) {
        if (thisScene.towerToMove !== null) {
            moveTower(thisScene.towerToMove, pointer.downX, pointer.downY, thisScene);
            thisScene.towerToMove.alpha = 1;
            thisScene.towerToMove = null;
        }
    });
    this.enemies = this.add.group({key: 'dragon', repeat: 2, setXY: {x: 0, y: 50, stepY: 200}});
    Phaser.Actions.ScaleXY(this.enemies.getChildren(), -0.5, -0.5);
    Phaser.Actions.Call(this.enemies.getChildren(), function(enemy) {
        enemy.speed = Math.random() * this.enemySpeed + 1;
    }, this);

    document.getElementById('lives').innerHTML = this.lives + ' lives left';

    // if an enemy goes outside the map, we leave him invisible, so that we can use him later.
    this.enemiesToReuse = [];
    setTimeout(function () {spawnEnemy(thisScene)}, this.spawnSpeed);
    spawnTower(this);
};

// executed on every frame (60 times per second)
gameScene.update = function() {
    this.spawnText.visible = this.towerCanBeSpawned;
    this.spawnTextWait.visible = !this.towerCanBeSpawned;

    let keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    if (keyA.isDown)
    {
        spawnTower(this);
    }
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
                    this.points++;
                }
            }
        }
    }
    document.getElementById("lives").innerHTML = this.lives + ' lives left';
    document.getElementById("points").innerHTML = this.points + ' points';
};

// end the game
gameScene.gameOver = function() {
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


    if (scene.spawnSpeed > scene.spawnSpeedMin) {
        scene.spawnSpeed -= scene.spawnSpeedDecrement;
    }
    if (scene.spawnSpeed < scene.spawnSpeedMin) {
        scene.spawnSpeed = scene.spawnSpeedMin;
    }

    setTimeout(function () {
        spawnEnemy(scene);
    }, scene.spawnSpeed);
}

function spawnTower(scene) {
    if (scene.towerCanBeSpawned) {
        let range = scene.add.sprite(700, 400, 'range');
        let tower = scene.add.sprite(700, 400, 'tower').setInteractive();
        tower.scaleX = tower.scaleY = 0.5;
        tower.movesLeft = scene.maxTowerMoves;
        tower.range = range;
        tower.range.alpha = 0;
        tower.range.scaleX = tower.range.scaleY = 0.6;
        scene.tweens.add({
            targets: tower.range,
            alpha: 0.6,
            duration: 2000,
            ease: 'Power0'
        });
        scene.towers.push(tower);

        tower.on('pointerdown', function (pointer) {
            if (tower.movesLeft > 0) {
                if (scene.towerToMove !== null) {
                    scene.towerToMove.alpha = 1;
                }
                scene.towerToMove = tower;
                tower.alpha = 0.5;
            }
        });

        scene.towerCanBeSpawned = false;
        setTimeout(function () {
            scene.towerCanBeSpawned = true;
        }, 5000);
    }
}

function deactivateEnemy (enemy, scene) {
    enemy.speed = 0;
    enemy.x = scene.xOutsideMap;
    scene.enemiesToReuse.push(enemy);
}

function moveTower (tower, x, y, scene) {
    if (x < 500)
        x = 500;
    tower.x = tower.range.x = x;
    tower.y = tower.range.y = y;
    tower.movesLeft--;
    tower.range.alpha = 0.1;
    if (tower.movesLeft > 0) {
        scene.tweens.add({
            targets: tower.range,
            alpha: 0.6,
            duration: 500,
            ease: 'Power0'
        });
    }
}