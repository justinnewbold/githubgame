// Boss Rush - Fight all bosses back-to-back

import Phaser from 'phaser';
import { gameData } from '../utils/GameData.js';
import SoundManager from '../utils/SoundManager.js';
import ParticleEffects from '../utils/ParticleEffects.js';
import BossManager from '../utils/BossManager.js';

export default class BossRushScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BossRushScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Game state
        this.gameOver = false;
        this.bossIndex = 0;
        this.bossesDefeated = 0;
        this.totalBosses = 10;
        this.score = 0;
        this.playerHealth = 100;
        this.playerMaxHealth = 100;
        this.currentBoss = null;
        this.bullets = [];
        this.difficultyMult = gameData.getDifficultyMultiplier();

        // Systems
        this.sounds = new SoundManager();
        this.particles = new ParticleEffects(this);
        this.bossManager = new BossManager(this);

        // Background
        this.add.rectangle(0, 0, width, height, 0x0a0a1a).setOrigin(0);

        // Create player
        this.createPlayer();

        // HUD
        this.createHUD();

        // Controls
        this.createControls();

        // Spawn first boss
        this.time.delayedCall(1000, () => this.spawnNextBoss());
    }

    createPlayer() {
        this.player = this.add.circle(400, 500, 20, 0x00aaff);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);

        this.playerIcon = this.add.text(400, 500, '👨‍💻', {
            fontSize: '32px'
        }).setOrigin(0.5);

        this.playerSpeed = 250;
        this.fireRate = 300;
        this.lastFired = 0;
    }

    createControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = {
            up: this.input.keyboard.addKey('W'),
            down: this.input.keyboard.addKey('S'),
            left: this.input.keyboard.addKey('A'),
            right: this.input.keyboard.addKey('D')
        };

        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Mouse shooting
        this.input.on('pointerdown', (pointer) => {
            if (!this.gameOver) {
                this.shootAt(pointer.x, pointer.y);
            }
        });
    }

    spawnNextBoss() {
        if (this.bossIndex >= this.totalBosses) {
            this.winGame();
            return;
        }

        // Get boss types in order
        const bossTypes = Object.keys(this.bossManager.getBossTypes());
        const bossId = bossTypes[this.bossIndex % bossTypes.length];

        this.currentBoss = this.bossManager.spawnBoss(bossId);

        if (this.currentBoss) {
            this.enemies = [this.currentBoss];
            this.bossIndex++;

            // Show boss intro
            this.particles.floatingText(400, 250, `BOSS ${this.bossIndex} / ${this.totalBosses}`, '#ff0000', '32px');
        }
    }

    shootAt(targetX, targetY) {
        const now = Date.now();
        if (now - this.lastFired < this.fireRate) return;

        this.lastFired = now;
        this.sounds.playSound('shoot');

        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetX, targetY);

        const bullet = this.add.circle(this.player.x, this.player.y, 5, 0x00ffff);
        this.physics.add.existing(bullet);
        bullet.body.setVelocity(Math.cos(angle) * 600, Math.sin(angle) * 600);

        this.bullets.push(bullet);

        // Auto-remove after 2 seconds
        this.time.delayedCall(2000, () => {
            if (bullet.active) {
                bullet.destroy();
                const idx = this.bullets.indexOf(bullet);
                if (idx > -1) this.bullets.splice(idx, 1);
            }
        });
    }

    update() {
        if (this.gameOver) return;

        // Player movement
        let velocityX = 0;
        let velocityY = 0;

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            velocityX = -this.playerSpeed;
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            velocityX = this.playerSpeed;
        }

        if (this.cursors.up.isDown || this.wasd.up.isDown) {
            velocityY = -this.playerSpeed;
        } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
            velocityY = this.playerSpeed;
        }

        this.player.body.setVelocity(velocityX, velocityY);
        this.playerIcon.setPosition(this.player.x, this.player.y);

        // Auto-fire
        if (this.spaceKey.isDown && this.currentBoss) {
            this.shootAt(this.currentBoss.x, this.currentBoss.y);
        }

        // Update boss
        if (this.currentBoss && this.currentBoss.active) {
            this.updateBoss();
        }

        // Update bullets
        this.updateBullets();

        // Update HUD
        this.updateHUD();
    }

    updateBoss() {
        const data = this.currentBoss.enemyData;

        // Move toward player
        const angle = Phaser.Math.Angle.Between(
            this.currentBoss.x, this.currentBoss.y,
            this.player.x, this.player.y
        );

        this.currentBoss.body.setVelocity(
            Math.cos(angle) * data.speed,
            Math.sin(angle) * data.speed
        );

        // Update label and health bar positions
        if (this.currentBoss.label) {
            this.currentBoss.label.setPosition(this.currentBoss.x, this.currentBoss.y - 50);
        }

        if (this.currentBoss.healthBar) {
            this.currentBoss.healthBar.setPosition(this.currentBoss.x, this.currentBoss.y - 60);
            this.currentBoss.healthBarBg.setPosition(this.currentBoss.x, this.currentBoss.y - 60);

            const healthPercent = data.health / data.maxHealth;
            this.currentBoss.healthBar.width = 120 * healthPercent;
        }

        // Check collision with player
        const dist = Phaser.Math.Distance.Between(
            this.currentBoss.x, this.currentBoss.y,
            this.player.x, this.player.y
        );

        if (dist < 40) {
            this.takeDamage(10);
        }

        // Check if boss defeated
        if (data.health <= 0) {
            this.defeatBoss();
        }
    }

    updateBullets() {
        this.bullets.forEach((bullet, index) => {
            if (!bullet.active) return;

            // Check collision with boss
            if (this.currentBoss && this.currentBoss.active) {
                const dist = Phaser.Math.Distance.Between(
                    bullet.x, bullet.y,
                    this.currentBoss.x, this.currentBoss.y
                );

                if (dist < 40) {
                    this.hitBoss(bullet);
                }
            }
        });
    }

    hitBoss(bullet) {
        if (!this.currentBoss || !this.currentBoss.active) return;

        this.currentBoss.enemyData.health -= 20;

        this.sounds.playSound('hit');
        this.particles.hit(this.currentBoss.x, this.currentBoss.y);

        bullet.destroy();
        const idx = this.bullets.indexOf(bullet);
        if (idx > -1) this.bullets.splice(idx, 1);
    }

    defeatBoss() {
        this.bossesDefeated++;
        this.score += 1000;

        this.sounds.playSound('upgrade');
        this.particles.explosion(this.currentBoss.x, this.currentBoss.y, 0xffff00);
        this.particles.confetti(this.currentBoss.x, this.currentBoss.y);

        // Clean up boss
        if (this.currentBoss.label) this.currentBoss.label.destroy();
        if (this.currentBoss.healthBar) this.currentBoss.healthBar.destroy();
        if (this.currentBoss.healthBarBg) this.currentBoss.healthBarBg.destroy();
        this.currentBoss.destroy();

        this.bossManager.cleanup();
        this.currentBoss = null;

        // Heal player a bit
        this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 20);

        // Spawn next boss
        this.time.delayedCall(2000, () => this.spawnNextBoss());
    }

    takeDamage(amount) {
        this.playerHealth = Math.max(0, this.playerHealth - amount);
        this.sounds.playSound('damage');
        this.cameras.main.shake(100, 0.005);

        if (this.playerHealth <= 0) {
            this.endGame();
        }
    }

    createHUD() {
        // Boss counter
        this.bossText = this.add.text(400, 20, 'Boss: 0 / 10', {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Score
        this.scoreText = this.add.text(20, 20, 'Score: 0', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#ffff00'
        });

        // Health bar
        this.add.text(20, 50, 'Health:', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffffff'
        });

        this.healthBarBg = this.add.rectangle(90, 58, 150, 15, 0x000000);
        this.healthBar = this.add.rectangle(90, 58, 150, 15, 0xff0000);
        this.healthBar.setOrigin(0, 0.5);

        // Back button
        const backBtn = this.add.text(780, 20, '← Menu', {
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

    updateHUD() {
        this.bossText.setText(`Boss: ${this.bossesDefeated} / ${this.totalBosses}`);
        this.scoreText.setText(`Score: ${this.score}`);

        const healthPercent = this.playerHealth / this.playerMaxHealth;
        this.healthBar.width = 150 * healthPercent;
    }

    winGame() {
        this.gameOver = true;

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.9);
        overlay.setOrigin(0);

        this.add.text(width / 2, height / 2 - 80, '👑 BOSS RUSH COMPLETE! 👑', {
            fontSize: '32px',
            fontFamily: 'monospace',
            color: '#ffff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 - 20, `Final Score: ${this.score}`, {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#00ff00'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 15, `Health Remaining: ${Math.floor(this.playerHealth)}`, {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#ff0000'
        }).setOrigin(0.5);

        // Update stats
        gameData.updateStat('bossRush.gamesPlayed', 1, 'add');
        gameData.updateStat('bossRush.highScore', this.score, 'max');
        gameData.updateStat('bossRush.bossesDefeated', this.bossesDefeated, 'add');
        gameData.save();

        this.createReturnButton();
    }

    endGame() {
        this.gameOver = true;

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85);
        overlay.setOrigin(0);

        this.add.text(width / 2, height / 2 - 60, '💀 DEFEATED! 💀', {
            fontSize: '32px',
            fontFamily: 'monospace',
            color: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2, `Score: ${this.score}`, {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#ffff00'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 35, `Bosses Defeated: ${this.bossesDefeated} / ${this.totalBosses}`, {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#00aaff'
        }).setOrigin(0.5);

        // Update stats
        gameData.updateStat('bossRush.gamesPlayed', 1, 'add');
        gameData.updateStat('bossRush.bossesDefeated', this.bossesDefeated, 'add');
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
        this.bossManager.cleanup();
        this.scene.start('MainMenuScene');
    }
}
