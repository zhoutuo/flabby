var game = new Phaser.Game(800, 600, Phaser.CANVAS, '');
game.state.add('main', MainState);
game.state.start('main');