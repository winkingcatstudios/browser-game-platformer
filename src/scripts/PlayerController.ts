import Phaser from "phaser";
import StateMachine from "./StateMachine";
import { sharedInstance as events} from './EventManager';
import ObstaclesController from "./ObstaclesController";

export default class PlayerController {
    // class variables
    private scene: Phaser.Scene;
    private sprite: Phaser.Physics.Matter.Sprite;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private stateMachine: StateMachine;
    private obstacles: ObstaclesController;

    // local variables
    private health = 100;
    private lastBeeHit?: Phaser.Physics.Matter.Sprite;

    // constructor takes scene, sprite, inputs, and obstacle controller (for collision types)
    // runs animation creator
    // sets up stateMachine states (onEnter and onUpdate for most)
    // sets up collision types for health, coins, and enemies
    constructor(
        scene: Phaser.Scene,
        sprite: Phaser.Physics.Matter.Sprite, 
        cursors: Phaser.Types.Input.Keyboard.CursorKeys,
        obstacles: ObstaclesController
        ) {
        this.scene = scene;
        this.sprite = sprite;
        this.cursors = cursors;
        this.obstacles = obstacles;

        this.createAnims();

        this.stateMachine = new StateMachine(this, 'player');

        this.stateMachine.addState('idle', {
            onEnter: this.idleOnEnter,
            onUpdate: this.idleOnUpdate
        })
        .addState('walk', {
            onEnter: this.walkOnEnter,
            onUpdate: this.walkOnUPdate
        })
        .addState('jump', {
            onEnter: this.jumpOnEnter,
            onUpdate: this.jumpOnUpdate
        })
        .addState('spike-hit', {
            onEnter: this.spikeHitOnEnter
        })
        .addState('bee-hit', {
            onEnter: this.beeHitOnEnter
        })
        .addState('bee-stomp', {
            onEnter: this.beeStompOnEnter
        })
        .addState('dead', {
            onEnter: this.deadOnEnter
        })
        .setState('idle');

        this.sprite.setOnCollide((data: MatterJS.ICollisionPair) => {
            const body = data.bodyB as MatterJS.BodyType;

            // spike collision
            if (this.obstacles.isType('spikes', body)) {
                this.stateMachine.setState('spike-hit');
                return;
            }

            // bee collision
            if (this.obstacles.isType('bee', body)) {
                this.lastBeeHit = body.gameObject;

                // monkey is higher than bee by bee's sprite height
                if (this.sprite.y < (body.position.y-128)) {
                    this.stateMachine.setState('bee-stomp');
                }
                else {
                    this.stateMachine.setState('bee-hit');
                }
                return;
            }

            // frog collision
            if (this.obstacles.isType('frog', body)) {
                this.lastBeeHit = body.gameObject;

                // monkey is higher than frog by frog's sprite height
                if (this.sprite.y < (body.position.y-128)) {
                    this.stateMachine.setState('bee-stomp');
                }
                else {
                    this.stateMachine.setState('bee-hit');
                }
                return;
            }

            // saw collision
            if (this.obstacles.isType('saw', body)) {
                this.lastBeeHit = body.gameObject;

                // no check as stomping the saw hurts and does not destroy it
                this.stateMachine.setState('bee-hit');
                return;
            }

            // check collision against no gameobject to return out
            const gameObject = body.gameObject;
            if (!gameObject) {
                return;
            }

            // colliding with tileBody instead of obstacle
            // wall jumps and sliding are allowed, wish I had an animation
            // for this to make it seem more intentional
            if (gameObject instanceof Phaser.Physics.Matter.TileBody) {
                if (this.stateMachine.isCurrentState('jump')) {
                    this.stateMachine.setState('idle');
                }
                return;
            }

            // get data from Tiles obstacles that have it, emit and event for
            // player and ui, then destroy them
            const sprite = gameObject as Phaser.Physics.Matter.Sprite;
            const type = sprite.getData('type');

            switch (type) {
                case 'coin': {
                    events.emit('coin-collected');
                    sprite.destroy();
                    break;
                }
                case 'health': {
                    const value = sprite.getData('healthPoints') ?? 25;
                    this.health = Phaser.Math.Clamp(this.health + value, 0, 100);
                    events.emit('health-changed', this.health);
                    sprite.destroy();
                    break;
                }
            }
        });
    }

    // update based on delta time
    update(deltaTime: number) {
        this.stateMachine.update(deltaTime);
    }

    // clamp health to 0-100
    // emit event for UI healthbar
    private setHealth(value: number) {
        this.health = Phaser.Math.Clamp(value, 0, 100);

        events.emit('health-changed', this.health);
        if (this.health <= 0) {
            this.stateMachine.setState('dead');
        }
    }

    // movement and jump states
    private idleOnEnter() {
        this.sprite.play('player-idle');
    }

    private idleOnUpdate() {
        if (this.cursors.left.isDown || this.cursors.right.isDown) {
            this.stateMachine.setState('walk');
        }   

        const spacebarJustDown = Phaser.Input.Keyboard.JustDown(this.cursors.space);
        if (spacebarJustDown) {
            this.stateMachine.setState('jump')
        }
    }

    private walkOnEnter() {
        this.sprite.play('player-walk');
    }

