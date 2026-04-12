import Phaser from 'phaser';
import BaseScene from './BaseScene.js';
import SoundManager from '../utils/SoundManager.js';
import ParticleEffects from '../utils/ParticleEffects.js';
import PowerUpManager, { PowerUpTypes } from '../utils/PowerUps.js';
import ComboSystem from '../utils/ComboSystem.js';
import TutorialSystem from '../utils/TutorialSystem.js';
import { gameData } from '../utils/GameData.js';
import { GameConfig } from '../config/GameConfig.js';
import { musicManager } from '../utils/MusicManager.js';
import { shareManager } from '../utils/ShareManager.js';
import { leaderboard } from '../utils/Leaderboard.js';
import { screenReader } from '../utils/ScreenReader.js';
import { logger } from '../utils/Logger.js';
import { saveStateManager } from '../utils/SaveStateManager.js';

export default class GitSurvivorScene extends BaseScene {
    constructor() {
        super({
            key: 'GitSurvivorScene',
            enableInput: true,          // Enable InputManager with virtual joystick
            enablePerformance: true,    // Enable performance monitoring
            enableTransitions: true,    // Enable scene transitions
            enableAchievements: true,   // Enable achievement notifications
            enablePauseMenu: true       // Enable in-game pause menu
        });
    }

    init(data = {}) {
        this.pendingRestoreState = data.restoreState || null;
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
        this.lastLevelUpAt = 0; // Track last level up to prevent multiple triggers

        // Difficulty multiplier
        const difficulty = gameData.getDifficulty();
        this.difficultyMult = difficulty === 'hard' ? 1.5 : difficulty === 'nightmare' ? 2.0 : 1.0;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Initialize BaseScene utilities (InputManager, PerformanceMonitor, etc.)
        this.initUtilities();

        // Initialize systems
        this.sounds = new SoundManager(this);
        this.applyAudioSettings(); // Apply audio settings from settings scene
        this.particles = new ParticleEffects(this);

        // Start game music
        musicManager.init();
        musicManager.play('gitSurvivor');
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

        // Controls - Use InputManager for unified input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
        this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Setup InputManager bindings
        if (this.inputManager) {
            this.inputManager.bind('shoot', ['SPACE', 'MOUSE_LEFT']);
        }

        // Mobile: Virtual Joystick (only on touch devices)
        this.setupMobileControls();

        // Mobile touch controls for shooting (store handler for cleanup)
        this.shootHandler = (pointer) => {
            // Don't shoot if touching the virtual joystick area
            if (this.virtualJoystick && pointer.x < 150 && pointer.y > height - 150) {
                return;
            }
            if (pointer.y > 150) {
                this.shootProjectile(pointer.x, pointer.y);
            }
        };
        this.input.on('pointerdown', this.shootHandler);

        // Spawn enemies (tracked for automatic cleanup)
        this.enemySpawnTimer = this.trackTimer(this.time.addEvent({
            delay: GameConfig.GIT_SURVIVOR.ENEMY_SPAWN_DELAY / this.difficultyMult,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        }));

        // Power-up spawning (tracked for automatic cleanup)
        this.powerUpTimer = this.trackTimer(this.time.addEvent({
            delay: GameConfig.GIT_SURVIVOR.POWER_UP_SPAWN_DELAY,
            callback: () => {
                const x = 150 + Math.random() * 500;
                const y = 200 + Math.random() * 250;
                this.powerUpManager.spawn(x, y);
            },
            loop: true
        }));

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

        this.setupPersistence();

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

        // Screen reader announcement for game start
        screenReader.gameStart('Git Survivor');
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
        // Update utilities from BaseScene
        this.updateUtilities();

        // Update pause menu stats if paused
        if (this.pauseMenu) {
            this.pauseMenu.updateStats({
                Score: this.score,
                Level: this.level,
                Kills: this.enemiesKilled,
                'Power-ups': this.powerUpsCollected
            });
        }

        // Player movement with power-up multiplier
        const baseSpeed = 200;
        const speedMult = this.powerUpManager.getMultiplier('speed');
        const speed = baseSpeed * speedMult;

        this.player.body.setVelocity(0);

        // Use InputManager if available (includes virtual joystick on mobile)
        if (this.inputManager) {
            const movement = this.inputManager.getMovementVector();
            if (movement.x !== 0 || movement.y !== 0) {
                this.player.body.setVelocity(movement.x * speed, movement.y * speed);
            }
        } else {
            // Fallback to keyboard
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

        // Level up every 10 kills (fixed logic to prevent multiple triggers)
        const nextLevelUpAt = this.lastLevelUpAt + 10;
        if (this.enemiesKilled >= nextLevelUpAt) {
            this.levelUp();
            this.lastLevelUpAt = nextLevelUpAt;
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
        // Use reverse iteration to safely remove enemies while iterating
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (!enemy.active) continue;

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
                this.enemies.splice(i, 1);

                if (data.isBoss) {
                    this.bossActive = false;
                }
            }
        }
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
        // Use reverse iteration to safely remove projectiles while iterating
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            if (!this.projectiles[i].active) {
                this.projectiles.splice(i, 1);
            }
        }
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

