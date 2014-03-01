MainState = function(game) {
	// variable declaration

	// SECTION: SPRITES
	this.bird;
	this.land;
	this.sky;
	this.pipes; // this is a group of pipe sprites
	this.score_board;
	this.counting_score_gui;


	// SECTION: DATA
	// Best score of games, which will be stored and retrived from a Cookie
	this.best_score;
	// count of pipes passed in current game
	this.count;
	// current state of the game
	this.internal_state;
	this.STATES = {
		SPLASH: 0,
		GAME: 1,
		END: 2
	}
	// loop event of producing pipes limitelessly
	this.pipeProduction;
};
MainState.prototype = {
	preload: function() {
		// checking best score
		this.best_score = Cookies.get('best');
		if (typeof this.best_score == 'undefined') {
			this.best_score = 0;
			Cookies.set('best', String(this.best_score));
		} else {
			// it is a string if exists
			this.best_score = parseInt(this.best_score);
		}
	},
	create: function() {
		var window_width = this.game.width;
		var window_height = this.game.height;
		// set up the background
		this.game.stage.backgroundColor = '#4EC0CA';
		// set land sprite and collision
		var LAND_HEIGHT = 112; // based on sprite size
		this.land = this.game.add.tileSprite(0, window_height - LAND_HEIGHT, window_width, LAND_HEIGHT, 'land');
		this.land.body.immovable = true;
		// width, height, translateX, translateY
		this.land.body.setRectangle(window_width, LAND_HEIGHT, 0, 0);
		var SKY_HEIGHT = 109; // based on sprite size
		this.sky = this.game.add.tileSprite(0, window_height - LAND_HEIGHT - SKY_HEIGHT, window_width, SKY_HEIGHT, 'sky');
		// create our beloved bird character in the scene
		this.bird = this.game.add.sprite(80, (window_height - LAND_HEIGHT) / 2, 'bird');
		// set the anchor to the center of the bird
		this.bird.anchor.setTo(0.5, 0.5);
		// add an animation called flap, which will use all four frames in the sheet
		this.bird.animations.add('flap');
		// set up physics
		this.bird.body.gravity.y = 600;
		this.bird.body.collideWorldBounds = true;
		// set up flapping button
		var fly_up = function() {
			if (this.internal_state == this.STATES.GAME) {
				var sfx_wing = this.game.add.audio('sfx_wing');
				sfx_wing.play();
				this.bird.body.velocity.y = -300;
			}
		};
		// spacebar
		var spacebar = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
		spacebar.onDown.add(fly_up, this);
		// add a pointer down support(mouse click or touch screen tap) as well
		this.game.input.onDown.add(fly_up, this);
		// create a new group, which would holds all created pipes
		this.pipes = this.game.add.group();
		// a group to hold all digits
		this.counting_score_gui = this.game.add.group();
		// define position of this gui element
		this.counting_score_gui.x = 10;
		this.counting_score_gui.y = 10;
		var SCORE_BOARD_WIDTH = 236;
		var SCORE_BOARD_HEIGHT = 280;
		// create a score board group with replay button
		this.score_board = this.game.add.group()
		// set the position to be one screen above the current window
		this.score_board.y = -window_height;
		this.score_board.create((window_width - SCORE_BOARD_WIDTH) / 2, (window_height - SCORE_BOARD_HEIGHT) / 2, 'score_board');
		// add replay button
		var REPLAY_BUTTON_WIDTH = 115;
		var REPLAY_BUTTON_HEIGHT = 70;
		var replay_button = this.game.add.button(
			(window_width - REPLAY_BUTTON_WIDTH) / 2, (window_height - REPLAY_BUTTON_HEIGHT + SCORE_BOARD_HEIGHT) / 2,
			'replay_button',
			// clicking callback function
			function() {
				// bring up the board
				this.score_board.bring_up.start();
				// restart the game
				this.startGame();
			},
			this
		);
		this.score_board.add(replay_button);
		// add score
		var BEST_SCORE_X = 180 + (window_width - SCORE_BOARD_WIDTH) / 2;
		var BEST_SCORE_Y = 150 + (window_height - SCORE_BOARD_HEIGHT) / 2;
		var best_score_gui = this.game.add.group();
		best_score_gui.x = BEST_SCORE_X;
		best_score_gui.y = BEST_SCORE_Y;
		this.score_board.add(best_score_gui);

		var CUR_SCORE_X = BEST_SCORE_X;
		var CUR_SCORE_Y = BEST_SCORE_Y - 42;
		var cur_score_gui = this.game.add.group();
		cur_score_gui.x = CUR_SCORE_X;
		cur_score_gui.y = CUR_SCORE_Y;
		this.score_board.add(cur_score_gui);
		// add medal
		var MEDAL_X = 32 + (window_width - SCORE_BOARD_WIDTH) / 2;
		var MEDAL_Y = 112 + (window_height - SCORE_BOARD_HEIGHT) / 2;
		var medal_gui = this.game.add.group();
		medal_gui.x = MEDAL_X;
		medal_gui.y = MEDAL_Y;
		this.score_board.add(medal_gui);
		// add tweens of the board moving
		var tween_down_board = this.game.add.tween(this.score_board).to({
			y: 0
		});
		tween_down_board.onStart.add(function() {
			// display score
			this.displayCount(best_score_gui, this.best_score);
			this.displayCount(cur_score_gui, this.count);
			// display medal
			medal_gui.removeAll();
			if (this.count >= 100) {
				medal_gui.create(0, 0, 'medal_platinum');
			} else if (this.count >= 50) {
				medal_gui.create(0, 0, 'medal_gold');
			} else if (this.count >= 20) {
				medal_gui.create(0, 0, 'medal_silver');
			} else if (this.count >= 10){
				medal_gui.create(0, 0, 'medal_bronze');
			}
		}, this);
		var tween_up_board = this.game.add.tween(this.score_board).to({
			y: -window_height
		}, 500);
		// set properties
		this.score_board.bring_down = tween_down_board;
		this.score_board.bring_up = tween_up_board;
		// start the game
		this.startGame();
	},
	update: function() {
		if (this.internal_state == this.STATES.GAME) {
			// move background tiles
			this.land.tilePosition.x -= 2;
			this.sky.tilePosition.x -= 2;
			// move pipes
			this.pipes.x -= 2;
			// update the rotation of each frame
			this.bird.angle = Math.min(this.bird.body.velocity.y / 3, 90);
			// collision
			this.game.physics.collide(this.bird, this.land, this.endGame, function(bird, land) {
				// this is a hack, supposingly we do not need this,
				// this if the bird's position is higher than the land
				// they should not collide
				// however there maybe a cache issue, the position used in the
				// collision detection is not up-to-date.
				if (bird.y < this.game.height - land.height) {
					return false;
				} else {
					return true;
				}
			}, this);
			// this fucntion must go before the collide function below
			// since without deleting the filler first after checking overlapping
			// there would be collision between filler and bird
			this.game.physics.overlap(this.bird, this.pipes, function(obj1, obj2) {
				if (obj2.key == 'pipe_filler') {
					// destroy the filler which is not needed anymore
					obj2.destroy();
					// increase the count
					++this.count;
					// play sound
					var sfx_point = this.game.add.audio('sfx_point');
					sfx_point.play();
					// update the display
					this.displayCount(this.counting_score_gui, this.count, true);
				}
			}, null, this);
			this.game.physics.collide(
				// object 1
				this.bird,
				// object 2, which is a group
				this.pipes,
				// collision handler
				this.endGame,
				null,
				this
			);
		} else if (this.internal_state == this.STATES.END) {
			// still need to collision here without handler
			this.game.physics.collide(this.bird, this.land, function() {
				// stop flaping when hit the ground
				this.bird.animations.stop('flap');
			}, null, this);
			// update the rotation of each frame
			this.bird.angle = Math.min(this.bird.body.velocity.y / 3, 90);
		} else {

		}
	}
}

