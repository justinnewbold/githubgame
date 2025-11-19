// Legacy Code Excavator - Mining/Archaeology game mode

import Phaser from 'phaser';
import { gameData } from '../utils/GameData.js';
import SoundManager from '../utils/SoundManager.js';
import ParticleEffects from '../utils/ParticleEffects.js';

export default class LegacyExcavatorScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LegacyExcavatorScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Game state
        this.score = 0;
        this.depth = 0;
        this.energy = 100;
        this.maxEnergy = 100;
        this.inventory = [];
        this.grid = [];
        this.gridSize = { cols: 10, rows: 15 };
        this.cellSize = 60;
        this.currentDepth = 0;

        // Systems
        this.sounds = new SoundManager();
        this.particles = new ParticleEffects(this);

        // Background
        this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);

        // Create grid
        this.createGrid();

        // Create player
        this.createPlayer();

        // HUD
        this.createHUD();

        // Controls
        this.createControls();
    }

    createGrid() {
        this.gridContainer = this.add.container(100, 80);

        for (let row = 0; row < this.gridSize.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize.cols; col++) {
                const cell = this.createCell(col, row);
                this.grid[row][col] = cell;
                this.gridContainer.add([cell.bg, cell.text]);
            }
        }
    }

    createCell(col, row) {
        const x = col * this.cellSize;
        const y = row * this.cellSize;

        // Determine cell type based on depth
        const cellType = this.getCellType(row);

        const bg = this.add.rectangle(x, y, this.cellSize - 2, this.cellSize - 2, cellType.color, 0.8);
        bg.setStrokeStyle(1, 0x000000);
        bg.setOrigin(0);

        const text = this.add.text(x + this.cellSize / 2, y + this.cellSize / 2, cellType.emoji, {
            fontSize: '32px'
        }).setOrigin(0.5);

        const cell = {
            bg: bg,
            text: text,
            type: cellType,
            col: col,
            row: row,
            dug: false
        };

        // Make interactive
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerdown', () => this.digCell(cell));
        bg.on('pointerover', () => {
            if (!cell.dug) bg.setFillStyle(cellType.color, 1.0);
        });
        bg.on('pointerout', () => {
            if (!cell.dug) bg.setFillStyle(cellType.color, 0.8);
        });

        return cell;
    }

    getCellType(row) {
        const depth = row;
        const rand = Math.random();

        // Depth-based distribution
        if (depth < 3) {
            // Surface - mostly dirt, some artifacts
            if (rand < 0.7) return { emoji: '🟫', name: 'Dirt', color: 0x8B4513, value: 1, energy: 1 };
            if (rand < 0.9) return { emoji: '🪨', name: 'Rock', color: 0x808080, value: 2, energy: 2 };
            return { emoji: '📜', name: 'Old Docs', color: 0xFFD700, value: 50, energy: 1, artifact: true };
        } else if (depth < 7) {
            // Mid layer - more rocks, some gems
            if (rand < 0.5) return { emoji: '🟫', name: 'Dirt', color: 0x8B4513, value: 1, energy: 1 };
            if (rand < 0.8) return { emoji: '🪨', name: 'Rock', color: 0x808080, value: 2, energy: 2 };
            if (rand < 0.95) return { emoji: '💎', name: 'Clean Code', color: 0x00FFFF, value: 100, energy: 2, artifact: true };
            return { emoji: '⚠️', name: 'Cursed Code', color: 0xFF0000, value: -50, energy: 1, cursed: true };
        } else if (depth < 12) {
            // Deep layer - valuable artifacts
            if (rand < 0.3) return { emoji: '🪨', name: 'Rock', color: 0x808080, value: 2, energy: 3 };
            if (rand < 0.6) return { emoji: '💎', name: 'Clean Code', color: 0x00FFFF, value: 100, energy: 2, artifact: true };
            if (rand < 0.85) return { emoji: '🏆', name: 'Design Pattern', color: 0xFFD700, value: 200, energy: 2, artifact: true };
            if (rand < 0.95) return { emoji: '⚙️', name: 'Refactored Module', color: 0x00FF00, value: 150, energy: 2, artifact: true };
            return { emoji: '💀', name: 'Dead Code', color: 0x000000, value: -100, energy: 1, cursed: true };
        } else {
            // Ancient depths - legendary artifacts
            if (rand < 0.2) return { emoji: '🪨', name: 'Bedrock', color: 0x404040, value: 5, energy: 5 };
            if (rand < 0.5) return { emoji: '👑', name: 'Holy Grail', color: 0xFFFF00, value: 500, energy: 3, artifact: true, legendary: true };
            if (rand < 0.7) return { emoji: '📖', name: 'Ancient Wisdom', color: 0xFF00FF, value: 300, energy: 2, artifact: true };
            if (rand < 0.85) return { emoji: '✨', name: 'Perfect Code', color: 0xFFFFFF, value: 400, energy: 2, artifact: true, legendary: true };
            return { emoji: '🔥', name: 'Tech Debt', color: 0xFF6600, value: -200, energy: 1, cursed: true };
        }
    }

    createPlayer() {
        this.player = {
            col: 4,
            row: 0
        };

        this.playerSprite = this.add.text(
            100 + (this.player.col * this.cellSize) + this.cellSize / 2,
            80 + (this.player.row * this.cellSize) + this.cellSize / 2,
            '👷',
            { fontSize: '40px' }
        ).setOrigin(0.5);
        this.playerSprite.setDepth(10);
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
    }

    digCell(cell) {
        if (cell.dug) return;
        if (this.energy < cell.type.energy) {
            this.particles.floatingText(400, 300, 'Not enough energy!', '#ff0000');
            return;
        }

        // Can only dig adjacent cells
        const dist = Math.abs(cell.col - this.player.col) + Math.abs(cell.row - this.player.row);
        if (dist > 1) {
            this.particles.floatingText(400, 300, 'Too far away!', '#ffaa00');
            return;
        }

        cell.dug = true;
        this.energy -= cell.type.energy;
        this.score += cell.type.value;

        // Visual feedback
        cell.bg.setFillStyle(0x000000, 0.3);
        cell.text.setAlpha(0.3);

        this.sounds.playSound('hit');
        this.particles.hit(cell.bg.x + 100, cell.bg.y + 80);

        // Check for artifacts
        if (cell.type.artifact) {
            this.collectArtifact(cell.type);
        }

        // Check for cursed code
        if (cell.type.cursed) {
            this.hitCursedCode(cell.type);
        }

        // Move player to cell
        this.player.col = cell.col;
        this.player.row = cell.row;
        this.movePlayerSprite();

        // Track depth
        if (cell.row > this.currentDepth) {
            this.currentDepth = cell.row;
            this.depth = this.currentDepth * 10; // meters
        }

        this.updateHUD();

        // Check if out of energy
        if (this.energy <= 0) {
            this.endGame();
        }
    }

    collectArtifact(type) {
        this.inventory.push(type);
        this.sounds.playSound('collect');
        this.particles.collectPowerUp(
            100 + (this.player.col * this.cellSize) + this.cellSize / 2,
            80 + (this.player.row * this.cellSize) + this.cellSize / 2
        );

        const message = type.legendary ? `⭐ LEGENDARY: ${type.name}! +${type.value}` : `${type.name}! +${type.value}`;
        this.particles.floatingText(400, 300, message, type.legendary ? '#ffff00' : '#00ff00', '18px');

        // Restore some energy for good finds
        if (type.legendary) {
            this.energy = Math.min(this.maxEnergy, this.energy + 20);
        }
    }

    hitCursedCode(type) {
        this.sounds.playSound('damage');
        this.cameras.main.shake(200, 0.005);
        this.particles.explosion(
            100 + (this.player.col * this.cellSize) + this.cellSize / 2,
            80 + (this.player.row * this.cellSize) + this.cellSize / 2,
            0xff0000
        );
        this.particles.floatingText(400, 300, `${type.name}! ${type.value}`, '#ff0000', '18px');
    }

    movePlayerSprite() {
        this.tweens.add({
            targets: this.playerSprite,
            x: 100 + (this.player.col * this.cellSize) + this.cellSize / 2,
            y: 80 + (this.player.row * this.cellSize) + this.cellSize / 2,
            duration: 200,
            ease: 'Quad.easeOut'
        });
    }

    createHUD() {
        // Score
        this.scoreText = this.add.text(20, 20, 'Score: 0', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#ffff00',
            fontStyle: 'bold'
        });

        // Depth
        this.depthText = this.add.text(20, 45, 'Depth: 0m', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#00aaff'
        });

        // Energy bar
        this.add.text(20, 70, 'Energy:', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffffff'
        });

        this.energyBarBg = this.add.rectangle(90, 78, 150, 15, 0x000000);
        this.energyBar = this.add.rectangle(90, 78, 150, 15, 0x00ff00);
        this.energyBar.setOrigin(0, 0.5);

        // Artifacts count
        this.artifactsText = this.add.text(20, 95, 'Artifacts: 0', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ff00ff'
        });

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

    update() {
        // Passive energy regeneration
        if (this.energy < this.maxEnergy) {
            this.energy += 0.02;
            this.updateHUD();
        }
    }

    updateHUD() {
        this.scoreText.setText(`Score: ${Math.floor(this.score)}`);
        this.depthText.setText(`Depth: ${this.depth}m`);

        const energyPercent = this.energy / this.maxEnergy;
        this.energyBar.width = 150 * energyPercent;

        // Color based on energy
        if (energyPercent > 0.5) {
            this.energyBar.setFillStyle(0x00ff00);
        } else if (energyPercent > 0.25) {
            this.energyBar.setFillStyle(0xffff00);
        } else {
            this.energyBar.setFillStyle(0xff0000);
        }

        const artifacts = this.inventory.filter(item => item.artifact).length;
        this.artifactsText.setText(`Artifacts: ${artifacts}`);
    }

    endGame() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85);
        overlay.setOrigin(0);

        this.add.text(width / 2, height / 2 - 100, '⛏️ EXCAVATION COMPLETE! ⛏️', {
            fontSize: '28px',
            fontFamily: 'monospace',
            color: '#ffaa00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 - 40, `Final Score: ${Math.floor(this.score)}`, {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#ffff00'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 - 5, `Depth Reached: ${this.depth}m`, {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#00aaff'
        }).setOrigin(0.5);

        const artifacts = this.inventory.filter(item => item.artifact).length;
        const legendary = this.inventory.filter(item => item.legendary).length;

        this.add.text(width / 2, height / 2 + 25, `Artifacts Found: ${artifacts}`, {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#ff00ff'
        }).setOrigin(0.5);

        if (legendary > 0) {
            this.add.text(width / 2, height / 2 + 50, `⭐ Legendary Artifacts: ${legendary} ⭐`, {
                fontSize: '16px',
                fontFamily: 'monospace',
                color: '#ffff00',
                fontStyle: 'bold'
            }).setOrigin(0.5);
        }

        // Update stats
        gameData.updateStat('legacyExcavator.gamesPlayed', 1, 'add');
        gameData.updateStat('legacyExcavator.highScore', Math.floor(this.score), 'max');
        gameData.updateStat('legacyExcavator.maxDepth', this.depth, 'max');
        gameData.updateStat('legacyExcavator.artifactsFound', artifacts, 'add');
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
        this.scene.start('MainMenuScene');
    }
}
