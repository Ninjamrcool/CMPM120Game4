// Jim Whitehead
// Created: 4/14/2024
// Phaser: 3.70.0
//
// Cubey
//
// An example of putting sprites on the screen using Phaser
// 
// Art assets from Kenny Assets:
// https://kenney.nl/assets/shape-characters
// https://kenney.nl/assets/pixel-platformer-industrial-expansion
// https://kenney.nl/assets/pixel-platformer-blocks
// https://kenney.nl/assets/tiny-dungeon
//
// Sounds from pixabay:
// https://pixabay.com/sound-effects/horror-horror-liquid-splash-352472/
// https://pixabay.com/sound-effects/household-metal-footsteps-14727/
// https://pixabay.com/sound-effects/film-special-effects-metal-clink-415813/
// https://pixabay.com/sound-effects/film-special-effects-jumplanding-398256/
// https://pixabay.com/sound-effects/technology-correct-answer-toy-bi-bling-476370/

// debug with extreme prejudice
"use strict"

// game config
let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: {
        pixelArt: true  // prevent pixel art from getting blurred when scaled
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            gravity: {
                x: 0,
                y: 0
            },
            overlapBias: 4
        }
    },
    width: 1440,
    height: 900,
    scene: [Load, Platformer]
}

var cursors;
const SCALE = 2.0;
var my = {sprite: {}, text: {}, vfx: {}};

const game = new Phaser.Game(config);