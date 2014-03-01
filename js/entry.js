var game = new Phaser.Game(800, 600, Phaser.CANVAS, '');
game.state.add('boot', Boot);
game.state.add('preloader', PreLoader);
game.state.add('main', MainState);
game.state.start('boot');