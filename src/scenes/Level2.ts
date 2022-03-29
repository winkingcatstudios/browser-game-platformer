import { Vertices } from 'matter';
import Phaser, { Physics } from 'phaser'
import FrogController from '~/scripts/FrogController';
import ObstaclesController from '~/scripts/ObstaclesController';
import PlayerController from '../scripts/PlayerController';

export default class Level2 extends Phaser.Scene {

    // class variables
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private player?: Phaser.Physics.Matter.Sprite;
    private playerController?: PlayerController;
    private obstaclesController!: ObstaclesController;
    private frogs: FrogController[] = [];

    constructor() {
		super('level2');
	}

    init() {
        // inputs (arrows to move, space to jump)
        this.cursors = this.input.keyboard.createCursorKeys();

        // instantiate class vars
        this.obstaclesController = new ObstaclesController();
        this.frogs = [];

        // clean up event
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.destroy();
        });
        console.log(this.matter.bodies)
    }

	preload() {
        // sprite atlases
        this.load.atlas('monkey', 'assets/monkey.png', 'assets/monkey.json');
        this.load.atlas('frog', 'assets/frog.png', 'assets/frog.json');

        // images
        this.load.image('groundTiles', 'assets/spritesheet_ground.png');
        this.load.image('propTiles', 'assets/spritesheet_props.png');
        this.load.image('sky', 'assets/sky.png');
        this.load.image('coin', 'assets/coinGold.png');
        this.load.image('health', './assets/hudHeart_full.png');

        // Tiled tilemap
        this.load.tilemapTiledJSON('tilemap2', 'assets/map2.json');
    }

    create() {
        // launch UI, do this each level in case I add level transition scenes
        this.scene.launch('ui');

        // scene scale
        const { width, height } = this.scale;

        // draw background image first and scale it up
        let back = this.add.image(0, 0, 'sky');
        back.scaleY = 8;
        back.scaleX = 30;

        // level 2 tilemap
        const map2 = this.make.tilemap({ key: 'tilemap2' });
        const groundTiles = map2.addTilesetImage('ground', 'groundTiles');
        const propTiles = map2.addTilesetImage('props', 'propTiles');
        const ground = map2.createLayer('ground', groundTiles);
        ground.setCollisionByProperty({ collides: true });     
        
        // cycle over object layer to spawn sprites
        map2.createLayer('obstacles', propTiles);
        const objectsLayer = map2.getObjectLayer('objects');
        objectsLayer.objects.forEach(objData => {
            const { x = 0, y = 0, name, width = 0, height = 0 } = objData;

            switch (name) {
                case 'player-spawn': {
                    this.player = this.matter.add.sprite(x + (width * 0.5), y!, 'monkey', undefined, {
                        vertices: [{ x: 50, y: 1 }, { x: 150, y: 1 }, { x: 150, y: 150 }, { x: 50, y: 150 }]
                    })
                        .setFixedRotation();

                    this.playerController = new PlayerController(
                        this,
                        this.player, 
                        this.cursors,
                        this.obstaclesController
                        );

                    this.cameras.main.startFollow(this.player, true);
                    this.cameras.main.setZoom(0.55);
                    break;
                }
                case 'frog-spawn': {
                    const frog = this.matter.add.sprite(x + (width * 0.5), y + (height * 0.5), 'frog', undefined, {
                        vertices: [{ x: 1, y: 1 }, { x: 120, y: 1 }, { x: 120, y: 120 }, { x: 1, y: 120 }],
                    })
                        .setFixedRotation()

                    this.frogs.push(new FrogController(this, frog));

                    this.obstaclesController.add('frog', frog.body as MatterJS.BodyType);
                    break;
                }
                case 'coin': {
                    const coin = this.matter.add.sprite(x + (width * 0.5), y + (height * 0.5), 'coin', undefined, {
                        vertices: [{ x: 1, y: 1 }, { x: 80, y: 1 }, { x: 80, y: 80 }, { x: 1, y: 80 }],
                        isStatic: true,
                        isSensor: true
                    });

                    coin.setData('type', 'coin');
                    break;
                }
                case 'health': {
                    const health = this.matter.add.sprite(x, y, 'health', undefined, {
                        vertices: [{ x: 1, y: 1 }, { x: 100, y: 1 }, { x: 100, y: 100 }, { x: 1, y: 100 }],
                        isStatic: true,
                        isSensor: true
                    });

                    health.setData('type', 'health');
                    health.setData('healthPoints', 25);
                    break;
                }
                case 'spikes': {
                    const spike = this.matter.add.rectangle(x + (width * 0.5), y + (height * 0.5), width, height, {
                        isStatic: true
                    });
                    this.obstaclesController.add('spikes', spike);
                    break;
                }
            }
        })
        this.matter.world.convertTilemapLayer(ground);
    }

    // destructor for enemies and ui
    destroy() {
        this.scene.stop('ui');
        this.frogs.forEach(frog => frog.destroy());
    }

    // update player and enemies
    update(time: number, deltaTime: number) {
        this.playerController?.update(deltaTime);
        
        this.frogs.forEach(frog => frog.update(deltaTime));
    }
}