        // Screen reader announcement
        screenReader.levelUp(this.level);
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

        // Use the new AchievementNotification system from BaseScene
        if (this.achievementNotification) {
            this.achievementNotification.show({
                title: achievement.name,
                description: achievement.description,
                icon: achievement.icon
            });
        }
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


    setupPersistence() {
        saveStateManager.startAutoSave(this, 15000);

        this.events.once('shutdown', () => {
            saveStateManager.stopAutoSave();
        });

        if (this.pendingRestoreState) {
            const restored = saveStateManager.restore(this, this.pendingRestoreState);
            if (restored) {
                this.updateHUD();
                this.particles.floatingText(this.player.x, this.player.y - 50, 'Continue run loaded!', '#00ffcc');
            }
            this.pendingRestoreState = null;
        }
    }

    captureState() {
        return {
            playerHealth: this.playerHealth,
            playerSanity: this.playerSanity,
            diskSpace: this.diskSpace,
            level: this.level,
            score: this.score,
            enemiesKilled: this.enemiesKilled,
            powerUpsCollected: this.powerUpsCollected,
            bossActive: this.bossActive,
            nextBossAt: this.nextBossAt,
            lastLevelUpAt: this.lastLevelUpAt,
            player: {
                x: this.player?.x || 0,
                y: this.player?.y || 0
            }
        };
    }

    restoreState(data) {
        if (!data) {
            return;
        }

        this.playerHealth = data.playerHealth ?? this.playerHealth;
        this.playerSanity = data.playerSanity ?? this.playerSanity;
        this.diskSpace = data.diskSpace ?? this.diskSpace;
        this.level = data.level ?? this.level;
        this.score = data.score ?? this.score;
        this.enemiesKilled = data.enemiesKilled ?? this.enemiesKilled;
        this.powerUpsCollected = data.powerUpsCollected ?? this.powerUpsCollected;
        this.bossActive = false;
        this.nextBossAt = data.nextBossAt ?? Math.max(30, Math.ceil((this.enemiesKilled + 1) / 10) * 10);
        this.lastLevelUpAt = data.lastLevelUpAt ?? Math.floor(this.enemiesKilled / 10) * 10;

        if (data.player && this.player) {
            this.player.setPosition(data.player.x, data.player.y);
        }
    }

    gameOver() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Save high score
        gameData.updateStat('gitSurvivor.highScore', this.score, 'max');
        gameData.updateStat('totalScore', this.score, 'increment');

        // Cleanup
        saveStateManager.stopAutoSave();
        saveStateManager.deleteSave('quick-save');
        this.powerUpManager.cleanup();

        // Check if score qualifies for leaderboard
        const difficulty = gameData.getDifficulty();
        const { qualifies, rank } = leaderboard.wouldQualify('gitSurvivor', this.score);

        // Pause game first
        this.physics.pause();
        if (this.enemySpawnTimer) this.enemySpawnTimer.remove();
        if (this.powerUpTimer) this.powerUpTimer.remove();

        this.sounds.playGameOver();

        // Screen reader announcement
        screenReader.gameOver(this.score, {
            level: this.level,
            kills: this.enemiesKilled
        });

