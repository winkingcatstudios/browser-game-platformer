import Phaser from "phaser";

const sharedInstance = new Phaser.Events.EventEmitter;

// used to pass events between player, enemies, levels and UI
export {
    sharedInstance
}