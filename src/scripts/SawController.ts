import { Physics } from "phaser";
import StateMachine from "./StateMachine";
import { sharedInstance as events} from './EventManager';

export default class SawController {
    // class variables
    private scene: Phaser.Scene;
    private sprite: Phaser.Physics.Matter.Sprite;
    private stateMachine: StateMachine;

    // local variables
    private moveTime = 0;

    // constructor takes a scene and sprite
    // runs animation creator
    // sets up stateMachine states (onEnter and onUpdate for most)
    // starts event for stomp
    constructor(
        scene: Phaser.Scene,
        sprite: Phaser.Physics.Matter.Sprite
        ) {
            this.scene = scene;
            this.sprite = sprite;

            this.createAnims();

            this.stateMachine = new StateMachine(this);

            this.stateMachine.addState('idle', {
                onEnter: this.idleOnEnter
                //onUpdate: this.idleOnUPdate
            })
            .addState('move-left', {
                onEnter: this.moveLeftOnEnter,
                onUpdate: this.moveLeftOnUpdate
            })
            .addState('move-right', {
                onEnter: this.moveRightOnEnter,
                onUpdate: this.moveRightOnUPdate
            })
            .addState('dead', {
                // placeholder, used to use the death sprite, 
                // but squish happens to fast so it was removed
            })
            .setState('idle');

            events.on('saw-stomped', this.handleStomped, this);
        }

        // clean up events
        destroy() {
            events.off('saw-stomped', this.handleStomped, this);
        }

        // state machine tick
        update(deltaTime: number) {
            this.stateMachine.update(deltaTime);
        }

        // movement states, enemy moves left then right then repeats
        private moveLeftOnEnter() {
            this.moveTime = 0;
            this.sprite.play('move-left');
        }

        private moveLeftOnUpdate(deltaTime: number) {
            this.moveTime+= deltaTime;
            this.sprite.flipX = false;
            this.sprite.setVelocityX(-3);

            if (this.moveTime > 2000) {
                this.stateMachine.setState('move-right');
            }
        }

        private moveRightOnEnter() {
            this.moveTime = 0;
            this.sprite.play('move-right');
        }

        private moveRightOnUPdate(deltaTime: number) {
            this.moveTime+= deltaTime;
            this.sprite.flipX = true;
            this.sprite.setVelocityX(3);

            if (this.moveTime > 2000) {
                this.stateMachine.setState('move-left');
            }
        }

        private idleOnEnter() {
            this.sprite.play('idle');

            // Set movement
            this.stateMachine.setState('move-left');

            // Randomized movement, this caused enemies to fall of platforms
            // const rand = Phaser.Math.Between(1, 100);
            // if (rand < 50) {
            //     this.stateMachine.setState('move-left');
            // } 
            // else {
            //     this.stateMachine.setState('move-right');
            // }
        }

        // stomping on bee squishes the sprite with tween then destroys it
        private handleStomped(saw: Phaser.Physics.Matter.Sprite) {
            if (this.sprite !== saw) {
                return;
            }

            events.off('saw-stomped', this.handleStomped, this);

            this.scene.tweens.add( {
                targets: this.sprite,
                displayHeight: 0,
                y: this.sprite.y + (this.sprite.displayHeight * 0.5),
                duration: 200,
                onComplete: () => {
                    this.sprite.destroy();
                }
            })

            this.stateMachine.setState('dead');
        }

        // creates move and idle animations, death animations removed as it's no longer used
        private createAnims() {
            this.sprite.anims.create( {
                key: 'idle',
                frames: [{ key: 'saw', frame: 'bsawee.png' }]
            });
            this.sprite.anims.create( {
                key: 'move-left',
                frameRate: 5,
                frames: [{ key: 'saw', frame: 'sawHalf.png' }, { key: 'saw', frame: 'sawHalf_move.png' }],
                repeat: -1
            });
            this.sprite.anims.create( {
                key: 'move-right',
                frameRate: 5,
                frames: [{ key: 'saw', frame: 'sawHalf.png' }, { key: 'saw', frame: 'sawHalf_move.png' }],
                repeat: -1
            });
        }

}