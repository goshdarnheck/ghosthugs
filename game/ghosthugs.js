$(function() {
  // BIG TIME USEFUL VARIABLES
  var winW = $(window).width();
  var winH = $(window).height();

  // EMITTERS
  var starEmitter;

  // PLAYER
  var player;
  var playerSpeed = 5;

  // BADDIES
  var baddieTypes = [
    {
      'color': 0xff0000,
      'effect': 'tiny'
    },
    {
      'color': 0x00ff00,
      'effect': 'big'
    },
    {
      'color': 0x0000ff,
      'effect': 'big'
    },
    {
      'color': 0x00ffff,
      'effect': 'big'
    },
    {
      'color': 0xffff00,
      'effect': 'big'
    },
    {
      'color': 0xff00ff,
      'effect': 'small'
    },
    {
      'color': 0xff9900,
      'effect': 'small'
    },
    {
      'color': 0xff0099,
      'effect': 'big'
    },
    {
      'color': 0x0099ff,
      'effect': 'big'
    },
    {
      'color': 0x9900ff,
      'effect': 'big'
    }
  ];

  // CREATE THE GAME
  var game = new Phaser.Game(winW, winH, Phaser.AUTO, 'game', { preload: preload, create: create, update: update});

  // LOAD ASSETS
  function preload() {
    game.load.image('ghostshugging', 'game/sprites/ghostshugging.png');
    game.load.image('ghost', 'game/sprites/ghost.png');
    game.load.image('spark', 'game/sprites/spark.png');
  }

  // RUNS WHEN THE GAME STARTS
  function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    
    game.stage.backgroundColor = '#0072bc';
    
    // LOGO SETUP
    logo = game.add.sprite(game.world.centerX, game.world.centerY, 'ghostshugging');
    logo.smoothed = false;
    logo.anchor.set(0.5);
    logo.scale.set(2);
    
    // EMITTER SETUP
    starEmitter = game.add.emitter(0, 0, 30);
    starEmitter.makeParticles('spark');
    starEmitter.gravity = 0;
    starEmitter.forEach(function(particle) {
      particle.smoothed = false;
      particle.tint = Math.random() * 0xffff00;
    });
    starEmitter.minParticleScale = 0.5;
    starEmitter.maxParticleScale = 3;
    
    // PLAYER SETUP
    player = game.add.sprite(200, 200, 'ghost');
    player.anchor.set(0.5);
    player.smoothed = false;
    player.goal = false;
    game.physics.enable(player, Phaser.Physics.ARCADE);
    player.body.immovable = true;
    
    // BADDIES SETUP
    baddies = game.add.group();
    for (var i = 0; i < 40; i++) {
      var baddieType = game.rnd.integerInRange(0, baddieTypes.length - 1);
      var baddie = baddies.create(game.rnd.integerInRange(10, winW - 10), game.rnd.integerInRange(10, winH - 10), 'ghost');
      baddie.smoothed = false;
      baddie.tint = baddieTypes[baddieType].color;
      game.physics.enable(baddie, Phaser.Physics.ARCADE);
      baddie.body.immovable = true;
      baddie.effect = baddieTypes[baddieType].effect;
      baddie.randomDestinationCounter = 0;
    }
  }

  function particleBurst() {
    starEmitter.x = player.x
    starEmitter.y = player.y
    starEmitter.start(true, 3000, null, 10);
  }

  // BIG GAME LOOP
  function update() {
    if (game.input.keyboard.isDown(Phaser.Keyboard.LEFT) && player.x - player.width / 2 - 1 > 0) {
      player.x -= playerSpeed;
    } else if (game.input.keyboard.isDown(Phaser.Keyboard.RIGHT) && player.x + player.width / 2 + 1  < game.width) {
      player.x += playerSpeed;
    }
    
    if (game.input.keyboard.isDown(Phaser.Keyboard.UP) && player.y - player.height / 2 -1 > 0) {
      player.y -= playerSpeed;
    } else if (game.input.keyboard.isDown(Phaser.Keyboard.DOWN) && player.y + player.height / 2 + 1 < game.height) {
      player.y += playerSpeed;
    }
    
    baddies.forEachAlive(baddieUpdate, this);  //make bullets accelerate to ship
    
    if (player.scale.x == 10 && player.goal == false) {
      player.goal = true;
      
      logo.scale.x = Math.min(logo.scale.x + 1, 30);
      logo.scale.y = Math.min(logo.scale.y + 1, 30);
      
      particleBurst();
    }
    
    starEmitter.forEachAlive(function(p){
      p.alpha= p.lifespan / starEmitter.lifespan;
    });
  }

  function playerBaddieOverlap(player, baddie) {
    baddie.kill();

    switch (baddie.effect) {
      case 'small':
        player.scale.x = Math.max(player.scale.x - 1, 1);
        player.scale.y = Math.max(player.scale.y - 1, 1);
        break;
      case 'big':
        player.scale.x = Math.min(player.scale.x + 1, 10);
        player.scale.y = Math.min(player.scale.y + 1, 10);
        break;
      case 'tiny':
        player.scale.x = 1;
        player.scale.y = 1;
        player.goal = false;
        break;
    }
    
    var recycledBaddie = baddies.getFirstDead();
    var recycledBaddieType = game.rnd.integerInRange(0, baddieTypes.length - 1);
    recycledBaddie.reset(game.rnd.integerInRange(10, winW - 10), game.rnd.integerInRange(10, winH - 10), 1);
    recycledBaddie.tint = baddieTypes[recycledBaddieType].color;
    recycledBaddie.effect = baddieTypes[recycledBaddieType].effect;
  }

  function baddieUpdate(baddie) {
    var randomMovement = (game.rnd.integerInRange(0, 100) > 99) ? true : false;
    
    if (baddie.x >= baddie.xDest - 10 && baddie.x <= baddie.xDest + 10 &&
      baddie.y >= baddie.yDest - 10 && baddie.y <= baddie.yDest + 10) {
      baddie.randomDestinationCounter = 0;
      randomMovement = false;
    }
    
    if (baddie.randomDestinationCounter > 0) {
      baddie.randomDestinationCounter--;
      
      game.physics.arcade.moveToXY(baddie, baddie.xDest, baddie.yDest, 120, 0);
    } else if (randomMovement) {
      baddie.randomDestinationCounter = game.rnd.integerInRange(100, 400);
      baddie.xDest = game.rnd.integerInRange(10, winW - 10);
      baddie.yDest = game.rnd.integerInRange(10, winH - 10);
      
      game.physics.arcade.moveToXY(baddie, baddie.xDest, baddie.yDest, 120, 0);
    } else {
      game.physics.arcade.moveToObject(baddie, player, 120, false);
    }
    
    game.physics.arcade.overlap(player, baddie, playerBaddieOverlap, null, this);
  }

  // FOR RESIZING THE SCREEN
  $(window).resize(function() {
    resizeGame();
  });

  function resizeGame() {
    var height = $(window).height();
    var width = $(window).width();
    
    game.width = width;
    game.height = height;
    game.stage.bounds.width = width;
    game.stage.bounds.height = height;
    
    if (game.renderType === Phaser.WEBGL) {
      game.renderer.resize(width, height);
    }
    
    if (player.x > game.width) {
      player.x = width - player.width / 2 + 2;
    }
    
    if (player.y > game.height) {
      player.y = height - player.height / 2 + 2;
    }
    
    logo.x = Math.round(game.width / 2);
    logo.y = Math.round(game.height / 2);
  }
});