MainState.prototype.producePipes = function() {
	var pipe = this.createPipe(0, this.game.height - this.land.height);
	pipe.x = -this.pipes.x + this.game.width;
	this.pipes.add(pipe);
}

MainState.prototype.displayCount = function(gui_element, value, isBig) {
	// set default argument
	isBig = isBig || false;
	// clear gui element
	gui_element.removeAll();
	// a stack to hold all digit, with lowest in the bottom.
	var nums = [];
	do {
		nums.push(value % 10);
		value = Math.floor(value / 10);
	} while (value);
	var font_string = isBig ? 'font_big_' : 'font_small_';
	var FONT_WIDTH = this.game.cache.getImage(font_string + '0').width;
	var font_padding = 3;
	var font_x = 0;
	while (nums.length) {
		gui_element.add(this.game.add.sprite(font_x, 0, font_string + nums.pop()));
		font_x += (FONT_WIDTH + font_padding);
	}
}

MainState.prototype.startGame = function() {
	// refresh the count
	this.count = 0;
	// display count with big digits
	this.displayCount(this.counting_score_gui, this.count, true);
	// reposition
	this.bird.x = 80;
	this.bird.y = (this.game.height - this.land.height) / 2;
	// stat flapping
	this.bird.animations.play('flap', 10, true);
	// clean pipes
	this.pipes.removeAll();
	this.pipeProduction = this.game.time.events.loop(Phaser.Timer.SECOND * 2, this.producePipes, this);
	// change the this.internal_state
	this.internal_state = this.STATES.GAME;
}

