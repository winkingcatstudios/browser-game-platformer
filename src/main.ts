import Phaser from 'phaser'

import Start from './scenes/Start'
import Level1 from './scenes/Level1'
import Level2 from './scenes/Level2'
import Level3 from './scenes/Level3'
import UI from './scenes/UI'
import GameOver from './scenes/GameOver'
import Win from './scenes/Win'

const config: Phaser.Types.Core.GameConfig = {
	type: Phaser.AUTO,
	width: 800,
	height: 600,
	physics: {
		default: 'matter',
		matter: {
			debug: true	// set to true to see colliders and sprite bounderies 
		}
	},
	scene: [Start, Level1, Level2, Level3, UI, GameOver, Win]
}

export default new Phaser.Game(config)
