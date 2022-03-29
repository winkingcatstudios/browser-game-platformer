import Phaser from "phaser";
import { sharedInstance as events } from "../scripts/EventManager";

export default class UI extends Phaser.Scene {
    // class variables
    private coinsLabel!: Phaser.GameObjects.Text;
    private levelLabel!: Phaser.GameObjects.Text;
    private graphics!: Phaser.GameObjects.Graphics;

    // local variables
    private lastHealth = 100;
    private coinsCollected = 0;
    private currLevel = 1;

    constructor() {
        super('ui');
    }

    init() {
        // reset coin collect count on each level load
        this.coinsCollected = 0;
    }

    create() {
        // health bar graphic
        this.graphics = this.add.graphics();
        this.setHealthBar(100);

        // level label, doesn't change just set on load
        this.levelLabel = this.add.text(10, 35, `Level: ${this.currLevel}`, {
            fontSize: '32px'
        });

        // coins label, changes in handleCoinCollected
        this.coinsLabel = this.add.text(10, 70, 'Coins: 0', {
            fontSize: '32px'
        });

        // set up events
        events.on('coin-collected', this.handleCoinCollected, this)
        events.on('health-changed', this.handleHealthChanged, this);
        events.on('reset-game', this.handleReset, this);

        // clean up events
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            events.off('coin-collected', this.handleCoinCollected, this)
        });
    }

    // hset up health bar
    private setHealthBar(value: number) {
        const width = 200;
        const percent = Phaser.Math.Clamp(value, 0, 100) / 100;

        this.graphics.clear();
        this.graphics.fillStyle(0x808080);
        this.graphics.fillRoundedRect(10, 10, width, 20, 5);
        if (percent > 0) {
            this.graphics.fillStyle(0x00ff00);
            this.graphics.fillRoundedRect(10, 10, width * percent, 20, 5);
        }

    }

    // handles health changes and animates bar with tween
    private handleHealthChanged(value: number) {
        this.tweens.addCounter( {
            from: this.lastHealth,
            to: value,
            duration: 200,
            ease: Phaser.Math.Easing.Sine.InOut,
            onUpdate: tween => {
                const value = tween.getValue();
                this.setHealthBar(value);
            }
        });

        this.lastHealth = value;
    }

    // handles coin collect changes and changes scene if level win condition is met
    private handleCoinCollected() {
        ++this.coinsCollected;
        this.coinsLabel.text = `Coins: ${this.coinsCollected}`;

        if (this.coinsCollected >= 10) {
            if (this.currLevel === 1) {
                this.time.delayedCall(750, () => {
                    this.scene.start('level2');
                    this.scene.stop('level1');
                    this.currLevel = 2
                    this.coinsCollected = 0;
                })
            }
            if (this.currLevel === 2) {
                this.time.delayedCall(750, () => {
                    this.scene.start('level3');
                    this.scene.stop('level2');
                    this.currLevel = 3
                    this.coinsCollected = 0;
                })
            }
            if (this.currLevel === 3) {
                this.time.delayedCall(750, () => {
                    this.scene.start('win');
                    this.scene.stop('level3');
                    this.currLevel = 1
                    this.coinsCollected = 0;
                })
            }
        }
    }

    // reset game on lose
    // prevents a bug that caused losing on level 2 to take you to level 1 
    // and then beating that level took you straight to level 3
    private handleReset() {
        this.currLevel = 1
        this.coinsCollected = 0;
    }

}