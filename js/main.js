var window_width = 800;
var window_height = 600;
var game = new Phaser.Game(window_width, window_height, Phaser.CANVAS, '', { preload: preload, create: create, update: update });

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
	// used to fill pipe gaps
	game.load.image('pipe_filler', 'assets/pipe-filler.png');
	// load small fonts
	for(var i = 0; i < 10; ++i) {
		game.load.image('font_small_' + i, 'assets/font_small_' + i + '.png')
	}
	// load score board
	game.load.image('score_board', 'assets/scoreboard.png');
	// load replay button
	game.load.image('replay_button', 'assets/replay.png');
	// music loading
	game.load.audio('sfx_wing', 'assets/sounds/sfx_wing.ogg');
	game.load.audio('sfx_hit', 'assets/sounds/sfx_hit.ogg');
	game.load.audio('sfx_die', 'assets/sounds/sfx_die.ogg');
	game.load.audio('sfx_point', 'assets/sounds/sfx_point.ogg');
}
var bird;
var land;
var sky;
var pipes; // this is a group of pipe sprites
var score_board;
var tween_down_board;
var tween_up_board;
var LAND_HEIGHT;
function create() {
	// set up the background
	game.stage.backgroundColor = '#4EC0CA';
	// set land sprite and collision
	LAND_HEIGHT = 112; // based on sprite size
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
	// set up physics
	bird.body.gravity.y = 600;
	bird.body.collideWorldBounds = true;
	// set up flapping button
	// spacebar
	var spacebar = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
	spacebar.onUp.add(function() {
		if(state == STATES.GAME) {
			var sfx_wing = game.add.audio('sfx_wing');
			sfx_wing.play();
			bird.body.velocity.y = -300;
		}
	}, this);
	// create a new group, which would holds all created pipes
	pipes = game.add.group();
	// a group to hold all digits
	small_digits = game.add.group();
	var SCORE_BOARD_WIDTH = 236;
	var SCORE_BOARD_HEIGHT = 280;
	// create a score board group with replay button
	score_board = game.add.group()
	score_board.create((window_width - SCORE_BOARD_WIDTH) / 2, (-window_height - SCORE_BOARD_HEIGHT) / 2, 'score_board');
	// add replay button
	var REPLAY_BUTTON_WIDTH = 115;
	var REPLAY_BUTTON_HEIGHT = 70;
	var replay_button = game.add.button(
		(window_width - REPLAY_BUTTON_WIDTH) / 2, 
		(-window_height - REPLAY_BUTTON_HEIGHT + SCORE_BOARD_HEIGHT) / 2,
		'replay_button', 
		// clicking callback function
		function() {
			// bring up the board
			tween_up_board.start();
			// restart the game
			startGame();
		}
	);
	score_board.add(replay_button);
	tween_down_board = game.add.tween(score_board).to({ y: window_height });
	tween_up_board = game.add.tween(score_board).to({ y: 0 }, 500);
	// start the game
	startGame();
}

var STATES = {
	SPLASH: 0,
	GAME: 1,
	END: 2
}

var state = STATES.GAME;

function update() {
	if(state == STATES.GAME) {
		// move background tiles
		land.tilePosition.x -= 2;
		sky.tilePosition.x -= 2;
		// move pipes
		pipes.x -= 2;
		// update the rotation of each frame
		bird.angle = Math.min(bird.body.velocity.y / 3, 90);
		// collision
		game.physics.collide(bird, land, endGame, function() {
			// this is a hack, supposingly we do not need this,
			// this if the bird's position is higher than the land
			// they should not collide
			// however there maybe a cache issue, the position used in the
			// collision detection is not up-to-date.
			if (bird.y < window_height - LAND_HEIGHT) {
				return false;
			} else {
				return true;
			}
		});
		// this fucntion must go before the collide function below
		// since without deleting the filler first after checking overlapping
		// there would be collision between filler and bird
		game.physics.overlap(bird, pipes, function(obj1, obj2) {
			if (obj2.key == 'pipe_filler') {
				// destroy the filler which is not needed anymore
				obj2.destroy();
				// increase the count
				++count;
				// play sound
				var sfx_point = game.add.audio('sfx_point');
				sfx_point.play();
				// update the display
				displayCount();
			}		
		});		
		game.physics.collide(
			// object 1
			bird,
			// object 2, which is a group
			pipes,
			// collision handler
			endGame
		);
	} else if (state == STATES.END) {
		// still need to collision here without handler
		game.physics.collide(bird, land, function() {
			// stop flaping when hit the ground
			bird.animations.stop('flap');	
		});
		// update the rotation of each frame
		bird.angle = Math.min(bird.body.velocity.y / 3, 90);		
	} else {

	}
}

