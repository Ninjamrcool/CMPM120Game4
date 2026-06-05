class MainMenuScreen extends Phaser.Scene {
    constructor() {
        super("mainMenuScene");
    }

    preload() {
        this.PLAY_BUTTON_ROTATE_SPEED = 5;
        this.PLAY_BUTTON_ROTATE_STRENGTH = 2;
    }

    // Create --------------------------------------------------------

    create() {
        let x = this.cameras.main.midPoint.x;
        let y = this.cameras.main.midPoint.y;
        
        this.titleText = this.add.bitmapText(x, y - 250, "rocketSquare", "Factory Flight!");
        this.titleText.setDepth(4);
        this.titleText.setOrigin(0.5);
        this.titleText.setScale(3.5);

        this.playButton = this.add.bitmapText(x, y + 120, "rocketSquare", "- Start -");
        this.playButton.setDepth(4);
        this.playButton.setOrigin(0.5);
        this.playButton.setScale(3.0);
        this.playButton.setInteractive();

        this.background = this.add.tileSprite(0, 0, 400, 400, "background").setOrigin(0, 0).setTint(0x999999)
        this.background.setScale(5);

        this.playerDecor = this.add.sprite(x - 450, y + 180, "platformer_characters", "tile_0019.png");
        this.playerDecor.setDepth(3);
        this.playerDecor.setScale(30);
        this.playerDecor.flipX = true;
        this.playerDecor.angle = 20;

        this.npcDecor = this.add.sprite(x + 460, y + 190, "platformer_characters", "tile_0015.png");
        this.npcDecor.setDepth(3);
        this.npcDecor.setScale(25);
        this.npcDecor.angle = -10;

        this.playButton.on("pointerdown", (pointer) => {
            this.mainMenuMusic.stop();
            this.scene.start("platformerScene");
        });

        this.playButton.on('pointerover', () => {
            this.playButton.setTint(0xbbbbbb);
        });

        this.playButton.on('pointerout', () => {
            this.playButton.setTint(0xffffff);
        });

        this.mainMenuMusic = this.sound.add("main_menu_music", {
            volume: 0.2,
            loop: true
        });
        this.mainMenuMusic.play();
    }

    update(time, delta) {
        this.playButton.angle = this.PLAY_BUTTON_ROTATE_STRENGTH * Math.sin((time / 1000) * this.PLAY_BUTTON_ROTATE_SPEED);
    }
}