class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    preload() {
        this.load.scenePlugin('AnimatedTiles', './lib/AnimatedTiles.js', 'animatedTiles', 'animatedTiles');
    }

    init() {
        // PLAYER ---------------------
        this.ACCELERATION = 800;
        this.MAX_SPEED = 200;
        this.DRAG = 1600;
        this.physics.world.gravity.y = 1700;
        this.JUMP_VELOCITY = -400;
        this.PLAYER_SCALE = 1.35;
        this.COYOTE_TIME = 0.08;
        this.SPAWN_X = 85;
        this.SPAWN_Y = 550;
        this.RESPAWN_TIME = 0.4;

        // Objects ---------------------
        this.CRATE_DRAG = 1200;
        this.CRATE_MASS = 0.4;
        this.BUTTON_RADIUS = 35;
        this.BUTTON_PRESS_SECONDS = 1.0;

        // Camera ---------------------
        this.CAMERA_SCALE = 2.5;
        this.CAMERA_LERP_SPEED = 0.06;
        this.CAMERA_BOUND_X = 1700;
        this.CAMERA_BOUND_Y = 650;
    
        //Misc. ---------------------
        this.PARTICLE_VELOCITY = 30;
        this.PARTICLE_FREQUENCY = 0.1;
        this.AMBIENT_COLOR = 0x505050;

    }

    create() {
        this.lights.enable();
    
        this.lights.setAmbientColor(this.AMBIENT_COLOR);


        this.time.timeScale = 0.5;

        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 999 tiles wide and 999 tiles tall.
        this.map = this.add.tilemap("factory", 18, 18, 999, 999);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.factoryTileset = this.map.addTilesetImage("factory_tileset", "factory_tiles_packed");
        this.rockTileset = this.map.addTilesetImage("rock_tileset", "rock_tiles_packed");

        // Create a layer
        this.killLayer = this.map.createLayer("Kill", [this.factoryTileset, this.rockTileset], 288, 288);
        this.groundLayer = this.map.createLayer("Ground", [this.factoryTileset, this.rockTileset], 0, 0);
        this.decorLayer = this.map.createLayer("Decor", [this.factoryTileset, this.rockTileset], 0, 0);

        this.groundLayer.setPipeline('Light2D') 
        this.decorLayer.setPipeline('Light2D') 
        this.killLayer.setPipeline('Light2D') 
        
        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        this.killLayer.setCollisionByProperty({
            collides: true
        });

        // Create objects
        this.collectibles = this.map.createFromObjects("Collectibles", {
            name: "collectible",
            key: "wrench",
        });

        //this y bug is so dumb
        for (let collectible of this.collectibles) {
            collectible.y += 576;
            collectible.setPipeline('Light2D') 
        }

        this.crates = this.map.createFromObjects("Crates", {
            name: "crate",
            key: "crate",
        });

        for (let crate of this.crates) {
            crate.y += 576;
            crate.originalX = crate.x;
            crate.originalY = crate.y;
            crate.setPipeline('Light2D') 
        }

        this.buttons = this.map.createFromObjects("Buttons", {
            name: "button",
            key: "button_idle",
        });

        for (let button of this.buttons) {
            button.y += 576;
            button.pressedTimer = 0.0
            button.setPipeline('Light2D')
            button.light = this.lights.addLight(button.x, button.y, 75, 0x703030, 1);
        }


        // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.collectibles, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.crates, Phaser.Physics.Arcade.DYNAMIC_BODY);

        for (let crate of this.crates) {
            crate.body.setDragX(this.CRATE_DRAG);
            crate.body.mass = this.CRATE_MASS;
            crate.body.setBounce(0.0); 
        }


        // Create a Phaser group out of the array this.collectibles
        // This will be used for collision detection below.
        this.collectibleGroup = this.add.group(this.collectibles);
        this.crateGroup = this.add.group(this.crates);

        // set up player avatar
        this.player = this.physics.add.sprite(this.SPAWN_X, this.SPAWN_Y, "platformer_characters", "tile_0000.png");
        this.player.setCollideWorldBounds(false);
        this.player.scale = this.PLAYER_SCALE;
        this.player.body.setSize(15, 13, true); 
        this.player.body.setOffset(4.5, 10);

        this.player.setPipeline('Light2D') 

        this.playerLight = this.lights.addLight(200, 300, 100, 0x303050, 1);


        //random hitbox that is needed to make crates work because jumping on top of two crates is buggy and they phase through each other
        this.invisibleHitbox = this.physics.add.sprite(1374, 369, "crate");
        this.invisibleHitbox.alpha = 0;
        this.physics.world.enable(this.invisibleHitbox, Phaser.Physics.Arcade.STATIC_BODY);
        this.invisibleHitbox.body.setImmovable(true);

        // Enable collision handling
        this.physics.add.collider(this.player, this.groundLayer);
        this.physics.add.collider(this.crateGroup, this.groundLayer);
        this.physics.add.collider(this.player, this.crateGroup);
        this.physics.add.collider(this.crateGroup, this.crateGroup);
        this.physics.add.collider(this.invisibleHitbox, this.crateGroup);
        this.physics.add.collider(this.invisibleHitbox, this.groundLayer);

        this.killCollider = this.physics.add.collider(this.player, this.killLayer, (obj1, obj2) => {
            this.killCollider.active = false;
            this.playerFrozen = true;
            this.player.anims.play('dead', true);
            this.splashSound.play();

            this.deathVFX.x = this.player.x;
            this.deathVFX.y = this.player.y + this.player.displayHeight;
            this.deathVFX.explode()

            this.time.delayedCall(this.RESPAWN_TIME * 1000, () => {this.respawn_player();}, [], this);
        });

        this.collectiblesVFX = this.add.particles(50, 50, "white_star_particle");
        this.collectiblesVFX.setConfig({
            speed: { min: 50, max: 70},
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 350,
            frequency: 0,
            quantity: 4,
            blendMode: 'ADD'
        });
        this.collectiblesVFX.stop();

        // Handle collision detection with collectibles
        this.physics.add.overlap(this.player, this.collectibleGroup, (obj1, obj2) => {
            this.collectiblesVFX.x = obj2.x;
            this.collectiblesVFX.y = obj2.y;
            this.collectiblesVFX.explode()
            this.collectSound.play();
            obj2.destroy(); // remove collectible on overlap
        });
        
        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');
        this.eKey = this.input.keyboard.addKey('E');

        this.wKey = this.input.keyboard.addKey('W');
        this.aKey = this.input.keyboard.addKey('A');
        this.sKey = this.input.keyboard.addKey('S');
        this.dKey = this.input.keyboard.addKey('D');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-Q', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);
        this.physics.world.drawDebug = false;

        this.walkingVFX = this.add.particles(0, 0, "white_pixel_particle", {
            random: true,
            scale: {start: 0.03, end: 0.1},
            lifespan: 350,
            gravityY: 400,
            alpha: {start: 1, end: 0.1}, 
        });

        this.walkingVFX.stop();

        this.jumpVFX = this.add.particles(50, 50, "gray_pixel_particle");
        this.jumpVFX.setConfig({
            speed: { min: 50, max: 70},
            scale: { start: 0.15, end: 0 },
            alpha: { start: 1, end: 0 },
            angle: { min: 45, max: 135 },
            lifespan: 350,
            frequency: 0,
            quantity: 4,
            blendMode: 'ADD'
        });
        this.jumpVFX.stop();

        this.buttonVFX = this.add.particles(50, 50, "orange_pixel_particle");
        this.buttonVFX.setConfig({
            speed: { min: 50, max: 70},
            scale: { start: 0.15, end: 0 },
            alpha: { start: 1, end: 0 },
            angle: { min: 225, max: 315 },
            lifespan: 450,
            frequency: 0,
            quantity: 8,
            blendMode: 'ADD'
        });
        this.buttonVFX.setDepth(-1);
        this.buttonVFX.stop();


        this.deathVFX = this.add.particles(50, 50, "green_pixel_particle");
        this.deathVFX.setConfig({
            speed: { min: 150, max: 190},
            scale: { start: 0.25, end: 0 },
            angle: { min: 225, max: 315 },
            lifespan: 650,
            frequency: 0,
            quantity: 15,
            gravityY: 400,
        });
        this.deathVFX.setDepth(-1);
        this.deathVFX.stop();
        
        this.cameras.main.setBounds(0, 0, this.CAMERA_BOUND_X, this.CAMERA_BOUND_Y);
        this.cameras.main.startFollow(this.player, true, this.CAMERA_LERP_SPEED, this.CAMERA_LERP_SPEED);
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.CAMERA_SCALE);
        
        this.coyoteTimer = 0;
        this.playerFrozen = false;
        this.lastBlockedTime = 0;
        this.hasWon = false;

        this.background = this.add.tileSprite(0, 0, this.CAMERA_BOUND_X, this.CAMERA_BOUND_Y, "background").setOrigin(0, 0).setScrollFactor(0.5).depth = -2;

        this.input.on('pointerdown', (pointer) => {
            if (this.hasWon){
                this.footstep1Sound.stop();
                this.footstep2Sound.stop();
                this.footstep3Sound.stop();
                this.scene.restart();
            }
        });

        this.splashSound = this.sound.add("splash", {
            volume: 0.25
        });

        this.footstep1Sound = this.sound.add("footstep_1", {
            volume: 0.15,
            loop: true
        });
        this.footstep1Sound.stop();

        this.footstep2Sound = this.sound.add("footstep_2", {
            volume: 0.15,
            loop: true
        });
        this.footstep2Sound.stop();

        this.footstep3Sound = this.sound.add("footstep_3", {
            volume: 0.15,
            loop: true
        });
        this.footstep3Sound.stop();

        this.collectSound = this.sound.add("collect", {
            volume: 0.25
        });

        this.jumpSound = this.sound.add("jump", {
            volume: 0.25
        });

        this.winSound = this.sound.add("win", {
            volume: 0.25
        });

        // Always at the end of create
        //console.log(this.animatedTiles)
        //this.animatedTiles.init(this.map);
    }

    update(time, delta) {     
        this.coyoteTimer += delta / 1000;

        if(cursors.left.isDown || this.aKey.isDown && !this.playerFrozen) {
            this.player.setAccelerationX(-this.ACCELERATION);
            this.player.resetFlip();
            this.player.anims.play('walk', true);

            this.walkingVFX.startFollow(this.player, this.player.displayWidth/2-15, this.player.displayHeight/2, false);
            this.walkingVFX.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (this.player.body.blocked.down && Math.abs(this.player.body.velocity.x) > 0.1 && Math.random() < this.PARTICLE_FREQUENCY) {
                this.walkingVFX.explode();
            }

        } else if(cursors.right.isDown || this.dKey.isDown && !this.playerFrozen) {
            this.player.setAccelerationX(this.ACCELERATION);
            this.player.setFlip(true, false);
            this.player.anims.play('walk', true);
            
            this.walkingVFX.startFollow(this.player, this.player.displayWidth/2-15, this.player.displayHeight/2, false);

            this.walkingVFX.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (this.player.body.blocked.down && Math.abs(this.player.body.velocity.x) > 0.1 && Math.random() < this.PARTICLE_FREQUENCY) {
                this.walkingVFX.explode();
            }

        } else {
            // Set acceleration to 0 and have DRAG take over
            this.player.setAccelerationX(0);
            this.player.setDragX(this.DRAG);
            if (!this.playerFrozen){
                this.player.anims.play('idle');
            }

            this.walkingVFX.stop();
        }

        if ((cursors.left.isDown || this.aKey.isDown || cursors.right.isDown || this.dKey.isDown || Math.abs(this.player.body.velocity.x) > 30) && this.player.body.blocked.down) {
            if (!this.footstep1Sound.isPlaying) {
                this.start_footstep_sounds();
            }
            this.footstep1Sound.volume = 0.15
            this.footstep2Sound.volume = 0.15
            this.footstep3Sound.volume = 0.15
        }
        else{
            this.footstep1Sound.setLoop(false);
            this.footstep2Sound.setLoop(false);
            this.footstep3Sound.setLoop(false);
            this.footstep1Sound.setVolume(this.footstep1Sound.volume - 5 * (delta / 1000));
            this.footstep2Sound.setVolume(this.footstep2Sound.volume - 5 * (delta / 1000));
            this.footstep3Sound.setVolume(this.footstep3Sound.volume - 5 * (delta / 1000));
        }

        // Clamp x velocity
        this.player.setVelocityX(Math.max(Math.min(this.player.body.velocity.x, this.MAX_SPEED), -this.MAX_SPEED));

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!this.player.body.blocked.down && time - this.lastBlockedTime > 100 && !this.playerFrozen) {
            this.player.anims.play('jump');
        }
        if(!this.playerFrozen && (this.player.body.blocked.down || this.coyoteTimer < this.COYOTE_TIME) && (Phaser.Input.Keyboard.JustDown(cursors.up) || Phaser.Input.Keyboard.JustDown(this.wKey))) {
            this.player.body.setVelocityY(this.JUMP_VELOCITY);

            this.jumpSound.play();

            this.jumpVFX.x = this.player.x;
            this.jumpVFX.y = this.player.y + 10;
            this.jumpVFX.explode()
        }
        if (this.player.body.blocked.down){
            this.coyoteTimer = 0;
            this.lastBlockedTime = time;
        }

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.footstep1Sound.stop();
            this.footstep2Sound.stop();
            this.footstep3Sound.stop();
            this.scene.restart();
        }

        //Move Collectibles
        for (let collectible of this.collectibles) {
            collectible.y += Math.sin(5 * time / 1000) * (delta / 1000) * 2
        }

        for (let button of this.buttons) {
            if (button.pressedTimer > 0) {
                button.pressedTimer -= delta / 1000;
                button.setTexture("button_pressed");
                continue;
            }

            if (Math.sqrt((button.x - this.player.x) ** 2 + (button.y - this.player.y) ** 2) < this.BUTTON_RADIUS) {
                button.setTexture("button_near");

                if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                    button.setTexture("button_pressed");
                    button.pressedTimer = this.BUTTON_PRESS_SECONDS
                    this.reset_crates();

                    this.buttonVFX.x = button.x;
                    this.buttonVFX.y = button.y + button.displayHeight/2;
                    this.buttonVFX.explode()
                }
            }
            else{
                button.setTexture("button_idle");
            }
        }

        this.playerLight.x = this.player.x;
        this.playerLight.y = this.player.y;

        this.check_win_state();

        //console.log(this.player.x);
        //console.log(this.player.y);
    }

    start_footstep_sounds(){
        this.footstep1Sound.play({detune: Phaser.Math.Between(-100, 100)});
        this.footstep1Sound.setLoop(true);

        this.footstep2Sound.play({detune: Phaser.Math.Between(-100, 100)});
        this.footstep2Sound.setLoop(true);

        this.footstep3Sound.play({detune: Phaser.Math.Between(-100, 100)});
        this.footstep3Sound.setLoop(true);
    }

    reset_crates(){
        for (let crate of this.crates) {
            crate.x = crate.originalX;
            crate.y = crate.originalY;
        }
    }

    respawn_player() {
        this.killCollider.active = true;
        this.playerFrozen = false;

        let maxIndex = -1;
        for (let i = 0; i < this.buttons.length; i++) {
            if (this.buttons[i].y > 300 && this.buttons[i] && this.buttons[i].x < this.player.x && (maxIndex === -1 || this.buttons[i].x > this.buttons[maxIndex].x)) {
                maxIndex = i;
            }
        }

        this.player.x = this.buttons[maxIndex].x;
        this.player.y = this.buttons[maxIndex].y;
    }

    check_win_state() {
        if (this.player.x < this.CAMERA_BOUND_X + 50 || this.hasWon){
            return;
        }

        this.hasWon = true;
        this.winSound.play();

        let x = 1420;
        let y = 219;

        
        this.youWin = this.add.bitmapText(x, y - 30, "rocketSquare", "You Win!");
        this.youWin.setDepth(4);
        this.youWin.setOrigin(0.5);
        this.youWin.setScale(1.5);

        let collectiblesLeft = this.collectibleGroup.getChildren().length;
        this.collectedText = this.add.bitmapText(x, y, "rocketSquare", "Collected " + (3 - collectiblesLeft) + "/3  ");
        this.collectedText.setDepth(4);
        this.collectedText.setOrigin(0.5);
        this.collectedText.setScale(1.0);

        this.collectedWrench = this.add.sprite(x + 165, y + 2, "wrench");
        this.collectedWrench.setDepth(4);
        this.collectedWrench.setOrigin(0.5);
        this.collectedWrench.setScale(1.5);

        this.youWinRestart = this.add.bitmapText(x, y + 30, "rocketSquare", "- click to restart -");
        this.youWinRestart.setDepth(4);
        this.youWinRestart.setOrigin(0.5);
        this.youWinRestart.setScale(1.0);

        this.blackSquare = this.add.sprite(x, y, "black_square");
        this.blackSquare.setDepth(3);
        this.blackSquare.setScale(50);
        this.blackSquare.alpha = 0.5;

        this.footstep1Sound.stop();
        this.footstep2Sound.stop();
        this.footstep3Sound.stop();

        return;
    }
}