MainState.prototype.endGame = function() {
	this.internal_state = this.STATES.END;
	this.game.time.events.remove(this.pipeProduction);
	// checkign score
	this.best_score = Math.max(this.best_score, this.count);
	// set the score cookie
	Cookies.set('best', String(this.best_score));
	// bring down score board
	this.score_board.bring_down.start();
	// play hit sound
	var sfx_hit = this.game.add.audio('sfx_hit');
	var sfx_die = this.game.add.audio('sfx_die');
	sfx_hit.onStop.add(function() {
		// play dead sound
		sfx_die.play();
	}, this);
	sfx_hit.play();
}

MainState.prototype.createPipe = function(minY, maxY) {
	var pipe_gap = 150;
	var pipe_padding = 80;
	// random a position for pipe down sprite
	// which should take gap into consideration
	// make sure the second value is bigger than first value
	console.assert(minY + pipe_padding < maxY - pipe_gap - pipe_padding);
	var pipe_down_pos = this.getRandomInt(minY + pipe_padding, maxY - pipe_gap - pipe_padding);
	var pipe_up_pos = pipe_down_pos + pipe_gap;
	// create sprites and tile sprites
	var PIPE_INNER_WIDTH = 50;
	// create a group to hold all components
	var pipe = this.game.add.group();
	// upper part
	var pipe_down_inner = this.game.add.tileSprite(0, 0, PIPE_INNER_WIDTH, pipe_down_pos, 'pipe_inner');
	pipe_down_inner.body.immovable = true;
	pipe_down_inner.body.setRectangle(PIPE_INNER_WIDTH, pipe_down_pos, 0, 0);
	var PIPE_DOWN_HEIGHT = 26;
	var pipe_down = this.game.add.sprite(0, pipe_down_pos, 'pipe_down');
	pipe_down.body.immovable = true;
	// filler
	var PIPE_FILLER_WIDTH = 2;
	var pipe_gap_filler = this.game.add.tileSprite(
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
	var pipe_up = this.game.add.sprite(0, pipe_up_pos, 'pipe_up');
	pipe_up.body.immovable = true;
	var pipe_up_inner = this.game.add.tileSprite(
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
MainState.prototype.getRandomInt = function(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}