var pipeProduction;
function producePipes() {
	var pipe = createPipe(0, window_height - LAND_HEIGHT);
	pipe.x = -pipes.x + window_width;
	pipes.add(pipe);
}

var count;
var small_digits;
function displayCount() {
	// clear small_digits
	small_digits.removeAll();
	// a temporary variable to calculate each digit
	var tmp = count;
	// a stack to hold all digit, with lowest in the bottom.
	var nums = [];
	do {
		nums.push(tmp % 10);
		tmp = Math.floor(tmp / 10);
	} while(tmp);
	var FONT_SMALL_WIDTH = 12;
	var font_small_padding = 3;
	var font_small_x = 10;
	var font_small_y = 10;
	while(nums.length) {
		small_digits.add(game.add.sprite(font_small_x, font_small_y, 'font_small_' + nums.pop()));
		font_small_x += (FONT_SMALL_WIDTH + font_small_padding);
	}
}

function startGame() {
	// refresh the count
	count = 0;
	// display count with small digits
	displayCount();		
	// reposition
	bird.x = 80;
	bird.y = (window_height - LAND_HEIGHT) / 2;
	// stat flapping
	bird.animations.play('flap', 10, true);
	// clean pipes
	pipes.removeAll();
	pipeProduction = game.time.events.loop(Phaser.Timer.SECOND * 2, producePipes, this);
	// change the state
	state = STATES.GAME;
}


function endGame() {
	state = STATES.END;
	game.time.events.remove(pipeProduction);
	// bring down score board
	tween_down_board.start();
	// play hit sound
	var sfx_hit = game.add.audio('sfx_hit');
	var sfx_die = game.add.audio('sfx_die');
	sfx_hit.onStop.add(function() {
		// play dead sound
		sfx_die.play();	
	},this);
	sfx_hit.play();
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
	pipe_down_inner.body.immovable = true;
	pipe_down_inner.body.setRectangle(PIPE_INNER_WIDTH, pipe_down_pos, 0, 0);
	var PIPE_DOWN_HEIGHT = 26;
	var pipe_down = game.add.sprite(0, pipe_down_pos, 'pipe_down');
	pipe_down.body.immovable = true;
	// filler
	var PIPE_FILLER_WIDTH = 2;
	var pipe_gap_filler = game.add.tileSprite(
		PIPE_INNER_WIDTH, 
		pipe_down_pos + PIPE_DOWN_HEIGHT, 
		PIPE_FILLER_WIDTH, 
		pipe_gap, 
		'pipe_filler'
	);
	pipe_gap_filler.body.immovable = true;
	pipe_gap_filler.body.setRectangle(
		PIPE_FILLER_WIDTH,
		pipe_gap,
		0,
		0
	);
	// lower part
	var PIPE_UP_HEIGHT = 26;
	var pipe_up = game.add.sprite(0, pipe_up_pos, 'pipe_up');
	pipe_up.body.immovable = true;
	var pipe_up_inner = game.add.tileSprite(
		0, 
		pipe_up_pos + PIPE_UP_HEIGHT, 
		PIPE_INNER_WIDTH, 
		maxY - pipe_up_pos - PIPE_UP_HEIGHT,
		'pipe_inner'
	);
	pipe_up_inner.body.immovable = true;
	pipe_up_inner.body.setRectangle(
		PIPE_INNER_WIDTH, 
		maxY - pipe_up_pos - PIPE_UP_HEIGHT,
		0,
		0
	);
	// add to group
	pipe.add(pipe_down_inner);
	pipe.add(pipe_down);
	pipe.add(pipe_gap_filler);
	pipe.add(pipe_up);
	pipe.add(pipe_up_inner);
	return pipe;
}


// Returns a random integer between min and max
// Using Math.round() will give you a non-uniform distribution!
function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}
