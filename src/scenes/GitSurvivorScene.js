import Phaser from 'phaser';
import SoundManager from '../utils/SoundManager.js';
import ParticleEffects from '../utils/ParticleEffects.js';
import PowerUpManager from '../utils/PowerUps.js';
import ComboSystem from '../utils/ComboSystem.js';
import TutorialSystem from '../utils/TutorialSystem.js';
import { gameData } from '../utils/GameData.js';

export default class GitSurvivorScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GitSurvivorScene' });
    }

    init() {
        // Game state
        this.playerHealth = 100;
        this.playerSanity = 100;
        this.diskSpace = 100;
        this.level = 1;
        this.score = 0;
        this.enemies = [];
        this.projectiles = [];
        this.enemiesKilled = 0;
        this.bossActive = false;
        this.powerUpsCollected = 0;

        // Difficulty multiplier
        const difficulty = gameData.getDifficulty();
        this.difficultyMult = difficulty === 'hard' ? 1.5 : difficulty === 'nightmare' ? 2.0 : 1.0;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Initialize systems
        this.sounds = new SoundManager(this);
        this.particles = new ParticleEffects(this);
        this.powerUpManager = new PowerUpManager(this);
        this.comboSystem = new ComboSystem(this);
        this.tutorial = new TutorialSystem(this);

        // Background
        this.add.rectangle(0, 0, width, height, 0x0a0a1a).setOrigin(0);

        // Title
        this.add.text(width / 2, 20, '🗡️ Git Survivor', {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#00ff00'
        }).setOrigin(0.5);

        // Back button
        this.createBackButton();

        // Game area
        this.gameArea = this.add.rectangle(width / 2, height / 2 + 20, 700, 400, 0x1a1a2e);
        this.gameArea.setStrokeStyle(2, 0x00ff00);

        // Create player (the developer)
        this.player = this.add.circle(width / 2, height / 2 + 20, 15, 0x00aaff);
        this.player.setStrokeStyle(2, 0xffffff);
        this.player.invincible = false;

        // Player physics
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);

        // HUD
        this.createHUD();

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
        this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Mobile touch controls
        this.input.on('pointerdown', (pointer) => {
            if (pointer.y > 150) {
                this.shootProjectile(pointer.x, pointer.y);
            }
        });

        // Spawn enemies
        this.enemySpawnTimer = this.time.addEvent({
            delay: 2000 / this.difficultyMult,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        // Power-up spawning
        this.powerUpTimer = this.time.addEvent({
            delay: 10000,
            callback: () => {
                const x = 150 + Math.random() * 500;
                const y = 200 + Math.random() * 250;
                this.powerUpManager.spawn(x, y);
            },
            loop: true
        });

        // Boss spawn every 30 enemies
        this.nextBossAt = 30;

        // Help button to show tutorial
        this.createHelpButton();

        // Show tutorial for first-time players
        if (!gameData.data.settings.tutorialSeenGitSurvivor) {
            this.time.delayedCall(1000, () => {
                this.tutorial.start('GitSurvivorScene');
                gameData.data.settings.tutorialSeenGitSurvivor = true;
                gameData.save();
            });
        }

        // Humor messages
        this.humorMessages = [
            'A wild MERGE CONFLICT appears!',
            'Bug spotted! It\'s got 3 heads!',
            'npm packages everywhere!',
            'Someone force-pushed to main!',
            'Your tests are failing... again!',
            'Production is down! 🔥',
            'The intern deleted the database!',
            'Circular dependency detected!',
            'It works on my machine!',
            'Forgot to git pull before push!',
            'Pushed to main at 5pm Friday!',
            'Undefined is not a function!'
        ];

        // Track stats
        gameData.updateStat('gitSurvivor.gamesPlayed', 1, 'increment');
        gameData.updateStat('gamesPlayed', 1, 'increment');
    }

    createHUD() {
        const hudY = 60;

        // Health bar
        this.healthText = this.add.text(20, hudY, `❤️ Health: ${this.playerHealth}%`, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ff0000'
        });

        // Sanity bar
        this.sanityText = this.add.text(200, hudY, `🧠 Sanity: ${this.playerSanity}%`, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#00aaff'
        });

        // Disk space
        this.diskText = this.add.text(380, hudY, `💾 Storage: ${this.diskSpace}%`, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffaa00'
        });

        // Level and score
        this.levelText = this.add.text(20, hudY + 25, `Level: ${this.level}`, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#00ff00'
        });

        this.scoreText = this.add.text(200, hudY + 25, `Score: ${this.score} | Kills: ${this.enemiesKilled}`, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffffff'
        });

        // Active power-ups display area
        this.powerUpDisplay = this.add.text(560, hudY, '', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#ffff00'
        });
    }

    showInstructions() {
        const width = this.cameras.main.width;
        const instructions = this.add.text(width / 2, 500,
            '🎮 Arrow Keys/WASD: Move | SPACE/Click: Attack | Collect power-ups! Survive!', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#888888'
        });
        instructions.setOrigin(0.5);

        this.tweens.add({
            targets: instructions,
            alpha: 0,
            duration: 1000,
            delay: 5000,
            onComplete: () => instructions.destroy()
        });
    }

    update() {
        // Player movement with power-up multiplier
        const baseSpeed = 200;
        const speedMult = this.powerUpManager.getMultiplier('speed');
        const speed = baseSpeed * speedMult;

        this.player.body.setVelocity(0);

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            this.player.body.setVelocityX(-speed);
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            this.player.body.setVelocityX(speed);
        }

        if (this.cursors.up.isDown || this.wasd.up.isDown) {
            this.player.body.setVelocityY(-speed);
        } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
            this.player.body.setVelocityY(speed);
        }

        // Trail effect when moving fast
        if (speed > 250 && (this.player.body.velocity.x !== 0 || this.player.body.velocity.y !== 0)) {
            if (Math.random() < 0.3) {
                this.particles.trail(this.player.x, this.player.y, 0x00aaff, 3);
            }
        }

        // Shooting
        if (Phaser.Input.Keyboard.JustDown(this.spaceBar)) {
            const nearestEnemy = this.findNearestEnemy();
            if (nearestEnemy) {
                this.shootProjectile(nearestEnemy.x, nearestEnemy.y);
            }
        }

        // Update managers
        this.powerUpManager.update();
        this.powerUpManager.checkCollisions(this.player, 30);

        // Update enemies
        this.updateEnemies();

        // Update projectiles
        this.updateProjectiles();

        // Check collisions
        this.checkCollisions();

        // Update HUD
        this.updateHUD();

        // Check for boss spawn
        if (this.enemiesKilled >= this.nextBossAt && !this.bossActive) {
            this.spawnBoss();
        }

        // Level up every 10 kills
        if (this.enemiesKilled > 0 && this.enemiesKilled % 10 === 0 && this.score % 10 === 0) {
            this.levelUp();
        }
    }

    spawnEnemy() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const enemyTypes = [
            { name: '🐛 Bug', color: 0xff00ff, health: 30, speed: 80, reward: 10 },
            { name: '⚠️ Merge Conflict', color: 0xff0000, health: 40, speed: 60, reward: 15 },
            { name: '💣 Memory Leak', color: 0xffff00, health: 50, speed: 40, reward: 20 },
            { name: '📦 NPM Package', color: 0x00ffff, health: 25, speed: 100, reward: 12 },
            { name: '🔓 Null Pointer', color: 0xff6600, health: 35, speed: 70, reward: 18 },
            { name: '🌊 Race Condition', color: 0x6600ff, health: 45, speed: 120, reward: 25 },
            { name: '💀 Segfault', color: 0xff0000, health: 60, speed: 50, reward: 30 },
            { name: '🐞 Heisenbug', color: 0xff00ff, health: 40, speed: 150, reward: 35 }
        ];

        const type = Phaser.Utils.Array.GetRandom(enemyTypes);
        const scaleFactor = 1 + (this.level * 0.1) * this.difficultyMult;

        // Spawn from edges
        const side = Phaser.Math.Between(0, 3);
        let x, y;

        if (side === 0) { x = Phaser.Math.Between(100, 700); y = 150; }
        else if (side === 1) { x = 700; y = Phaser.Math.Between(150, 500); }
        else if (side === 2) { x = Phaser.Math.Between(100, 700); y = 500; }
        else { x = 100; y = Phaser.Math.Between(150, 500); }

        const enemy = this.add.circle(x, y, 12, type.color);
        enemy.setStrokeStyle(2, 0xffffff);
        this.physics.add.existing(enemy);

        enemy.enemyData = {
            name: type.name,
            health: type.health * scaleFactor,
            maxHealth: type.health * scaleFactor,
            speed: type.speed,
            reward: Math.floor(type.reward * scaleFactor)
        };

        // Add text label
        enemy.label = this.add.text(x, y - 20, type.name, {
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 3, y: 2 }
        }).setOrigin(0.5);

        this.enemies.push(enemy);

        // Show humor message sometimes
        if (Math.random() < 0.2) {
            const message = Phaser.Utils.Array.GetRandom(this.humorMessages);
            this.particles.floatingText(width / 2, 120, message, '#ffaa00');
        }
    }

    spawnBoss() {
        this.bossActive = true;
        this.sounds.playSound('boss');

        const bosses = [
            { name: '👹 The Product Manager', health: 500, speed: 40, color: 0xff0000 },
            { name: '💼 Legacy Codebase', health: 800, speed: 20, color: 0x666666 },
            { name: '🔥 Production Outage', health: 600, speed: 60, color: 0xff6600 },
            { name: '📊 The Auditor', health: 700, speed: 30, color: 0x6600ff }
        ];

        const bossType = Phaser.Utils.Array.GetRandom(bosses);

        const boss = this.add.circle(400, 200, 30, bossType.color);
        boss.setStrokeStyle(4, 0xffff00);
        this.physics.add.existing(boss);

        boss.enemyData = {
            name: bossType.name,
            health: bossType.health * this.difficultyMult,
            maxHealth: bossType.health * this.difficultyMult,
            speed: bossType.speed,
            reward: 200,
            isBoss: true
        };

        boss.label = this.add.text(boss.x, boss.y - 40, bossType.name, {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ff0000',
            backgroundColor: '#000000',
            padding: { x: 5, y: 3 },
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Boss health bar
        boss.healthBarBg = this.add.rectangle(boss.x, boss.y - 50, 100, 8, 0x000000);
        boss.healthBar = this.add.rectangle(boss.x, boss.y - 50, 100, 8, 0xff0000);

        this.enemies.push(boss);

        // Boss entrance effect
        this.particles.bossEntrance(boss.x, boss.y);
        this.particles.floatingText(400, 250, '⚠️ BOSS BATTLE! ⚠️', '#ff0000', '24px');

        // Set next boss threshold
        this.nextBossAt += 50;

        // Achievement
        if (!gameData.hasAchievement('first_boss')) {
            gameData.unlockAchievement('first_boss');
        }
    }

    updateEnemies() {
        this.enemies.forEach((enemy, index) => {
            if (!enemy.active) return;

            const data = enemy.enemyData;

            // Move toward player
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            const speed = data.speed;

            enemy.body.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );

            // Update label position
            if (enemy.label) {
                enemy.label.setPosition(enemy.x, enemy.y - (data.isBoss ? 40 : 20));
            }

            // Update boss health bar
            if (data.isBoss && enemy.healthBar) {
                enemy.healthBar.setPosition(enemy.x, enemy.y - 50);
                enemy.healthBarBg.setPosition(enemy.x, enemy.y - 50);
                const healthPercent = data.health / data.maxHealth;
                enemy.healthBar.width = 100 * healthPercent;
            }

            // Remove if health is 0
            if (data.health <= 0) {
                this.enemyKilled(enemy, data.isBoss);
                if (enemy.label) enemy.label.destroy();
                if (enemy.healthBar) {
                    enemy.healthBar.destroy();
                    enemy.healthBarBg.destroy();
                }
                enemy.destroy();
                this.enemies.splice(index, 1);

                if (data.isBoss) {
                    this.bossActive = false;
                }
            }
        });
    }

    enemyKilled(enemy, isBoss) {
        const data = enemy.enemyData;

        // Add to combo
        this.comboSystem.addHit();

        // Calculate score with combo multiplier
        const multipliedScore = this.comboSystem.calculateScore(data.reward);
        this.score += multipliedScore;
        this.enemiesKilled++;

        // Particle effect
        this.particles.explosion(enemy.x, enemy.y, isBoss ? 0xff0000 : 0xff00ff, isBoss ? 40 : 20);

        // Show score with multiplier
        const scoreText = this.comboSystem.getMultiplier() > 1
            ? `+${multipliedScore} (x${this.comboSystem.getMultiplier()})`
            : `+${multipliedScore}`;
        this.particles.floatingText(enemy.x, enemy.y, scoreText, '#00ff00');

        // Sound
        this.sounds.playSound(isBoss ? 'victory' : 'hit');

        // Chance to drop power-up
        const dropChance = isBoss ? 1.0 : 0.15;
        if (Math.random() < dropChance) {
            this.powerUpManager.spawn(enemy.x, enemy.y);
        }

        // Boss achievements
        if (isBoss) {
            const unlocked = gameData.unlockAchievement('boss_slayer');
            if (unlocked) {
                this.showAchievement(unlocked);
            }
            this.sounds.playVictory();
        }

        // Track stats
        gameData.updateStat('gitSurvivor.enemiesKilled', 1, 'increment');

        // Check achievements
        const achievements = gameData.checkAchievements();
        achievements.forEach(ach => this.showAchievement(ach));
    }

    shootProjectile(targetX, targetY) {
        const projectile = this.add.circle(this.player.x, this.player.y, 5, 0x00ff00);
        this.physics.add.existing(projectile);

        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetX, targetY);
        const speed = 400;

        projectile.body.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );

        const baseDamage = 10;
        const damageMult = this.powerUpManager.getMultiplier('damage');
        projectile.damage = baseDamage * damageMult;

        this.projectiles.push(projectile);

        // Sound
        this.sounds.playSound('shoot');

        // Destroy after 2 seconds
        this.time.delayedCall(2000, () => {
            const idx = this.projectiles.indexOf(projectile);
            if (idx > -1) this.projectiles.splice(idx, 1);
            projectile.destroy();
        });
    }

    updateProjectiles() {
        this.projectiles.forEach((projectile, index) => {
            if (!projectile.active) {
                this.projectiles.splice(index, 1);
            }
        });
    }

    checkCollisions() {
        // Projectile vs Enemy
        this.projectiles.forEach(projectile => {
            this.enemies.forEach(enemy => {
                const enemyRadius = enemy.enemyData.isBoss ? 30 : 12;
                if (Phaser.Geom.Circle.Overlaps(
                    new Phaser.Geom.Circle(projectile.x, projectile.y, 5),
                    new Phaser.Geom.Circle(enemy.x, enemy.y, enemyRadius)
                )) {
                    enemy.enemyData.health -= projectile.damage;
                    projectile.destroy();
                    const idx = this.projectiles.indexOf(projectile);
                    if (idx > -1) this.projectiles.splice(idx, 1);

                    // Visual feedback
                    this.particles.sparkle(enemy.x, enemy.y, 0xffff00, 5);
                    this.sounds.playSound('hit');
                }
            });
        });

        // Player vs Enemy (if not invincible)
        if (!this.player.invincible && !this.powerUpManager.isActive('darkmode')) {
            this.enemies.forEach(enemy => {
                const enemyRadius = enemy.enemyData.isBoss ? 30 : 12;
                if (Phaser.Geom.Circle.Overlaps(
                    new Phaser.Geom.Circle(this.player.x, this.player.y, 15),
                    new Phaser.Geom.Circle(enemy.x, enemy.y, enemyRadius)
                )) {
                    const damage = enemy.enemyData.isBoss ? 1.0 : 0.5;
                    this.playerHealth -= damage;
                    this.playerSanity -= 0.3;
                    this.particles.shake(100, 0.005);
                    this.sounds.playSound('error');

                    if (this.playerHealth <= 0) {
                        this.gameOver();
                    }
                }
            });
        }

        // Invincibility visual
        if (this.powerUpManager.isActive('darkmode')) {
            this.player.alpha = 0.5 + Math.sin(Date.now() / 100) * 0.3;
        } else {
            this.player.alpha = 1;
        }
    }

    levelUp() {
        this.level++;
        this.particles.levelUp(this.player.x, this.player.y);
        this.particles.floatingText(this.player.x, this.player.y - 40, 'LEVEL UP!', '#00ff00', '20px');
        this.sounds.playLevelUp();

        // Restore some health
        this.playerHealth = Math.min(100, this.playerHealth + 20);
        this.playerSanity = Math.min(100, this.playerSanity + 15);
    }

    findNearestEnemy() {
        let nearest = null;
        let minDist = Infinity;

        this.enemies.forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        });

        return nearest;
    }

    showAchievement(achievement) {
        if (!achievement) return;

        const width = this.cameras.main.width;
        const achievementBox = this.add.rectangle(width - 150, 100, 280, 60, 0x000000, 0.9);
        achievementBox.setStrokeStyle(2, 0xffaa00);

        const achievementText = this.add.text(width - 150, 90, `🏆 Achievement Unlocked!`, {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#ffaa00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const achievementName = this.add.text(width - 150, 110, `${achievement.icon} ${achievement.name}`, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.sounds.playSound('upgrade');

        this.time.delayedCall(3000, () => {
            this.tweens.add({
                targets: [achievementBox, achievementText, achievementName],
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    achievementBox.destroy();
                    achievementText.destroy();
                    achievementName.destroy();
                }
            });
        });
    }

    updateHUD() {
        this.healthText.setText(`❤️ Health: ${Math.max(0, Math.floor(this.playerHealth))}%`);
        this.sanityText.setText(`🧠 Sanity: ${Math.max(0, Math.floor(this.playerSanity))}%`);
        this.diskText.setText(`💾 Storage: ${Math.max(0, Math.floor(this.diskSpace))}%`);
        this.levelText.setText(`Level: ${this.level}`);
        this.scoreText.setText(`Score: ${this.score} | Kills: ${this.enemiesKilled}`);

        // Show active power-ups
        const activePowerUps = this.powerUpManager.getActive();
        if (activePowerUps.length > 0) {
            const powerUpText = activePowerUps.map(p => {
                const type = Object.values(PowerUpTypes).find(t => t.id === p.id);
                return type ? type.emoji : '';
            }).join(' ');
            this.powerUpDisplay.setText(`Power-ups: ${powerUpText}`);
        } else {
            this.powerUpDisplay.setText('');
        }
    }

    gameOver() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Save high score
        gameData.updateStat('gitSurvivor.highScore', this.score, 'max');
        gameData.updateStat('totalScore', this.score, 'increment');

        // Cleanup
        this.powerUpManager.cleanup();

        // Darken screen
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);

        this.add.text(width / 2, height / 2 - 50, 'GAME OVER', {
            fontSize: '48px',
            fontFamily: 'monospace',
            color: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const funnyMessages = [
            '💀 "It compiles on my machine..."',
            '☠️ Killed by a null pointer exception',
            '💀 Forgot to save before force push',
            '☠️ Deployed on Friday at 5pm',
            '💀 Merged without reviewing',
            '☠️ Deleted node_modules without backup',
            '💀 Pushed secrets to GitHub',
            '☠️ Updated dependencies without testing'
        ];

        this.add.text(width / 2, height / 2, Phaser.Utils.Array.GetRandom(funnyMessages), {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffaa00',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 40, `Final Score: ${this.score}`, {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#00ff00'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 70, `Enemies Killed: ${this.enemiesKilled} | Level: ${this.level}`, {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);

        const highScore = gameData.getStat('gitSurvivor.highScore');
        this.add.text(width / 2, height / 2 + 95, `High Score: ${highScore}`, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffaa00'
        }).setOrigin(0.5);

        const restartBtn = this.add.text(width / 2, height / 2 + 130, '[ Click to Return to Menu ]', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);
        restartBtn.setInteractive({ useHandCursor: true });
        restartBtn.on('pointerdown', () => {
            this.scene.start('MainMenuScene');
        });

        this.physics.pause();
        if (this.enemySpawnTimer) this.enemySpawnTimer.remove();
        if (this.powerUpTimer) this.powerUpTimer.remove();

        this.sounds.playGameOver();
    }

    createBackButton() {
        const backBtn = this.add.text(20, 20, '← Back to Menu', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 }
        });
        backBtn.setInteractive({ useHandCursor: true });
        backBtn.on('pointerdown', () => {
            this.powerUpManager.cleanup();
            this.scene.start('MainMenuScene');
        });
        backBtn.on('pointerover', () => backBtn.setStyle({ backgroundColor: '#555555' }));
        backBtn.on('pointerout', () => backBtn.setStyle({ backgroundColor: '#333333' }));
    }

    createHelpButton() {
        const width = this.cameras.main.width;
        const helpBtn = this.add.text(width - 20, 20, '❓ Help', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 }
        });
        helpBtn.setOrigin(1, 0);
        helpBtn.setInteractive({ useHandCursor: true });
        helpBtn.on('pointerdown', () => {
            this.tutorial.start('GitSurvivorScene');
        });
        helpBtn.on('pointerover', () => helpBtn.setStyle({ backgroundColor: '#555555' }));
        helpBtn.on('pointerout', () => helpBtn.setStyle({ backgroundColor: '#333333' }));
    }
}
