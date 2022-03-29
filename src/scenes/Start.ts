import Phaser from "phaser";

export default class Start extends Phaser.Scene {
    constructor() {
        super('start')
    }

    create() {
        // cene scale
        const { width, height } = this.scale;

        // scene text
        this.add.text(width * 0.5, height * 0.25, 'Start', {
            fontSize: '52px',
            color: '#00ff00'
        })
        .setOrigin(0.5);

        this.add.text(width * 0.5, height * 0.4, '--------------Goal--------------\n\nCollect 10 coins to beat a level\nBeat all 3 levels', {
            fontSize: '20px',
            color: '#00ff00'
        })
        .setOrigin(0.5);

        this.add.text(width * 0.5, height * 0.6, '------------Controls------------\n\nMovement: left and right arrows\nJump: spacebar', {
            fontSize: '20px',
            color: '#00ff00'
        })
        .setOrigin(0.5);

        // start game button goes to level1
        const button = this.add.rectangle(width * 0.5, height * 0.8, 150, 75, 0xffffff)
            .setInteractive()
            .on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
                this.scene.start('level1');
            });  

        this.add.text(button.x, button.y, 'Play', {
            color: '#000000'
        })
        .setOrigin(0.5);
    }
}