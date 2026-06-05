class PauseScreen extends Phaser.Scene {
    constructor() {
        super("pauseScreenScene");
    }

    preload() {
        
    }

    // Create --------------------------------------------------------

    create() {
        let x = this.cameras.main.midPoint.x;
        let y = this.cameras.main.midPoint.y;

        this.pausedTitle = this.add.bitmapText(x, y - 180, "rocketSquare", " = Paused = ");
        this.pausedTitle.setDepth(4);
        this.pausedTitle.setOrigin(0.5);
        this.pausedTitle.setScale(3);

        this.pausedResume = this.add.bitmapText(x, y, "rocketSquare", "Press ESC to Resume");
        this.pausedResume.setDepth(4);
        this.pausedResume.setOrigin(0.5);
        this.pausedResume.setScale(1.8);

        this.blackSquare = this.add.sprite(x, y, "black_square");
        this.blackSquare.setDepth(3);
        this.blackSquare.setScale(50);
        this.blackSquare.alpha = 0.5;

        this.mainMenuButton = this.add.bitmapText(x, y + 180, "rocketSquare", "- Main Menu -");
        this.mainMenuButton.setDepth(4);
        this.mainMenuButton.setOrigin(0.5);
        this.mainMenuButton.setScale(2.5);
        this.mainMenuButton.setInteractive();

        this.hoverSound = this.sound.add("ui_button_hover", {
            volume: 0.25
        });

        this.mainMenuButton.on("pointerdown", (pointer) => {
            this.hoverSound.detune = 600;
            this.hoverSound.play();

            this.scene.stop();
            this.sound.setVolume(1);
            this.scene.resume("platformerScene");
            this.scene.get("platformerScene").returnToMainMenu();
        });

        this.mainMenuButton.on('pointerover', () => {
            this.mainMenuButton.setTint(0xbbbbbb);
            this.hoverSound.detune = 0;
            this.hoverSound.play();
        });

        this.mainMenuButton.on('pointerout', () => {
            this.mainMenuButton.setTint(0xffffff);
            this.hoverSound.detune = -300;
            this.hoverSound.play();
        });

        this.escKey = this.input.keyboard.addKey('ESC');
    }

    update(time, delta) {
        if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
            this.scene.stop();
            this.sound.setVolume(1);
            this.scene.resume("platformerScene");
        }
    }
}