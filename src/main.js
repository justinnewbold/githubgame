import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import GitSurvivorScene from './scenes/GitSurvivorScene.js';
import CodeDefenseScene from './scenes/CodeDefenseScene.js';
import PRRushScene from './scenes/PRRushScene.js';
import DevCommanderScene from './scenes/DevCommanderScene.js';
import DebugDungeonScene from './scenes/DebugDungeonScene.js';
import RefactorRaceScene from './scenes/RefactorRaceScene.js';
import SprintSurvivorScene from './scenes/SprintSurvivorScene.js';
import BugBountyScene from './scenes/BugBountyScene.js';
import LegacyExcavatorScene from './scenes/LegacyExcavatorScene.js';
import BossRushScene from './scenes/BossRushScene.js';
import SettingsScene from './scenes/SettingsScene.js';
import StatsScene from './scenes/StatsScene.js';

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [
        BootScene,
        MainMenuScene,
        SettingsScene,
        StatsScene,
        GitSurvivorScene,
        CodeDefenseScene,
        PRRushScene,
        DevCommanderScene,
        DebugDungeonScene,
        RefactorRaceScene,
        SprintSurvivorScene,
        BugBountyScene,
        LegacyExcavatorScene,
        BossRushScene
    ]
};

// Create the game instance
const game = new Phaser.Game(config);

// Expose game globally for debugging (optional)
window.game = game;
