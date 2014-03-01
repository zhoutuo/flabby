Boot = function(game) {

};

Boot.prototype = {
	preload: function() {
		// load loading bar
		this.game.load.image('loading_bar', 'assets/loading_bar.png');
	},
	create: function() {
		//  Unless you specifically need to support multitouch I would recommend setting this to 1
		this.game.input.maxPointers = 1;
        //  Phaser will automatically pause if the browser tab the game is in loses focus. You can disable that here:
		this.game.disableVisibilityChange = true;
		// enter the next state
		this.game.state.start('preloader');
	}
};