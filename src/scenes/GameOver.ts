import Phaser from "phaser";
import { sharedInstance as events } from "../scripts/EventManager";

export default class GameOver extends Phaser.Scene {
    constructor() {
        super('game-over')
    }

    create() {
        // scene scale
        const { width, height } = this.scale;

        // scene text
        this.add.text(width * 0.5, height * 0.3, 'Game Over', {
            fontSize: '52px',
            color: '#ff0000'
        })
        .setOrigin(0.5);

        // start game button goes to start scene
        const button = this.add.rectangle(width * 0.5, height * 0.5, 150, 75, 0xffffff)
            .setInteractive()
            .on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
                this.scene.start('start');
            });  

        this.add.text(button.x, button.y, 'Play Again', {
            color: '#000000'
        })
        .setOrigin(0.5);
    }
}