    private walkOnUPdate() {
        const speed = 10;

        if (this.cursors.left.isDown) {
            this.sprite.flipX = true;
            this.sprite.setVelocityX(-speed);
        }   
        else if (this.cursors.right.isDown) {
            this.sprite.flipX = false;
            this.sprite.setVelocityX(speed);
        }
        else {
            this.sprite.setVelocityX(0);
            this.stateMachine.setState('idle');
        }
            
        const spacebarJustDown = Phaser.Input.Keyboard.JustDown(this.cursors.space);
        if (spacebarJustDown) {
            this.stateMachine.setState('jump')
        }
    }

    private jumpOnEnter() {
        this.sprite.play('player-jump');
        this.sprite.setVelocityY(-15);
    }

    private jumpOnUpdate() {
        const speed = 10;

        if (this.cursors.left.isDown) {
            this.sprite.flipX = true;
            this.sprite.setVelocityX(-speed);
        }   
        else if (this.cursors.right.isDown) {
            this.sprite.flipX = false;
            this.sprite.setVelocityX(speed);
        }
        else {
            this.sprite.setVelocityX(0);
        }
    }

    // spike collision
    // when hit: bounce up, tween red color change, go to idle, take damage
    private spikeHitOnEnter() {
        this.sprite.setVelocityY(-10);

        const startColor = Phaser.Display.Color.ValueToColor(0xffffff);
        const endColor = Phaser.Display.Color.ValueToColor(0xff0000);
        this.scene.tweens.addCounter( {
            from: 0,
            to: 100,
            duration: 100,
            repeat: 2,
            yoyo: true,
            ease: Phaser.Math.Easing.Sine.InOut,
            onUpdate: tween => {
                const value = tween.getValue();
                const colorObject = Phaser.Display.Color.Interpolate.ColorWithColor(
                    startColor,
                    endColor,
                    100,
                    value
                );

                const color = Phaser.Display.Color.GetColor(
                    colorObject.r,
                    colorObject.g,
                    colorObject.b
                );

                this.sprite.setTint(color);
            }
        })

        this.stateMachine.setState('idle');

        this.setHealth(this.health - 25);

    }

    // damage enemy collision (recycled beeHit for frog and saw, could stand to rename)
    // when hit: bounce, tween red color change, go to idle, take damage
    // if enemy hits player, bounce player in the direction the
    // enemy was moving instead of bouncing up like spikes
    private beeHitOnEnter() {
        if (this.lastBeeHit) {
            if (this.sprite.x < this.lastBeeHit.x) {
                this.sprite.setVelocityX(-20);
            }
            else {
                this.sprite.setVelocityX(20);
            }
        }
        else {
            this.sprite.setVelocityY(-20);
        }

        const startColor = Phaser.Display.Color.ValueToColor(0xffffff);
        const endColor = Phaser.Display.Color.ValueToColor(0xff0000);
        this.scene.tweens.addCounter( {
            from: 0,
            to: 100,
            duration: 100,
            repeat: 2,
            yoyo: true,
            ease: Phaser.Math.Easing.Sine.InOut,
            onUpdate: tween => {
                const value = tween.getValue();
                const colorObject = Phaser.Display.Color.Interpolate.ColorWithColor(
                    startColor,
                    endColor,
                    100,
                    value
                );

                const color = Phaser.Display.Color.GetColor(
                    colorObject.r,
                    colorObject.g,
                    colorObject.b
                );

                this.sprite.setTint(color);
            }
        })

        this.stateMachine.setState('idle');

        this.setHealth(this.health - 25);
    }

    // defeat enemy collision (recycled beeHit for frog and saw, could stand to rename)
    // when hit: bounce, emit event for enemy controller, go to idle
    private beeStompOnEnter() {
        this.sprite.setVelocityY(-10);

        events.emit('bee-stomped', this.lastBeeHit)
        events.emit('frog-stomped', this.lastBeeHit)
        events.emit('saw-stomped', this.lastBeeHit)

        this.stateMachine.setState('idle');
    }

    // player death on no health
    // play anim, NoOp to turn off collisions
    // delay to watch death anim, then emit reset event for UI
    // and go to game over scene
    private deadOnEnter() {
        this.sprite.play('player-dead');

        // NoOp
        this.sprite.setOnCollide(() => {});

        this.scene.time.delayedCall(1500, () => {
            events.emit('reset-game');
            this.scene.scene.start('game-over');
        })
    }

    // creates move, idle, jump, and death animations
    private createAnims() {
        this.sprite.anims.create({
            key: 'player-idle',
            frames: [{ key: 'monkey', frame: 'monkey_idle.png'}]
        });

        this.sprite.anims.create({
            key: 'player-walk',
            frameRate: 10,
            frames: this.sprite.anims.generateFrameNames('monkey', { 
                start: 1, 
                end: 8,
                prefix: 'monkey_run_',
                suffix: '.png'
            }),
            repeat: -1
        });

        this.sprite.anims.create({
            key: 'player-jump',
            frameRate: 10,
            frames: this.sprite.anims.generateFrameNames('monkey', { 
                start: 1, 
                end: 4,
                prefix: 'monkey_jump_',
                suffix: '.png'
            })
        });

        this.sprite.anims.create({
            key: 'player-dead',
            frames: [{ key: 'monkey', frame: 'monkey_dead.png'}]
        });
    }
}