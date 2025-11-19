import Phaser from 'phaser';

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
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

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
            if (pointer.y > 150) { // Not clicking UI
                this.shootProjectile(pointer.x, pointer.y);
            }
        });

        // Spawn enemies
        this.enemySpawnTimer = this.time.addEvent({
            delay: 2000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        // Show instructions
        this.showInstructions();

        // Humor messages
        this.humorMessages = [
            'A wild MERGE CONFLICT appears!',
            'Bug spotted! It\'s got 3 heads!',
            'npm packages everywhere!',
            'Someone force-pushed to main!',
            'Your tests are failing... again!',
            'Production is down! 🔥',
            'The intern deleted the database!',
            'Circular dependency detected!'
        ];
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

        this.scoreText = this.add.text(200, hudY + 25, `Score: ${this.score}`, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffffff'
        });
    }

    showInstructions() {
        const width = this.cameras.main.width;
        const instructions = this.add.text(width / 2, 500,
            '🎮 Arrow Keys/WASD: Move | SPACE/Click: Attack | Survive the sprint!', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#888888'
        });
        instructions.setOrigin(0.5);

        // Fade out after 5 seconds
        this.tweens.add({
            targets: instructions,
            alpha: 0,
            duration: 1000,
            delay: 5000,
            onComplete: () => instructions.destroy()
        });
    }

    update() {
        // Player movement
        const speed = 200;
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

        // Shooting
        if (Phaser.Input.Keyboard.JustDown(this.spaceBar)) {
            const nearestEnemy = this.findNearestEnemy();
            if (nearestEnemy) {
                this.shootProjectile(nearestEnemy.x, nearestEnemy.y);
            }
        }

        // Update enemies
        this.updateEnemies();

        // Update projectiles
        this.updateProjectiles();

        // Check collisions
        this.checkCollisions();

        // Update HUD
        this.updateHUD();
    }

    spawnEnemy() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const enemyTypes = [
            { name: 'Merge Conflict', color: 0xff0000, health: 30, speed: 50 },
            { name: 'Bug', color: 0xff00ff, health: 20, speed: 80 },
            { name: 'Memory Leak', color: 0xffff00, health: 40, speed: 30 },
            { name: 'NPM Package', color: 0x00ffff, health: 15, speed: 100 }
        ];

        const type = Phaser.Utils.Array.GetRandom(enemyTypes);

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
            health: type.health,
            maxHealth: type.health,
            speed: type.speed
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
        if (Math.random() < 0.3) {
            const message = Phaser.Utils.Array.GetRandom(this.humorMessages);
            this.showFloatingText(width / 2, 120, message, '#ffaa00');
        }
    }

    updateEnemies() {
        this.enemies.forEach((enemy, index) => {
            if (!enemy.active) return;

            // Move toward player
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            const speed = enemy.enemyData.speed;

            enemy.body.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );

            // Update label position
            if (enemy.label) {
                enemy.label.setPosition(enemy.x, enemy.y - 20);
            }

            // Remove if health is 0
            if (enemy.enemyData.health <= 0) {
                if (enemy.label) enemy.label.destroy();
                enemy.destroy();
                this.enemies.splice(index, 1);
                this.score += 10;
                this.showFloatingText(enemy.x, enemy.y, '+10', '#00ff00');
            }
        });
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

        projectile.damage = 10;
        this.projectiles.push(projectile);

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
                if (Phaser.Geom.Circle.Overlaps(
                    new Phaser.Geom.Circle(projectile.x, projectile.y, 5),
                    new Phaser.Geom.Circle(enemy.x, enemy.y, 12)
                )) {
                    enemy.enemyData.health -= projectile.damage;
                    projectile.destroy();
                    const idx = this.projectiles.indexOf(projectile);
                    if (idx > -1) this.projectiles.splice(idx, 1);

                    // Visual feedback
                    this.cameras.main.flash(50, 255, 255, 255, false, 0.1);
                }
            });
        });

        // Player vs Enemy
        this.enemies.forEach(enemy => {
            if (Phaser.Geom.Circle.Overlaps(
                new Phaser.Geom.Circle(this.player.x, this.player.y, 15),
                new Phaser.Geom.Circle(enemy.x, enemy.y, 12)
            )) {
                this.playerHealth -= 0.5;
                this.playerSanity -= 0.3;
                this.cameras.main.shake(50, 0.005);

                if (this.playerHealth <= 0) {
                    this.gameOver();
                }
            }
        });
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

    showFloatingText(x, y, text, color) {
        const floatingText = this.add.text(x, y, text, {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: color,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: floatingText,
            y: y - 50,
            alpha: 0,
            duration: 1500,
            onComplete: () => floatingText.destroy()
        });
    }

    updateHUD() {
        this.healthText.setText(`❤️ Health: ${Math.max(0, Math.floor(this.playerHealth))}%`);
        this.sanityText.setText(`🧠 Sanity: ${Math.max(0, Math.floor(this.playerSanity))}%`);
        this.diskText.setText(`💾 Storage: ${Math.max(0, Math.floor(this.diskSpace))}%`);
        this.scoreText.setText(`Score: ${this.score}`);
    }

    gameOver() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Darken screen
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);

        // Game over text
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
            '💀 Merged without reviewing'
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

        // Restart button
        const restartBtn = this.add.text(width / 2, height / 2 + 100, '[ Click to Return to Menu ]', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);
        restartBtn.setInteractive({ useHandCursor: true });
        restartBtn.on('pointerdown', () => {
            this.scene.start('MainMenuScene');
        });

        // Stop game
        this.physics.pause();
        if (this.enemySpawnTimer) this.enemySpawnTimer.remove();
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
            this.scene.start('MainMenuScene');
        });
        backBtn.on('pointerover', () => backBtn.setStyle({ backgroundColor: '#555555' }));
        backBtn.on('pointerout', () => backBtn.setStyle({ backgroundColor: '#333333' }));
    }
}
