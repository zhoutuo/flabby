var window_width = 800;
var window_height = 600;
var game = new Phaser.Game(window_width, window_height, Phaser.AUTO, '', { preload: preload, create: create, update: update });

function preload() {
	// load bird sprite sheet, there are four frames whose size is 34 * 24
	game.load.spritesheet('bird', 'assets/bird.png', 34, 24, 4);
	// load sky background
	game.load.image('sky', 'assets/sky.png');
	// load land background
	game.load.image('land', 'assets/land.png');
	// load pipe images
	game.load.image('pipe_inner', 'assets/pipe.png');
	// used for pipes facing down
	game.load.image('pipe_down', 'assets/pipe-down.png');
	// used for pipes facing up
	game.load.image('pipe_up', 'assets/pipe-up.png');
}
var bird;
var land;
var sky;
var pipes; // this is a group of pipe sprites
function create() {
	// set up the background
	game.stage.backgroundColor = '#4EC0CA';
	// set land sprite and collision
	var LAND_HEIGHT = 112; // based on sprite size
	land = game.add.tileSprite(0, window_height - LAND_HEIGHT, window_width, LAND_HEIGHT, 'land');
	land.body.immovable = true;
	// width, height, translateX, translateY
	land.body.setRectangle(window_width, LAND_HEIGHT, 0, 0);
	var SKY_HEIGHT = 109; // based on sprite size
	sky = game.add.tileSprite(0, window_height - LAND_HEIGHT - SKY_HEIGHT, window_width, SKY_HEIGHT, 'sky');	
	// create our beloved bird character in the scene
	bird = game.add.sprite(80, (window_height - LAND_HEIGHT) / 2, 'bird');
	// set the anchor to the center of the bird
	bird.anchor.setTo(0.5, 0.5);
	// add an animation called flap, which will use all four frames in the sheet
	bird.animations.add('flap');
	// stat flapping
	bird.animations.play('flap', 10, true);
	// set up physics
	bird.body.gravity.y = 400;
	bird.body.collideWorldBounds = true;
}


function update() {
	// move background tiles
	land.tilePosition.x -= 1;
	sky.tilePosition.x -= 1;
	// update the rotation of each frame
	bird.angle = Math.min(bird.body.velocity.y / 3, 90);
	// use space to flap the bird
	if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
		bird.body.velocity.y = -150;
	}
	// collision
	game.physics.collide(bird, land);
}


function createPipe(minY, maxY) {
	var pipe_gap = 150;
	var pipe_padding = 80;
	// random a position for pipe down sprite
	// which should take gap into consideration
	// make sure the second value is bigger than first value
	console.assert(minY + pipe_padding < maxY - pipe_gap - pipe_padding);
	var pipe_down_pos = getRandomInt(minY + pipe_padding, maxY - pipe_gap - pipe_padding);
	var pipe_up_pos = pipe_down_pos + pipe_gap;
	// create sprites and tile sprites
	var PIPE_INNER_WIDTH = 50;
	// create a group to hold all components
	var pipe = game.add.group();
	// upper part
	var pipe_down_inner = game.add.tileSprite(0, 0, PIPE_INNER_WIDTH, pipe_down_pos, 'pipe_inner');
	var pipe_down = game.add.sprite(0, pipe_down_pos, 'pipe_down');
	// lower part
	var PIPE_UP_HEIGHT = 26;
	var pipe_up = game.add.sprite(0, pipe_up_pos, 'pipe_up');
	var pipe_up_inner = game.add.tileSprite(
			0, 
			pipe_up_pos + PIPE_UP_HEIGHT, 
			PIPE_INNER_WIDTH, 
			maxY - pipe_up_pos - PIPE_UP_HEIGHT,
			'pipe_inner'
		);
	// add to group
	pipe.add(pipe_down_inner);
	pipe.add(pipe_down);
	pipe.add(pipe_up);
	pipe.add(pipe_up_inner);
	return pipe;
}


// Returns a random integer between min and max
// Using Math.round() will give you a non-uniform distribution!
function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}