        if (qualifies) {
            screenReader.highScore(this.score, rank);
            this.showLeaderboardEntry(rank, difficulty);
        } else {
            this.showGameOverScreen();
        }
    }

    showLeaderboardEntry(rank, difficulty) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Darken screen
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.9).setOrigin(0);
        overlay.setDepth(1000);

        // High score entry box
        const container = this.add.container(width / 2, height / 2);
        container.setDepth(1001);

        const box = this.add.rectangle(0, 0, 400, 300, 0x1a1a2e);
        box.setStrokeStyle(3, 0xffaa00);

        const newHighText = this.add.text(0, -120, '🎉 NEW HIGH SCORE! 🎉', {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#ffaa00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const rankText = this.add.text(0, -85, `You ranked #${rank}!`, {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#00ff00'
        }).setOrigin(0.5);

        const scoreText = this.add.text(0, -55, `Score: ${this.score.toLocaleString()}`, {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);

        const enterName = this.add.text(0, -15, 'Enter your initials:', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#888888'
        }).setOrigin(0.5);

        // Name input using 3 clickable character boxes
        let currentName = ['A', 'A', 'A'];
        let selectedIndex = 0;
        const charBoxes = [];
        const charTexts = [];

        for (let i = 0; i < 3; i++) {
            const charBox = this.add.rectangle(-50 + i * 50, 30, 40, 50,
                i === selectedIndex ? 0x00aa00 : 0x333333);
            charBox.setStrokeStyle(2, i === selectedIndex ? 0xffffff : 0x666666);
            charBox.setInteractive({ useHandCursor: true });

            const charText = this.add.text(-50 + i * 50, 30, currentName[i], {
                fontSize: '28px',
                fontFamily: 'monospace',
                color: '#00ff00',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            charBox.on('pointerdown', () => {
                selectedIndex = i;
                updateSelection();
            });

            charBoxes.push(charBox);
            charTexts.push(charText);
        }

        const updateSelection = () => {
            charBoxes.forEach((box, i) => {
                box.setFillStyle(i === selectedIndex ? 0x00aa00 : 0x333333);
                box.setStrokeStyle(2, i === selectedIndex ? 0xffffff : 0x666666);
            });
        };

        // Up/down arrows for character selection
        const upArrow = this.add.text(-50 + selectedIndex * 50, -5, '▲', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#00ff00'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const downArrow = this.add.text(-50 + selectedIndex * 50, 65, '▼', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#00ff00'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const cycleChar = (direction) => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            const currentCharIndex = chars.indexOf(currentName[selectedIndex]);
            let newIndex = (currentCharIndex + direction + chars.length) % chars.length;
            currentName[selectedIndex] = chars[newIndex];
            charTexts[selectedIndex].setText(currentName[selectedIndex]);
        };

        upArrow.on('pointerdown', () => cycleChar(-1));
        downArrow.on('pointerdown', () => cycleChar(1));

        // Keyboard input
        this.input.keyboard.on('keydown', (event) => {
            if (event.key === 'ArrowUp') cycleChar(-1);
            else if (event.key === 'ArrowDown') cycleChar(1);
            else if (event.key === 'ArrowLeft') {
                selectedIndex = Math.max(0, selectedIndex - 1);
                updateSelection();
                upArrow.setX(-50 + selectedIndex * 50);
                downArrow.setX(-50 + selectedIndex * 50);
            }
            else if (event.key === 'ArrowRight') {
                selectedIndex = Math.min(2, selectedIndex + 1);
                updateSelection();
                upArrow.setX(-50 + selectedIndex * 50);
                downArrow.setX(-50 + selectedIndex * 50);
            }
            else if (event.key === 'Enter') {
                submitScore();
            }
            else if (/^[a-zA-Z0-9]$/.test(event.key)) {
                currentName[selectedIndex] = event.key.toUpperCase();
                charTexts[selectedIndex].setText(currentName[selectedIndex]);
                if (selectedIndex < 2) {
                    selectedIndex++;
                    updateSelection();
                    upArrow.setX(-50 + selectedIndex * 50);
                    downArrow.setX(-50 + selectedIndex * 50);
                }
            }
        });

        // Submit button
        const submitBtn = this.add.text(0, 100, '[ SUBMIT ]', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        submitBtn.on('pointerover', () => submitBtn.setColor('#ffffff'));
        submitBtn.on('pointerout', () => submitBtn.setColor('#00ff00'));

        const submitScore = () => {
            const name = currentName.join('');
            leaderboard.addScore('gitSurvivor', name, this.score, difficulty, {
                level: this.level,
                kills: this.enemiesKilled,
                powerUps: this.powerUpsCollected
            });

            // Destroy the entry UI
            container.destroy();
            overlay.destroy();

            // Show regular game over screen
            this.showGameOverScreen();
        };

        submitBtn.on('pointerdown', submitScore);

        // Skip button
        const skipBtn = this.add.text(0, 130, 'Skip', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#666666'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        skipBtn.on('pointerover', () => skipBtn.setColor('#ffffff'));
        skipBtn.on('pointerout', () => skipBtn.setColor('#666666'));
        skipBtn.on('pointerdown', () => {
            container.destroy();
            overlay.destroy();
            this.showGameOverScreen();
        });

        container.add([box, newHighText, rankText, scoreText, enterName,
            ...charBoxes, ...charTexts, upArrow, downArrow, submitBtn, skipBtn]);
    }

    showGameOverScreen() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

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

        // Share button
        const shareBtn = this.add.text(width / 2, height / 2 + 130, '📤 Share Score', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#00aaff',
            backgroundColor: '#1a1a2e',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5);
        shareBtn.setInteractive({ useHandCursor: true });
        shareBtn.on('pointerdown', async () => {
            try {
                const difficulty = gameData.getDifficulty();
                const result = await shareManager.shareScore('Git Survivor', this.score, {
                    difficulty: difficulty,
                    enemiesKilled: this.enemiesKilled
                });

                if (result.success) {
                    // Show success feedback
                    const feedback = this.add.text(width / 2, height / 2 + 160,
                        result.method === 'clipboard' ? '✓ Copied to clipboard!' : '✓ Shared!', {
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: '#00ff00'
                    }).setOrigin(0.5);

                    this.tweens.add({
                        targets: feedback,
                        alpha: 0,
                        duration: 2000,
                        delay: 1000,
                        onComplete: () => feedback.destroy()
                    });
                }
            } catch (error) {
                logger.error('GitSurvivorScene', 'Failed to share score', { error: error.message });
            }
        });

        shareBtn.on('pointerover', () => {
            shareBtn.setStyle({ backgroundColor: '#2a2a3e' });
        });

        shareBtn.on('pointerout', () => {
            shareBtn.setStyle({ backgroundColor: '#1a1a2e' });
        });

        const restartBtn = this.add.text(width / 2, height / 2 + 180, '[ Click to Return to Menu ]', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);
        restartBtn.setInteractive({ useHandCursor: true });
        restartBtn.on('pointerdown', () => {
            this.scene.start('MainMenuScene');
        });
    }

    // Use parent's createBackButton (removed duplicate)

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

    /**
     * Setup mobile controls (virtual joystick)
     */
    setupMobileControls() {
        // Only create virtual joystick on touch devices
        const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        if (isMobile && this.inputManager) {
            const height = this.cameras.main.height;

            // Create virtual joystick in bottom-left corner
            this.virtualJoystick = this.inputManager.createVirtualJoystick(
                75,           // x position
                height - 75,  // y position (bottom)
                60            // radius
            );

            // Add visual feedback
            if (this.virtualJoystick) {
                this.virtualJoystick.base.setDepth(1000);
                this.virtualJoystick.thumb.setDepth(1001);
            }
        }
    }

    /**
     * Apply audio settings from settings scene
     */
    applyAudioSettings() {
        try {
            // Access settings directly from gameData.data.settings (not via getStat which looks in stats)
            const settings = gameData.data.settings;

            if (settings && this.sounds) {
                // Apply volume settings
                const masterVolume = settings.masterVolume !== undefined ? settings.masterVolume : 1.0;

                // Set master volume (controls overall volume)
                this.sounds.setVolume(masterVolume);

                // Apply enabled/disabled
                const soundEnabled = settings.soundEnabled !== undefined ? settings.soundEnabled : true;
                this.sounds.setEnabled(soundEnabled);
            }
        } catch (error) {
            logger.warn('GitSurvivorScene', 'Could not apply audio settings', { error: error.message });
        }
    }

    /**
     * Cleanup when scene shuts down
     */
    shutdown() {
        // Track timers for automatic cleanup
        if (this.enemySpawnTimer) this.enemySpawnTimer.remove();
        if (this.powerUpTimer) this.powerUpTimer.remove();

        // Cleanup managers
        if (this.powerUpManager) this.powerUpManager.cleanup();
        if (this.sounds) this.sounds.destroy();

        // Cleanup event listeners to prevent memory leaks
        if (this.shootHandler) {
            this.input.off('pointerdown', this.shootHandler);
            this.shootHandler = null;
        }

        // Cleanup virtual joystick
        if (this.virtualJoystick) {
            this.virtualJoystick = null;
        }

        // Call parent cleanup
        super.shutdown();
    }
}
