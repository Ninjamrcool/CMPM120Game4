class WinScreen extends Phaser.Scene {
    constructor() {
        super("winScreenScene");
    }

    preload() {
        
    }

    // Create --------------------------------------------------------

    create() {
        let x = this.cameras.main.midPoint.x;
        let y = this.cameras.main.midPoint.y;
        
        this.youWin = this.add.bitmapText(x, y - 120, "rocketSquare", "You Win!");
        this.youWin.setDepth(4);
        this.youWin.setOrigin(0.5);
        this.youWin.setScale(4.5);

        let collectiblesLeft = this.scene.get("platformerScene").collectibleGroup.getChildren().length;
        this.collectedText = this.add.bitmapText(x, y, "rocketSquare", "Collected " + (3 - collectiblesLeft) + "/3  ");
        this.collectedText.setDepth(4);
        this.collectedText.setOrigin(0.5);
        this.collectedText.setScale(3.0);

        this.collectedWrench = this.add.sprite(x + 495, y + 2, "wrench");
        this.collectedWrench.setDepth(4);
        this.collectedWrench.setOrigin(0.5);
        this.collectedWrench.setScale(4.5);

        this.youWinRestart = this.add.bitmapText(x, y + 120, "rocketSquare", "- click to restart -");
        this.youWinRestart.setDepth(4);
        this.youWinRestart.setOrigin(0.5);
        this.youWinRestart.setScale(3.0);

        this.blackSquare = this.add.sprite(x, y, "black_square");
        this.blackSquare.setDepth(3);
        this.blackSquare.setScale(50);
        this.blackSquare.alpha = 0.5;

        this.input.on("pointerdown", (pointer) => {
            console.log("hiiii");
            this.scene.resume("platformerScene");
            this.scene.stop();
        });
    }

    update(time, delta) {

    }
}