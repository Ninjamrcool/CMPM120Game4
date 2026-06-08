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

        this.creditsButton = this.add.bitmapText(x + 450, y - 400, "rocketSquare", "- Credits -");
        this.creditsButton.setDepth(4);
        this.creditsButton.setOrigin(0.5);
        this.creditsButton.setScale(2.0);
        this.creditsButton.setInteractive();

        this.creditsText = this.add.bitmapText(x, y/2 + 20, "rocketSquare", "Credits:\n \nTyler Roth\nJack Seales\n \nMusic and sounds from Pixabay\nArt from Kenny Assets");
        this.creditsText.setDepth(4);
        this.creditsText.setOrigin(0.5);
        this.creditsText.setScale(2.0);
        this.creditsText.setInteractive();
        this.creditsText.setVisible(false);

        this.creditsBackButton = this.add.bitmapText(x + 450, y - 400, "rocketSquare", "-  Back  -");
        this.creditsBackButton.setDepth(4);
        this.creditsBackButton.setOrigin(0.5);
        this.creditsBackButton.setScale(2.0);
        this.creditsBackButton.setInteractive();
        this.creditsBackButton.setVisible(false);

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

        this.hoverSound = this.sound.add("ui_button_hover", {
            volume: 0.25
        });

        this.playButton.on("pointerdown", (pointer) => {
            this.hoverSound.detune = 600;
            this.hoverSound.play();
            this.mainMenuMusic.stop();
            this.scene.start("platformerScene");
        });

        this.playButton.on('pointerover', () => {
            this.playButton.setTint(0xbbbbbb);
            this.hoverSound.detune = 0;
            this.hoverSound.play();
        });

        this.playButton.on('pointerout', () => {
            this.playButton.setTint(0xffffff);
            this.hoverSound.detune = -300;
            this.hoverSound.play();
        });

        this.creditsButton.on("pointerdown", (pointer) => {
            this.hoverSound.detune = 600;
            this.hoverSound.play();
            this.creditsText.setVisible(true);
            this.creditsBackButton.setVisible(true);
            this.playButton.setVisible(false);
            this.titleText.setVisible(false);
            this.creditsButton.setVisible(false);
        });

        this.creditsButton.on('pointerover', () => {
            this.creditsButton.setTint(0xbbbbbb);
            this.hoverSound.detune = 0;
            this.hoverSound.play();
        });

        this.creditsButton.on('pointerout', () => {
            this.creditsButton.setTint(0xffffff);
            this.hoverSound.detune = -300;
            this.hoverSound.play();
        });

        this.creditsBackButton.on("pointerdown", (pointer) => {
            this.hoverSound.detune = 600;
            this.hoverSound.play();
            this.creditsText.setVisible(false);
            this.creditsBackButton.setVisible(false);
            this.creditsButton.setVisible(true);
            this.playButton.setVisible(true);
            this.titleText.setVisible(true);
        });

        this.creditsBackButton.on('pointerover', () => {
            this.creditsBackButton.setTint(0xbbbbbb);
            this.hoverSound.detune = 0;
            this.hoverSound.play();
        });

        this.creditsBackButton.on('pointerout', () => {
            this.creditsBackButton.setTint(0xffffff);
            this.hoverSound.detune = -300;
            this.hoverSound.play();
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