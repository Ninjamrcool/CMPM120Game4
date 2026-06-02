class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load characters spritesheet
        this.load.atlas("platformer_characters", "sprites/player/tilemap-characters-packed.png", "sprites/player/tilemap-characters-packed.json");
        this.load.image("player_dead", "sprites/player/dead.png");

        // Load tilemap information
        this.load.image("factory_tiles_packed", "sprites/tilemap/factory_tiles_packed.png");
        this.load.image("rock_tiles_packed", "sprites/tilemap/rock_tiles_packed.png");
        
        this.load.tilemapTiledJSON("factory", "factory.tmj");   // Tilemap in JSON

        //Load collectibles
        this.load.image("wrench", "sprites/collectibles/wrench.png");

        //Load crate
        this.load.image("crate", "sprites/crate.png");

        //Load buttons
        this.load.image("button_near", "sprites/button/near.png");
        this.load.image("button_idle", "sprites/button/idle.png");
        this.load.image("button_pressed", "sprites/button/pressed.png");

        //Load background
        this.load.image("background", "sprites/background.png");


        // Oooh, fancy. A multi atlas is a texture atlas which has the textures spread
        // across multiple png files, so as to keep their size small for use with
        // lower resource devices (like mobile phones).
        // kenny-particles.json internally has a list of the png files
        // The multiatlas was created using TexturePacker and the Kenny
        // Particle Pack asset pack.
        this.load.multiatlas("kenny-particles", "sprites/particles/kenny-particles.json");
        this.load.image("white_pixel_particle", "sprites/particles/white_pixel.png");
        this.load.image("gray_pixel_particle", "sprites/particles/gray_pixel.png");
        this.load.image("orange_pixel_particle", "sprites/particles/orange_pixel.png");
        this.load.image("green_pixel_particle", "sprites/particles/green_pixel.png");
        this.load.image("white_star_particle", "sprites/particles/white_star.png");

        // Load font
        this.load.bitmapFont("rocketSquare", "KennyRocketSquare_0.png", "KennyRocketSquare.fnt");

        // Load UI
        this.load.image("black_square", "sprites/black_square.png");

        // Load sounds
        this.load.setPath("./assets/sounds");

        this.load.audio("splash", "splash.mp3");
        this.load.audio("footstep_1", "footstep_1.mp3");
        this.load.audio("footstep_2", "footstep_2.mp3");
        this.load.audio("footstep_3", "footstep_3.mp3");
        this.load.audio("collect", "collect.mp3");
        this.load.audio("jump", "jump.mp3");
        this.load.audio("win", "win.mp3");

    }

    create() {
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_",
                start: 18,
                end: 19,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 5,
            repeat: -1
        });

        this.anims.create({
            key: 'idle',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0019.png" }
            ],
            repeat: -1
        });

        this.anims.create({
            key: 'dead',
            frames: [
                { key: "player_dead" }
            ],
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0020.png" }
            ],
        });

         // ...and pass to the next Scene
         this.scene.start("platformerScene");
    }

    // Never get here since a new scene is started in create()
    update() {
    }
}