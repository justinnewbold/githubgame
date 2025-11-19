// Sprint Survivor - Infinite endless runner game mode

import Phaser from 'phaser';
import { gameData } from '../utils/GameData.js';
import SoundManager from '../utils/SoundManager.js';
import ParticleEffects from '../utils/ParticleEffects.js';
import ComboSystem from '../utils/ComboSystem.js';

export default class SprintSurvivorScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SprintSurvivorScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Game state
        this.gameOver = false;
        this.score = 0;
        this.distance = 0;
        this.speed = 300;
        this.maxSpeed = 800;
        this.speedIncrement = 0.5;
        this.obstacles = [];
        this.powerups = [];
        this.lanes = [200, 300, 400]; // 3 lanes
        this.currentLane = 1; // Middle lane

        // Systems
        this.sounds = new SoundManager();
        this.particles = new ParticleEffects(this);
        this.combo = new ComboSystem(this);

        // Background
        this.add.rectangle(0, 0, width, height, 0x0a0a1a).setOrigin(0);
        this.createScrollingBackground();

        // Player
        this.createPlayer();

        // HUD
        this.createHUD();

        // Controls
        this.createControls();

        // Start spawning
        this.startSpawning();
    }

    createScrollingBackground() {
        // Create road lines
        this.roadLines = [];
        for (let i = 0; i < 10; i++) {
            const line = this.add.rectangle(400, i * 80, 4, 40, 0xffffff, 0.5);
            this.roadLines.push(line);
        }
    }

    createPlayer() {
        this.player = this.add.circle(this.lanes[this.currentLane], 450, 20, 0x00aaff);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);

        this.playerIcon = this.add.text(this.lanes[this.currentLane], 450, '🏃', {
            fontSize: '32px'
        }).setOrigin(0.5);
    }

    createControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = {
            left: this.input.keyboard.addKey('A'),
            right: this.input.keyboard.addKey('D'),
            up: this.input.keyboard.addKey('W')
        };

        // Lane switching
        this.input.keyboard.on('keydown-LEFT', () => this.switchLane(-1));
        this.input.keyboard.on('keydown-RIGHT', () => this.switchLane(1));
        this.input.keyboard.on('keydown-A', () => this.switchLane(-1));
        this.input.keyboard.on('keydown-D', () => this.switchLane(1));
        this.input.keyboard.on('keydown-SPACE', () => this.jump());
        this.input.keyboard.on('keydown-W', () => this.jump());
    }

    switchLane(direction) {
        if (this.gameOver) return;

        const newLane = Phaser.Math.Clamp(this.currentLane + direction, 0, this.lanes.length - 1);

        if (newLane !== this.currentLane) {
            this.currentLane = newLane;
            this.sounds.playSound('shoot');

            // Smooth transition
            this.tweens.add({
                targets: [this.player, this.playerIcon],
                x: this.lanes[this.currentLane],
                duration: 150,
                ease: 'Quad.easeOut'
            });
        }
    }

    jump() {
        if (this.gameOver || this.isJumping) return;

        this.isJumping = true;
        this.sounds.playSound('collect');

        // Jump animation
        const originalY = this.player.y;
        this.tweens.add({
            targets: [this.player, this.playerIcon],
            y: originalY - 100,
            duration: 300,
            yoyo: true,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.isJumping = false;
            }
        });
    }

    startSpawning() {
        // Spawn obstacles
        this.obstacleTimer = this.time.addEvent({
            delay: 1500,
            callback: () => this.spawnObstacle(),
            loop: true
        });

        // Spawn power-ups
        this.powerupTimer = this.time.addEvent({
            delay: 3000,
            callback: () => this.spawnPowerup(),
            loop: true
        });
    }

    spawnObstacle() {
        if (this.gameOver) return;

        const types = [
            { emoji: '🐛', name: 'Bug', color: 0xff0000, points: -10 },
            { emoji: '⚠️', name: 'Warning', color: 0xffaa00, points: -15 },
            { emoji: '❌', name: 'Error', color: 0xff0000, points: -20 },
            { emoji: '🔥', name: 'Fire', color: 0xff6600, points: -25 },
            { emoji: '💣', name: 'Bomb', color: 0x000000, points: -50 }
        ];

        const type = Phaser.Utils.Array.GetRandom(types);
        const lane = Phaser.Utils.Array.GetRandom(this.lanes);

        const obstacle = this.add.circle(lane, -50, 25, type.color);
        this.physics.add.existing(obstacle);

        obstacle.icon = this.add.text(lane, -50, type.emoji, {
            fontSize: '40px'
        }).setOrigin(0.5);

        obstacle.obstacleData = {
            type: type,
            lane: lane
        };

        this.obstacles.push(obstacle);
    }

    spawnPowerup() {
        if (this.gameOver) return;

        const types = [
            { emoji: '☕', name: 'Coffee', color: 0xaa6600, points: 50 },
            { emoji: '⭐', name: 'Star', color: 0xffff00, points: 100 },
            { emoji: '💎', name: 'Diamond', color: 0x00ffff, points: 200 },
            { emoji: '🔋', name: 'Battery', color: 0x00ff00, points: 75 }
        ];

        const type = Phaser.Utils.Array.GetRandom(types);
        const lane = Phaser.Utils.Array.GetRandom(this.lanes);

        const powerup = this.add.circle(lane, -50, 20, type.color);
        this.physics.add.existing(powerup);

        powerup.icon = this.add.text(lane, -50, type.emoji, {
            fontSize: '32px'
        }).setOrigin(0.5);

        powerup.powerupData = {
            type: type,
            lane: lane
        };

        this.powerups.push(powerup);
    }

    createHUD() {
        const width = this.cameras.main.width;

        // Score
        this.scoreText = this.add.text(20, 20, 'Score: 0', {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#ffff00',
            fontStyle: 'bold'
        });

        // Distance
        this.distanceText = this.add.text(20, 50, 'Distance: 0m', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#00ff00'
        });

        // Speed
        this.speedText = this.add.text(20, 75, 'Speed: 300', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#00aaff'
        });

        // Back button
        const backBtn = this.add.text(width - 20, 20, '← Menu', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 8, y: 4 }
        }).setOrigin(1, 0);
        backBtn.setInteractive({ useHandCursor: true });
        backBtn.on('pointerdown', () => this.exitToMenu());
        backBtn.on('pointerover', () => backBtn.setStyle({ backgroundColor: '#555555' }));
        backBtn.on('pointerout', () => backBtn.setStyle({ backgroundColor: '#333333' }));
    }

    update(time, delta) {
        if (this.gameOver) return;

        // Increase distance and speed
        this.distance += (this.speed * delta) / 1000;
        this.speed = Math.min(this.maxSpeed, this.speed + this.speedIncrement * (delta / 1000));

        // Update scrolling background
        this.roadLines.forEach(line => {
            line.y += this.speed * (delta / 1000);
            if (line.y > 600) {
                line.y = -40;
            }
        });

        // Update obstacles
        this.updateObstacles(delta);

        // Update power-ups
        this.updatePowerups(delta);

        // Update HUD
        this.scoreText.setText(`Score: ${Math.floor(this.score)}`);
        this.distanceText.setText(`Distance: ${Math.floor(this.distance)}m`);
        this.speedText.setText(`Speed: ${Math.floor(this.speed)}`);

        // Increase score based on distance
        this.score += (this.speed / 100) * (delta / 1000);

        // Adjust spawn rates based on speed
        if (this.speed > 400 && this.obstacleTimer.delay > 1000) {
            this.obstacleTimer.delay = 1000;
        }
        if (this.speed > 600 && this.obstacleTimer.delay > 700) {
            this.obstacleTimer.delay = 700;
        }
    }

    updateObstacles(delta) {
        this.obstacles.forEach((obstacle, index) => {
            if (!obstacle.active) return;

            obstacle.y += this.speed * (delta / 1000);
            if (obstacle.icon) {
                obstacle.icon.setPosition(obstacle.x, obstacle.y);
            }

            // Check collision
            const playerLane = this.lanes[this.currentLane];
            if (Math.abs(obstacle.x - playerLane) < 30 &&
                Math.abs(obstacle.y - this.player.y) < 40 &&
                !this.isJumping) {
                this.hitObstacle(obstacle);
            }

            // Remove if off screen
            if (obstacle.y > 650) {
                if (obstacle.icon) obstacle.icon.destroy();
                obstacle.destroy();
                this.obstacles.splice(index, 1);

                // Bonus for dodging
                this.score += 10;
                this.combo.addHit();
            }
        });
    }

    updatePowerups(delta) {
        this.powerups.forEach((powerup, index) => {
            if (!powerup.active) return;

            powerup.y += this.speed * (delta / 1000);
            if (powerup.icon) {
                powerup.icon.setPosition(powerup.x, powerup.y);
            }

            // Check collection
            const playerLane = this.lanes[this.currentLane];
            if (Math.abs(powerup.x - playerLane) < 30 &&
                Math.abs(powerup.y - this.player.y) < 40) {
                this.collectPowerup(powerup);
            }

            // Remove if off screen
            if (powerup.y > 650) {
                if (powerup.icon) powerup.icon.destroy();
                powerup.destroy();
                this.powerups.splice(index, 1);
            }
        });
    }

    hitObstacle(obstacle) {
        this.sounds.playSound('damage');
        this.cameras.main.shake(200, 0.01);
        this.particles.explosion(obstacle.x, obstacle.y, 0xff0000);

        // Reduce score
        this.score = Math.max(0, this.score + obstacle.obstacleData.type.points);

        // Slow down
        this.speed = Math.max(200, this.speed - 50);

        // Remove obstacle
        if (obstacle.icon) obstacle.icon.destroy();
        obstacle.destroy();

        // Reset combo
        this.combo.resetCombo();

        // Check if game over (hit too many)
        if (this.speed <= 200) {
            this.endGame();
        }
    }

    collectPowerup(powerup) {
        this.sounds.playSound('collect');
        this.particles.collectPowerUp(powerup.x, powerup.y);
        this.particles.floatingText(powerup.x, powerup.y, `+${powerup.powerupData.type.points}`, '#ffff00');

        this.score += powerup.powerupData.type.points;
        this.combo.addHit();

        // Speed boost
        this.speed = Math.min(this.maxSpeed, this.speed + 30);

        // Remove powerup
        if (powerup.icon) powerup.icon.destroy();
        powerup.destroy();
    }

    endGame() {
        if (this.gameOver) return;
        this.gameOver = true;

        if (this.obstacleTimer) this.obstacleTimer.remove();
        if (this.powerupTimer) this.powerupTimer.remove();

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85);
        overlay.setOrigin(0);

        this.add.text(width / 2, height / 2 - 80, '🏁 SPRINT COMPLETE! 🏁', {
            fontSize: '32px',
            fontFamily: 'monospace',
            color: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 - 20, `Final Score: ${Math.floor(this.score)}`, {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#ffff00'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 15, `Distance: ${Math.floor(this.distance)}m`, {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#00aaff'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 45, `Max Speed: ${Math.floor(this.speed)}`, {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#ff00ff'
        }).setOrigin(0.5);

        // Update stats
        gameData.updateStat('sprintSurvivor.gamesPlayed', 1, 'add');
        gameData.updateStat('sprintSurvivor.highScore', Math.floor(this.score), 'max');
        gameData.updateStat('sprintSurvivor.maxDistance', Math.floor(this.distance), 'max');
        gameData.save();

        this.createReturnButton();
    }

    createReturnButton() {
        const btn = this.add.text(400, 500, '[ Return to Menu ]', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5);

        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerdown', () => this.exitToMenu());
        btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#333333' }));
        btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#000000' }));
    }

    exitToMenu() {
        if (this.obstacleTimer) this.obstacleTimer.remove();
        if (this.powerupTimer) this.powerupTimer.remove();
        this.scene.start('MainMenuScene');
    }
}
