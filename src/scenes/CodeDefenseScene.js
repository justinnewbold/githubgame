import Phaser from 'phaser';

export default class CodeDefenseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CodeDefenseScene' });
    }

    init() {
        this.health = 100;
        this.money = 500;
        this.wave = 1;
        this.enemies = [];
        this.towers = [];
        this.path = [];
        this.selectedTowerType = null;
        this.waveInProgress = false;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        this.add.rectangle(0, 0, width, height, 0x0a0a1a).setOrigin(0);

        // Title
        this.add.text(width / 2, 20, '🏰 Code Defense', {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#ff4444'
        }).setOrigin(0.5);

        // Back button
        this.createBackButton();

        // Create path for enemies
        this.createPath();

        // HUD
        this.createHUD();

        // Tower shop
        this.createTowerShop();

        // Instructions
        this.showInstructions();

        // Click handler for placing towers
        this.input.on('pointerdown', (pointer) => {
            if (this.selectedTowerType && pointer.y > 100 && pointer.y < 500) {
                this.placeTower(pointer.x, pointer.y);
            }
        });

        // Start wave button
        this.createStartWaveButton();
    }

    createPath() {
        // Define waypoints for enemy path
        this.waypoints = [
            { x: 50, y: 200 },
            { x: 200, y: 200 },
            { x: 200, y: 350 },
            { x: 400, y: 350 },
            { x: 400, y: 200 },
            { x: 600, y: 200 },
            { x: 600, y: 400 },
            { x: 750, y: 400 }
        ];

        // Draw path
        const graphics = this.add.graphics();
        graphics.lineStyle(30, 0x333333, 1);
        graphics.beginPath();
        graphics.moveTo(this.waypoints[0].x, this.waypoints[0].y);

        for (let i = 1; i < this.waypoints.length; i++) {
            graphics.lineTo(this.waypoints[i].x, this.waypoints[i].y);
        }
        graphics.strokePath();

        // Mark start and end
        this.add.circle(this.waypoints[0].x, this.waypoints[0].y, 20, 0x00ff00).setAlpha(0.5);
        this.add.text(this.waypoints[0].x, this.waypoints[0].y - 30, 'START', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#00ff00'
        }).setOrigin(0.5);

        const endPoint = this.waypoints[this.waypoints.length - 1];
        this.add.circle(endPoint.x, endPoint.y, 20, 0xff0000).setAlpha(0.5);
        this.add.text(endPoint.x, endPoint.y - 30, 'PROD', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    createHUD() {
        // Health
        this.healthText = this.add.text(20, 60, `❤️ Production Health: ${this.health}%`, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ff0000'
        });

        // Money
        this.moneyText = this.add.text(300, 60, `💰 Budget: $${this.money}`, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#00ff00'
        });

        // Wave
        this.waveText = this.add.text(550, 60, `🌊 Wave: ${this.wave}`, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#00aaff'
        });
    }

    createTowerShop() {
        const shopY = 520;
        const shopBg = this.add.rectangle(400, shopY, 780, 70, 0x1a1a2e).setOrigin(0.5);
        shopBg.setStrokeStyle(2, 0xffaa00);

        this.add.text(400, shopY - 25, 'Defense Arsenal:', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#ffaa00'
        }).setOrigin(0.5);

        const towers = [
            { name: 'Unit Test', cost: 100, damage: 10, range: 80, color: 0x00ff00, emoji: '✅' },
            { name: 'Linter', cost: 150, damage: 15, range: 100, color: 0xffaa00, emoji: '🔍' },
            { name: 'Code Review', cost: 250, damage: 25, range: 120, color: 0x00aaff, emoji: '👀' },
            { name: 'CI/CD', cost: 400, damage: 40, range: 150, color: 0xff00ff, emoji: '⚙️' }
        ];

        towers.forEach((tower, index) => {
            const x = 120 + (index * 160);
            const y = shopY + 5;

            const btn = this.add.rectangle(x, y, 140, 40, tower.color, 0.3);
            btn.setStrokeStyle(2, tower.color);
            btn.setInteractive({ useHandCursor: true });

            this.add.text(x - 60, y, tower.emoji, { fontSize: '20px' });
            this.add.text(x - 35, y - 8, tower.name, {
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#ffffff'
            });
            this.add.text(x - 35, y + 8, `$${tower.cost}`, {
                fontSize: '10px',
                fontFamily: 'monospace',
                color: '#00ff00'
            });

            btn.on('pointerdown', () => {
                if (this.money >= tower.cost) {
                    this.selectedTowerType = tower;
                    this.highlightSelectedTower(btn);
                }
            });

            btn.on('pointerover', () => {
                btn.setFillStyle(tower.color, 0.6);
            });

            btn.on('pointerout', () => {
                if (this.selectedTowerType !== tower) {
                    btn.setFillStyle(tower.color, 0.3);
                }
            });

            tower.button = btn;
        });
    }

    highlightSelectedTower(button) {
        // Reset all buttons
        const towers = [
            { color: 0x00ff00 },
            { color: 0xffaa00 },
            { color: 0x00aaff },
            { color: 0xff00ff }
        ];

        this.children.list.forEach(child => {
            if (child.type === 'Rectangle' && child.y > 500) {
                towers.forEach(t => {
                    if (child.fillColor === t.color) {
                        child.setFillStyle(t.color, 0.3);
                    }
                });
            }
        });

        // Highlight selected
        if (this.selectedTowerType) {
            button.setFillStyle(this.selectedTowerType.color, 0.8);
        }
    }

    placeTower(x, y) {
        if (!this.selectedTowerType || this.money < this.selectedTowerType.cost) return;

        // Check if too close to path
        let tooClose = false;
        this.waypoints.forEach(wp => {
            const dist = Phaser.Math.Distance.Between(x, y, wp.x, wp.y);
            if (dist < 50) tooClose = true;
        });

        if (tooClose) {
            this.showFloatingText(x, y, 'Too close to path!', '#ff0000');
            return;
        }

        // Check if too close to other towers
        this.towers.forEach(tower => {
            const dist = Phaser.Math.Distance.Between(x, y, tower.x, tower.y);
            if (dist < 40) tooClose = true;
        });

        if (tooClose) {
            this.showFloatingText(x, y, 'Too close!', '#ff0000');
            return;
        }

        // Place tower
        const tower = this.add.circle(x, y, 15, this.selectedTowerType.color);
        tower.setStrokeStyle(2, 0xffffff);

        // Range indicator (shows on hover)
        const rangeCircle = this.add.circle(x, y, this.selectedTowerType.range, 0xffffff, 0.1);
        rangeCircle.setStrokeStyle(1, 0xffffff, 0.3);
        rangeCircle.setVisible(false);

        tower.setInteractive();
        tower.on('pointerover', () => rangeCircle.setVisible(true));
        tower.on('pointerout', () => rangeCircle.setVisible(false));

        // Tower data
        tower.towerData = {
            ...this.selectedTowerType,
            rangeCircle: rangeCircle,
            lastShot: 0,
            fireRate: 1000 // ms between shots
        };

        this.towers.push(tower);
        this.money -= this.selectedTowerType.cost;
        this.updateHUD();

        this.showFloatingText(x, y - 30, `-$${this.selectedTowerType.cost}`, '#ff0000');

        // Add emoji above tower
        this.add.text(x, y, this.selectedTowerType.emoji, {
            fontSize: '16px'
        }).setOrigin(0.5);
    }

    createStartWaveButton() {
        const btn = this.add.rectangle(700, 60, 80, 30, 0x00ff00, 0.8);
        btn.setStrokeStyle(2, 0xffffff);
        btn.setInteractive({ useHandCursor: true });

        this.waveButtonText = this.add.text(700, 60, 'Start Wave', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        btn.on('pointerdown', () => {
            if (!this.waveInProgress) {
                this.startWave();
            }
        });

        btn.on('pointerover', () => btn.setFillStyle(0x00ff00, 1.0));
        btn.on('pointerout', () => btn.setFillStyle(0x00ff00, 0.8));

        this.waveButton = btn;
    }

    startWave() {
        this.waveInProgress = true;
        this.waveButton.setFillStyle(0x666666, 0.5);
        this.waveButtonText.setText('Wave Active');

        const enemyCount = 5 + (this.wave * 2);
        let spawned = 0;

        const spawnTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.spawnEnemy();
                spawned++;
                if (spawned >= enemyCount) {
                    spawnTimer.remove();
                }
            },
            loop: true
        });
    }

    spawnEnemy() {
        const enemyTypes = [
            { name: '🐛 Bug', health: 30, speed: 60, reward: 20, color: 0xff00ff },
            { name: '🔓 SQL Injection', health: 50, speed: 40, reward: 40, color: 0xff0000 },
            { name: '💣 XSS Attack', health: 40, speed: 70, reward: 30, color: 0xffaa00 },
            { name: '🌊 DDoS', health: 70, speed: 80, reward: 60, color: 0x00ffff }
        ];

        const type = Phaser.Utils.Array.GetRandom(enemyTypes);
        const scaleFactor = 1 + (this.wave * 0.1); // Enemies get stronger each wave

        const enemy = this.add.circle(
            this.waypoints[0].x,
            this.waypoints[0].y,
            10,
            type.color
        );

        enemy.setStrokeStyle(2, 0xffffff);
        this.physics.add.existing(enemy);

        enemy.enemyData = {
            name: type.name,
            health: type.health * scaleFactor,
            maxHealth: type.health * scaleFactor,
            speed: type.speed,
            reward: Math.floor(type.reward * scaleFactor),
            waypointIndex: 0
        };

        // Health bar background
        enemy.healthBarBg = this.add.rectangle(enemy.x, enemy.y - 20, 30, 4, 0x000000);
        enemy.healthBar = this.add.rectangle(enemy.x, enemy.y - 20, 30, 4, 0x00ff00);

        this.enemies.push(enemy);
    }

    update(time) {
        // Update enemies
        this.updateEnemies();

        // Towers shoot
        this.updateTowers(time);

        // Check if wave is complete
        if (this.waveInProgress && this.enemies.length === 0) {
            this.waveComplete();
        }

        // Update HUD
        this.updateHUD();
    }

    updateEnemies() {
        this.enemies.forEach((enemy, index) => {
            if (!enemy.active) return;

            const data = enemy.enemyData;
            const currentWaypoint = this.waypoints[data.waypointIndex];

            if (!currentWaypoint) {
                // Enemy reached the end - damage production!
                this.health -= 10;
                this.showFloatingText(750, 400, '-10 HP', '#ff0000');
                this.cameras.main.shake(200, 0.01);

                if (enemy.healthBarBg) enemy.healthBarBg.destroy();
                if (enemy.healthBar) enemy.healthBar.destroy();
                enemy.destroy();
                this.enemies.splice(index, 1);

                if (this.health <= 0) {
                    this.gameOver();
                }
                return;
            }

            // Move toward waypoint
            const angle = Phaser.Math.Angle.Between(
                enemy.x, enemy.y,
                currentWaypoint.x, currentWaypoint.y
            );

            enemy.body.setVelocity(
                Math.cos(angle) * data.speed,
                Math.sin(angle) * data.speed
            );

            // Check if reached waypoint
            const dist = Phaser.Math.Distance.Between(
                enemy.x, enemy.y,
                currentWaypoint.x, currentWaypoint.y
            );

            if (dist < 5) {
                data.waypointIndex++;
            }

            // Update health bar
            if (enemy.healthBar && enemy.healthBarBg) {
                enemy.healthBar.setPosition(enemy.x, enemy.y - 20);
                enemy.healthBarBg.setPosition(enemy.x, enemy.y - 20);
                const healthPercent = data.health / data.maxHealth;
                enemy.healthBar.width = 30 * healthPercent;

                // Color based on health
                if (healthPercent > 0.6) enemy.healthBar.setFillStyle(0x00ff00);
                else if (healthPercent > 0.3) enemy.healthBar.setFillStyle(0xffaa00);
                else enemy.healthBar.setFillStyle(0xff0000);
            }

            // Remove if dead
            if (data.health <= 0) {
                this.money += data.reward;
                this.showFloatingText(enemy.x, enemy.y, `+$${data.reward}`, '#00ff00');

                if (enemy.healthBarBg) enemy.healthBarBg.destroy();
                if (enemy.healthBar) enemy.healthBar.destroy();
                enemy.destroy();
                this.enemies.splice(index, 1);
            }
        });
    }

    updateTowers(time) {
        this.towers.forEach(tower => {
            const data = tower.towerData;

            // Check if can shoot
            if (time - data.lastShot < data.fireRate) return;

            // Find enemy in range
            let target = null;
            let maxProgress = -1;

            this.enemies.forEach(enemy => {
                const dist = Phaser.Math.Distance.Between(tower.x, tower.y, enemy.x, enemy.y);
                if (dist <= data.range && enemy.enemyData.waypointIndex > maxProgress) {
                    target = enemy;
                    maxProgress = enemy.enemyData.waypointIndex;
                }
            });

            if (target) {
                // Shoot!
                data.lastShot = time;
                this.shootProjectile(tower, target, data.damage);
            }
        });
    }

    shootProjectile(tower, target, damage) {
        const projectile = this.add.circle(tower.x, tower.y, 3, tower.towerData.color);

        this.tweens.add({
            targets: projectile,
            x: target.x,
            y: target.y,
            duration: 200,
            onComplete: () => {
                if (target.active) {
                    target.enemyData.health -= damage;
                    this.cameras.main.flash(30, 255, 255, 255, false, 0.05);
                }
                projectile.destroy();
            }
        });
    }

    waveComplete() {
        this.waveInProgress = false;
        this.wave++;
        this.money += 100;

        const width = this.cameras.main.width;
        this.showFloatingText(width / 2, 250, `Wave ${this.wave - 1} Complete! +$100`, '#00ff00');

        this.waveButton.setFillStyle(0x00ff00, 0.8);
        this.waveButtonText.setText('Start Wave');
    }

    showFloatingText(x, y, text, color) {
        const floatingText = this.add.text(x, y, text, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: color,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.tweens.add({
            targets: floatingText,
            y: y - 40,
            alpha: 0,
            duration: 1500,
            onComplete: () => floatingText.destroy()
        });
    }

    updateHUD() {
        this.healthText.setText(`❤️ Production Health: ${Math.max(0, this.health)}%`);
        this.moneyText.setText(`💰 Budget: $${this.money}`);
        this.waveText.setText(`🌊 Wave: ${this.wave}`);
    }

    gameOver() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);

        this.add.text(width / 2, height / 2 - 50, 'PRODUCTION DOWN!', {
            fontSize: '48px',
            fontFamily: 'monospace',
            color: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const messages = [
            '💥 The hackers won',
            '🔥 Should have added more tests',
            '💀 Security audit: FAILED',
            '☠️ Your CI/CD pipeline has left the chat'
        ];

        this.add.text(width / 2, height / 2, Phaser.Utils.Array.GetRandom(messages), {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffaa00',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 40, `Survived ${this.wave - 1} waves`, {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#00ff00'
        }).setOrigin(0.5);

        const restartBtn = this.add.text(width / 2, height / 2 + 100, '[ Return to Menu ]', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);
        restartBtn.setInteractive({ useHandCursor: true });
        restartBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));

        this.physics.pause();
    }

    showInstructions() {
        const msg = this.add.text(400, 510, '💡 Buy towers and place them to defend production from bugs!', {
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#888888'
        }).setOrigin(0.5);

        this.time.delayedCall(8000, () => {
            this.tweens.add({
                targets: msg,
                alpha: 0,
                duration: 1000,
                onComplete: () => msg.destroy()
            });
        });
    }

    createBackButton() {
        const backBtn = this.add.text(20, 20, '← Back', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 }
        });
        backBtn.setInteractive({ useHandCursor: true });
        backBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));
        backBtn.on('pointerover', () => backBtn.setStyle({ backgroundColor: '#555555' }));
        backBtn.on('pointerout', () => backBtn.setStyle({ backgroundColor: '#333333' }));
    }
}
