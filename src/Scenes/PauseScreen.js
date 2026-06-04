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

        this.pausedTitle = this.add.bitmapText(x, y - 30, "rocketSquare", " - Paused - ");
        this.pausedTitle.setDepth(4);
        this.pausedTitle.setOrigin(0.5);
        this.pausedTitle.setScale(1.5);

        this.pausedResume = this.add.bitmapText(x, y + 30, "rocketSquare", "Press ESC to Resume");
        this.pausedResume.setDepth(4);
        this.pausedResume.setOrigin(0.5);
        this.pausedResume.setScale(1.0);

        this.blackSquare = this.add.sprite(x, y, "black_square");
        this.blackSquare.setDepth(3);
        this.blackSquare.setScale(50);
        this.blackSquare.alpha = 0.5;

        this.escKey = this.input.keyboard.addKey('ESC');
    }

    update(time, delta) {
        if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
            this.scene.stop();
            this.scene.resume("platformerScene");
        }
    }
}