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
        this.BUTTON_PRESS_SECONDS = 0.3;

        // Camera ---------------------
        this.CAMERA_SCALE = 2.5;
        this.CAMERA_LERP_SPEED = 0.06;
        this.CAMERA_BOUND_X = 1700;
        this.CAMERA_BOUND_Y = 650;

        // NPCs ---------------------
        this.NPC_RADIUS = 35;
        this.IN_DIALOGUE = false;
        this.DIALOGUE_INDEX = 0;
    
        //Misc. ---------------------
        this.PARTICLE_VELOCITY = 30;
        this.PARTICLE_FREQUENCY = 0.1;
        this.AMBIENT_COLOR = 0x303030;

        //Runtime
        this.coyoteTimer = 0;
        this.playerFrozen = false;
        this.lastBlockedTime = 0;
        this.hasWon = false;
        this.musicPlaying = false;

        //Dialogue Box
        this.dialogueBox = this.add.rectangle(
            400,
            550,
            400,
            100,
            0x000000,
            0.8
        )
        .setDepth(1);

        this.dialogueText = this.add.text(
            100,
            520,
            "",
            {
                fontSize: "14px",
                wordWrap: { width: 300 },
                align: "center"
            },
        )
        .setDepth(2);

        this.dialogueBox.setVisible(false);
        this.dialogueText.setVisible(false);
    }

    // Create --------------------------------------------------------

    create() {
        this.lights.enable();
        this.lights.setAmbientColor(this.AMBIENT_COLOR);

        this.setupTilemap();

        this.spawnObjects();

        this.setupPlayer();

        this.createVFX();

        this.setupHardCollisions();

        this.setupKillCollisions();

        // Must be after createVFX()
        this.setupCollectiblesCollisions();

        this.setupNPCSCollisions();

        this.setupInput();

        // Must be after setupPlayer()
        this.setupCamera();

        this.setupSounds();

        //Must be after setupSounds() so that NPCs can use the sounds when talking
        this.setupNPCS();

        this.background = this.add.tileSprite(0, 0, this.CAMERA_BOUND_X, this.CAMERA_BOUND_Y, "background").setOrigin(0, 0).setTint(0xaaaaaa).setScrollFactor(0.5).depth = -2;

        this.spawnAcidLights();

        // Must be at the end of create()
        this.initializeAnimatedTiles();
    }

    setupTilemap() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 999 tiles wide and 999 tiles tall.
        this.map = this.add.tilemap("factory", 18, 18, 999, 999);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.factoryTileset = this.map.addTilesetImage("factory_tileset", "factory_tiles_packed");
        this.rockTileset = this.map.addTilesetImage("rock_tileset", "rock_tiles_packed");

        // Create layers
        this.killLayer = this.map.createLayer("Kill", [this.factoryTileset, this.rockTileset], 0, 0);
        this.groundLayer = this.map.createLayer("Ground", [this.factoryTileset, this.rockTileset], 0, 0);
        this.decorLayer = this.map.createLayer("Decor", [this.factoryTileset, this.rockTileset], 0, 0);

        this.groundLayer.setPipeline('Light2D');
        this.decorLayer.setPipeline('Light2D');
        this.killLayer.setPipeline('Light2D');

        // Make layers collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        this.killLayer.setCollisionByProperty({
            collides: true
        });
    }

    spawnObjects() {
        // Create objects
        this.collectibles = this.map.createFromObjects("Collectibles", {
            name: "collectible",
            key: "wrench",
        });

        //this y bug is so dumb
        for (let collectible of this.collectibles) {
            collectible.y += 576;
            collectible.setPipeline('Light2D');
            collectible.light = this.lights.addLight(collectible.x, collectible.y, 100, 0x7080aa, 0.5);
        }

        this.crates = this.map.createFromObjects("Crates", {
            name: "crate",
            key: "crate",
        });

        for (let crate of this.crates) {
            crate.y += 576;
            crate.originalX = crate.x;
            crate.originalY = crate.y;
            crate.setPipeline('Light2D');
        }

        this.buttons = this.map.createFromObjects("Buttons", {
            name: "button",
            key: "button_idle",
        });

        for (let button of this.buttons) {
            button.y += 576;
            button.pressedTimer = 0.0
            button.setPipeline('Light2D');
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
        // This will be used for collision detection
        this.collectibleGroup = this.add.group(this.collectibles);
        this.crateGroup = this.add.group(this.crates);
    }

    setupPlayer() {
        // set up player avatar
        this.player = this.physics.add.sprite(this.SPAWN_X, this.SPAWN_Y, "platformer_characters", "tile_0019.png");
        this.player.setCollideWorldBounds(false);
        this.player.scale = this.PLAYER_SCALE;
        this.player.body.setSize(15, 13, true); 
        this.player.body.setOffset(4.5, 10);

        this.player.setPipeline('Light2D');

        this.playerLight = this.lights.addLight(200, 300, 100, 0x303050, 1);
    }

    setupNPCS() {
        this.npcs = [
            {
                name: "npc1",
                sprite: this.add.sprite(300, 510, "platformer_characters", "tile_0017.png").setPipeline('Light2D').anims.play('npc1', true),
                // setImmovable: true,
                dialogue: [
                    "AAAAAAAAAH!!!!!",
                    "Something's gone wrong with the factory!!!",
                    "I knew my workspace was messy but not THIS MESSY! ",
                    "We gotta get out of here!",
                ],
                light: this.lights.addLight(300, 500, 100, 0x303050, 1),
                blowUpSprite: this.add.sprite(300, 500, "platformer_characters", "tile_0016.png")
                .setScale(3)
                .setVisible(false)
                .setDepth(4)
                .anims.play('npc1', true),
                talkRate: 1,
            },
            {
                name: "npc2",
                sprite: this.add.sprite(580, 450, "platformer_characters", "tile_0024.png").setPipeline('Light2D').anims.play('npc2', true),
                dialogue: [
                    "What's up?",
                    "How's it going?"
                ],
                light: this.lights.addLight(600, 450, 100, 0x303050, 1),
                blowUpSprite: this.add.sprite(600, 450, "platformer_characters", "tile_0000.png")
                .setScale(3)
                .setVisible(false)
                .setDepth(4)
                .anims.play('npc2', true),
                talkRate: 0.5,
            }
        ];
    }

    createVFX() {
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
    }

    setupHardCollisions() {
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
    }


    setupKillCollisions() {
        this.killCollider = this.physics.add.collider(this.player, this.killLayer, (obj1, obj2) => {
            this.killCollider.active = false;
            this.playerFrozen = true;
            this.player.anims.play('dead', true);
            this.splashSound.play();

            this.deathVFX.x = this.player.x;
            this.deathVFX.y = this.player.y + this.player.displayHeight;
            this.deathVFX.explode();

            this.time.delayedCall(this.RESPAWN_TIME * 1000, () => {this.respawnPlayer();}, [], this);
        });
    }

    respawnPlayer() {
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

    setupCollectiblesCollisions() {
        // Handle collision detection with collectibles
        this.physics.add.overlap(this.player, this.collectibleGroup, (obj1, obj2) => {
            this.collectiblesVFX.x = obj2.x;
            this.collectiblesVFX.y = obj2.y;
            this.collectiblesVFX.explode();
            this.collectSound.play();
            obj2.destroy(); // remove collectible on overlap
            this.lights.removeLight(obj2.light);
        });
    }

    setupNPCSCollisions() {
        this.physics.add.collider(this.player, this.npc1, () => {
            console.log("talk to npc");
        });
    }

    setupInput() {
        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');
        this.eKey = this.input.keyboard.addKey('E');

        this.wKey = this.input.keyboard.addKey('W');
        this.aKey = this.input.keyboard.addKey('A');
        this.sKey = this.input.keyboard.addKey('S');
        this.dKey = this.input.keyboard.addKey('D');

        this.escKey = this.input.keyboard.addKey('ESC');


        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-Q', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);
        this.physics.world.drawDebug = false;

        //add ui for controls
        this.add.image(298, 565, "controls_ui").setScale(0.1).setAlpha(1);
    }

    setupCamera() {
        this.cameras.main.setBounds(0, 0, this.CAMERA_BOUND_X, this.CAMERA_BOUND_Y);
        this.cameras.main.startFollow(this.player, true, this.CAMERA_LERP_SPEED, this.CAMERA_LERP_SPEED);
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.CAMERA_SCALE);
    }

    setupSounds() {
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
            volume: 0.15
        });

        this.winSound = this.sound.add("win", {
            volume: 0.25
        });

        this.talkingSound = this.sound.add("talking2", {
            volume: 0.25
        });

        this.buttonPressSound = this.sound.add("button_press", {
            volume: 0.25
        });

        //create bg music
        this.factoryMusic = this.sound.add("factory_music", {
            volume: 0.2,
            loop: true
        });
    }

    spawnAcidLights() {
        this.killLayer.forEachTile(tile => {
            if (tile && tile.index > 0){
                if ((tile.x + tile.y) % 6 === 1){
                    this.lights.addLight(tile.pixelX, tile.pixelY, 100, 0x308030, 1);
                }
            }
        });

        this.decorLayer.forEachTile(tile => {
            if (tile && tile.index === 31){ //acid waterfall center tile
                if ((tile.x + tile.y) % 4 === 1){
                    this.lights.addLight(tile.pixelX, tile.pixelY, 100, 0x308030, 1);
                }
            }
        });
    }

    initializeAnimatedTiles() {
        // Code from aaron that fixes animated tiles plugin
        this.map.layers.forEach(layerData => {
            layerData.data.forEach(row => {
                row.forEach((tile, i) => {
                    if (tile === null){
                        row[i] = new Phaser.Tilemaps.Tile(layerData, 1, 0, 0, this.map.tileWidth, this.map.tileHeight, this.map.tileWidth, this.map.tileHeight);
                    }
                });
            });
        });

        // Initialize the animated tiles plugin
        // This line needs to come *after* any line which creates a tilemap layer.
        // Putting this at the end of create() is a safe place
        this.animatedTiles.init(this.map);
    }

    // Update --------------------------------------------------------

    update(time, delta) {
        let inputDirection = this.handlePlayerInput();

        this.clampPlayerVelocity();

        this.checkFootstepSounds(inputDirection, delta);

        this.handlePlayerJump(time);

        this.handleRestartInput();

        this.animateCollectibles(time, delta);

        this.handleButtons(delta)

        this.handleNPCInteraction(delta);

        this.playerLight.x = this.player.x;
        this.playerLight.y = this.player.y;

        this.checkWinState();

        this.coyoteTimer += delta / 1000;


        if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
            this.stopFootstepSounds();
            this.sound.setVolume(0.4);
            this.scene.launch("pauseScreenScene");
            this.scene.pause();
        }
    }

    handlePlayerInput() {
        let inputDirection = 0;
        if (!this.playerFrozen){
            if (cursors.left.isDown || this.aKey.isDown) {
                if (!this.musicPlaying){
                    this.factoryMusic.play();
                    this.musicPlaying = true;
                }
                inputDirection -= 1;
                this.player.resetFlip();
            }
            if (cursors.right.isDown || this.dKey.isDown) {
                if (!this.musicPlaying){
                    this.factoryMusic.play();
                    this.musicPlaying = true;
                }
                inputDirection += 1;
                this.player.setFlip(true, false);
            }
        }

        if (inputDirection === 0) {
            // Set acceleration to 0 and have DRAG take over
            this.player.setAccelerationX(0);
            this.player.setDragX(this.DRAG);
            if (!this.playerFrozen){
                this.player.anims.play('idle');
            }

            this.walkingVFX.stop();
        }
        else{
            this.player.setAccelerationX(inputDirection * this.ACCELERATION);
            this.player.anims.play('walk', true);

            this.walkingVFX.startFollow(this.player, this.player.displayWidth/2-15, this.player.displayHeight/2, false);
            this.walkingVFX.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play walk vfx if touching the ground
            if (this.player.body.blocked.down && Math.abs(this.player.body.velocity.x) > 0.1 && Math.random() < this.PARTICLE_FREQUENCY) {
                this.walkingVFX.explode();
            }
        }

        return inputDirection;
    }

    clampPlayerVelocity() {
        this.player.setVelocityX(Math.max(Math.min(this.player.body.velocity.x, this.MAX_SPEED), -this.MAX_SPEED));
    }

    checkFootstepSounds(inputDirection, delta) {
        if ((inputDirection !== 0 || Math.abs(this.player.body.velocity.x) > 30) && this.player.body.blocked.down) {
            if (!this.footstep1Sound.isPlaying) {
                this.startFootstepSounds();
            }
            this.footstep1Sound.volume = 0.15;
            this.footstep2Sound.volume = 0.15;
            this.footstep3Sound.volume = 0.15;
        }
        else{
            this.footstep1Sound.setLoop(false);
            this.footstep2Sound.setLoop(false);
            this.footstep3Sound.setLoop(false);
        }
    }

    startFootstepSounds(){
        this.footstep1Sound.play({detune: Phaser.Math.Between(-100, 100)});
        this.footstep1Sound.setLoop(true);

        this.footstep2Sound.play({detune: Phaser.Math.Between(-100, 100)});
        this.footstep2Sound.setLoop(true);

        this.footstep3Sound.play({detune: Phaser.Math.Between(-100, 100)});
        this.footstep3Sound.setLoop(true);
    }

    stopFootstepSounds(){
        this.footstep1Sound.stop();
        this.footstep2Sound.stop();
        this.footstep3Sound.stop();
    }

    handlePlayerJump(time) {
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if (!this.player.body.blocked.down && time - this.lastBlockedTime > 100 && !this.playerFrozen) {
            this.player.anims.play('jump');
        }
        if (!this.playerFrozen && (this.player.body.blocked.down || this.coyoteTimer < this.COYOTE_TIME) && (Phaser.Input.Keyboard.JustDown(cursors.up) || Phaser.Input.Keyboard.JustDown(this.wKey))) {
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
    }

    handleRestartInput() {
        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.footstep1Sound.stop();
            this.footstep2Sound.stop();
            this.footstep3Sound.stop();
            this.factoryMusic.stop();
            this.musicPlaying = false;
            this.scene.restart();
        }
    }

    animateCollectibles(time, delta) {
        for (let collectible of this.collectibles) {
            collectible.y += Math.sin(5 * time / 1000) * (delta / 1000) * 2
        }
    }

    handleButtons(delta) {
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
                    this.resetCrates();
                    
                    this.buttonPressSound.play();

                    this.buttonVFX.x = button.x;
                    this.buttonVFX.y = button.y + button.displayHeight/2;
                    this.buttonVFX.explode();
                }
            }
            else{
                button.setTexture("button_idle");
            }
        }
    }
    
    handleNPCInteraction(delta) {
        for (let npc of this.npcs) {
            if (!(Math.sqrt((npc.sprite.x - this.player.x) ** 2 + (npc.sprite.y - this.player.y) ** 2) < this.NPC_RADIUS)) {
                continue;
            }
            if (!Phaser.Input.Keyboard.JustDown(this.eKey)) {
                continue;
            }

            if (this.IN_DIALOGUE == false) {
                this.dialogueBox.x = this.cameras.main.midPoint.x;
                this.dialogueBox.y = this.cameras.main.midPoint.y + 50;
                this.dialogueText.x = this.cameras.main.midPoint.x - 45;
                this.dialogueText.y = this.cameras.main.midPoint.y + 50;
                npc.blowUpSprite.x = this.dialogueBox.x + 150;
                npc.blowUpSprite.y = this.dialogueBox.y;
                npc.blowUpSprite.setVisible(true);
                this.dialogueBox.setOrigin(0.5);
                this.dialogueText.setOrigin(0.5);
                this.dialogueBox.setVisible(true);
                this.dialogueText.setVisible(true);
                this.IN_DIALOGUE = true;
                this.playerFrozen = true;
                this.typeText(npc.dialogue[0], npc);
                //this.dialogueText.setText(npc.dialogue[0]);
            }

            else if (this.DIALOGUE_INDEX < npc.dialogue.length - 1) {
                this.IN_DIALOGUE = true;
                this.DIALOGUE_INDEX++;
                this.typeText(npc.dialogue[this.DIALOGUE_INDEX], npc);
                //this.dialogueText.setText(npc.dialogue[this.DIALOGUE_INDEX]);
            }

            else {
                this.DIALOGUE_INDEX = 0;
                this.IN_DIALOGUE = false;
                this.dialogueBox.setVisible(false);
                this.dialogueText.setVisible(false);
                npc.blowUpSprite.setVisible(false);
                this.playerFrozen = false;
            }
        }
    }
    typeText(text, npc) {
        this.dialogueText.setText("");

        let i = 0;

        this.time.addEvent({
            delay: 30, // milliseconds between letters
            repeat: text.length - 1,
            callback: () => {
                this.dialogueText.text += text[i];
                if (text[i] !== " " && "aeiou".includes(text[i].toLowerCase())) {
                    this.talkingSound.play({
                        //detune: Phaser.Math.Between(-100, 100),
                        rate: npc.talkRate
                    })
                }
                i++;
            }
        });
    }


    resetCrates(){
        for (let crate of this.crates) {
            crate.x = crate.originalX;
            crate.y = crate.originalY;
        }
    }

    checkWinState() {
        if (this.player.x < this.CAMERA_BOUND_X + 50){
            return;
        }

        if (this.hasWon){
            if (!this.scene.isActive("winScreenScene")){
                this.stopFootstepSounds();
                this.factoryMusic.stop();
                this.scene.restart();
            }
            return;
        }

        this.hasWon = true;
        this.winSound.play();

        this.stopFootstepSounds();
        this.scene.launch("winScreenScene");
        this.scene.pause();

        return;
    }

    // Called from pause screen
    returnToMainMenu() {
        this.stopFootstepSounds();
        this.factoryMusic.stop();
        this.scene.start("mainMenuScene");
    }
}