PreLoader = function(game) {

};

PreLoader.prototype = {
	preload: function() {
		// loading screen content
		var loading_bar_cache = this.game.cache.getImage('loading_bar');
		this.game.add.sprite(
			(this.game.width - loading_bar_cache.width) / 2, 
			(this.game.height - loading_bar_cache.height) / 2, 
			'loading_bar'
		);
		// load splash
		this.game.load.image('splash', 'assets/splash.png');
		// load bird sprite sheet, there are four frames whose size is 34 * 24
		this.game.load.spritesheet('bird', 'assets/bird.png', 34, 24, 4);
		// load sky background
		this.game.load.image('sky', 'assets/sky.png');
		// load land background
		this.game.load.image('land', 'assets/land.png');
		// load pipe images
		this.game.load.image('pipe_inner', 'assets/pipe.png');
		// used for pipes facing down
		this.game.load.image('pipe_down', 'assets/pipe-down.png');
		// used for pipes facing up
		this.game.load.image('pipe_up', 'assets/pipe-up.png');
		// used to fill pipe gaps
		this.game.load.image('pipe_filler', 'assets/pipe-filler.png');
		// load small fonts
		for (var i = 0; i < 10; ++i) {
			this.game.load.image('font_small_' + i, 'assets/font_small_' + i + '.png')
		}
		// load big fonts
		for (i = 0; i < 10; ++i) {
			this.game.load.image('font_big_' + i, 'assets/font_big_' + i + '.png')
		}
		// load score board
		this.game.load.image('score_board', 'assets/scoreboard.png');
		// load replay button
		this.game.load.image('replay_button', 'assets/replay.png');
		// music loading
		this.game.load.audio('sfx_wing', 'assets/sounds/sfx_wing.ogg');
		this.game.load.audio('sfx_hit', 'assets/sounds/sfx_hit.ogg');
		this.game.load.audio('sfx_die', 'assets/sounds/sfx_die.ogg');
		this.game.load.audio('sfx_point', 'assets/sounds/sfx_point.ogg');
		// medal loading
		this.game.load.image('medal_bronze', 'assets/medal_bronze.png');
		this.game.load.image('medal_silver', 'assets/medal_silver.png');
		this.game.load.image('medal_gold', 'assets/medal_gold.png');
		this.game.load.image('medal_platinum', 'assets/medal_platinum.png');
	},
	create: function() {
		this.game.state.start('main');
	}
}