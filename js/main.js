var game = new Phaser.Game(800, 600, Phaser.CANVAS, '', { preload: preload, create: create, update: update });
var best_score;
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
	// checking best score
	best_score = Cookies.get('best');
	if (typeof best_score == 'undefined') {
		best_score = 0;
		Cookies.set('best', String(best_score));
	} else {
		// it is a string if exists
		best_score = parseInt(best_score);
	}
}
var bird;
var land;
var sky;
var pipes; // this is a group of pipe sprites
var score_board;
function create() {
	var window_width = game.width;
	var window_height = game.height;
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
	counting_score_gui = game.add.group();
	// define position of this gui element
	counting_score_gui.x = 10;
	counting_score_gui.y = 10;
	var SCORE_BOARD_WIDTH = 236;
	var SCORE_BOARD_HEIGHT = 280;
	// create a score board group with replay button
	score_board = game.add.group()
	// set the position to be one screen above the current window
	score_board.y = -window_height;
	score_board.create((window_width - SCORE_BOARD_WIDTH) / 2, (window_height - SCORE_BOARD_HEIGHT) / 2, 'score_board');
	// add replay button
	var REPLAY_BUTTON_WIDTH = 115;
	var REPLAY_BUTTON_HEIGHT = 70;
	var replay_button = game.add.button(
		(window_width - REPLAY_BUTTON_WIDTH) / 2, 
		(window_height - REPLAY_BUTTON_HEIGHT + SCORE_BOARD_HEIGHT) / 2,
		'replay_button', 
		// clicking callback function
		function() {
			// bring up the board
			score_board.bring_up.start();
			// restart the game
			startGame();
		}
	);
	score_board.add(replay_button);
	// add score
	var BEST_SCORE_X = 180 + (window_width - SCORE_BOARD_WIDTH) / 2;
	var BEST_SCORE_Y = 150 + (window_height - SCORE_BOARD_HEIGHT) / 2;
	var best_score_gui = game.add.group();
	best_score_gui.x = BEST_SCORE_X;
	best_score_gui.y = BEST_SCORE_Y;
	score_board.add(best_score_gui);

	var CUR_SCORE_X = BEST_SCORE_X;
	var CUR_SCORE_Y = BEST_SCORE_Y - 42;
	var cur_socre_gui = game.add.group();
	cur_socre_gui.x = CUR_SCORE_X;
	cur_socre_gui.y = CUR_SCORE_Y;
	score_board.add(cur_socre_gui);
	// add tweens of the board moving
	var tween_down_board = game.add.tween(score_board).to({ y: 0 });
	tween_down_board.onStart.add(function() {
		// display score
		displayCount(best_score_gui, best_score);
		displayCount(cur_socre_gui, count);			
	}, this);
	var tween_up_board = game.add.tween(score_board).to({ y: -window_height }, 500);
	// set properties
	score_board.bring_down = tween_down_board;
	score_board.bring_up = tween_up_board;
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
			if (bird.y < game.height - land.height) {
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
				displayCount(counting_score_gui, count);
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
	var pipe = createPipe(0, game.height - land.height);
	pipe.x = -pipes.x + game.width;
	pipes.add(pipe);
}

var count;
var counting_score_gui;
function displayCount(gui_element, value) {
	// clear gui element
	gui_element.removeAll();
	// a stack to hold all digit, with lowest in the bottom.
	var nums = [];
	do {
		nums.push(value % 10);
		value = Math.floor(value / 10);
	} while(value);
	var FONT_SMALL_WIDTH = 12;
	var font_small_padding = 3;
	var font_small_x = 0;
	while(nums.length) {
		gui_element.add(game.add.sprite(font_small_x, 0, 'font_small_' + nums.pop()));
		font_small_x += (FONT_SMALL_WIDTH + font_small_padding);
	}
}

function startGame() {
	// refresh the count
	count = 0;
	// display count with small digits
	displayCount(counting_score_gui, count);		
	// reposition
	bird.x = 80;
	bird.y = (game.height - land.height) / 2;
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
	// checkign score
	best_score = Math.max(best_score, count);
	// set the score cookie
	Cookies.set('best', String(best_score));
	// bring down score board
	score_board.bring_down.start();
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
