import Phaser from 'phaser';
import { gameData } from '../utils/GameData.js';

export default class StatsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StatsScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);

        // Title
        this.add.text(width / 2, 40, '📊 Statistics & Achievements', {
            fontSize: '36px',
            fontFamily: 'monospace',
            color: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Back button
        this.createBackButton();

        // Tab system
        this.currentTab = 'stats';
        this.createTabs();

        // Content area
        this.contentY = 140;
        this.showContent();
    }

    createTabs() {
        const tabs = [
            { id: 'stats', label: '📈 Stats', x: 200 },
            { id: 'achievements', label: '🏆 Achievements', x: 400 },
            { id: 'records', label: '👑 Records', x: 600 }
        ];

        tabs.forEach(tab => {
            const isActive = this.currentTab === tab.id;

            const tabBtn = this.add.rectangle(tab.x, 100, 180, 40,
                isActive ? 0x00aa00 : 0x333333, 0.8);
            tabBtn.setStrokeStyle(2, isActive ? 0xffffff : 0x666666);
            tabBtn.setInteractive({ useHandCursor: true });

            const tabText = this.add.text(tab.x, 100, tab.label, {
                fontSize: '14px',
                fontFamily: 'monospace',
                color: isActive ? '#ffffff' : '#888888',
                fontStyle: isActive ? 'bold' : 'normal'
            }).setOrigin(0.5);

            tabBtn.on('pointerdown', () => {
                this.currentTab = tab.id;
                this.scene.restart();
            });

            if (!isActive) {
                tabBtn.on('pointerover', () => {
                    tabBtn.setFillStyle(0x555555, 0.8);
                    tabText.setColor('#ffffff');
                });

                tabBtn.on('pointerout', () => {
                    tabBtn.setFillStyle(0x333333, 0.8);
                    tabText.setColor('#888888');
                });
            }
        });
    }

    showContent() {
        if (this.currentTab === 'stats') {
            this.showStats();
        } else if (this.currentTab === 'achievements') {
            this.showAchievements();
        } else if (this.currentTab === 'records') {
            this.showRecords();
        }
    }

    showStats() {
        const stats = gameData.data.stats;
        let y = this.contentY;

        // Global Stats
        this.createStatSection('🌍 Global Statistics', y);
        y += 40;

        this.createStatLine('Total Games Played', stats.gamesPlayed, y);
        y += 30;
        this.createStatLine('Total Score', stats.totalScore, y);
        y += 30;
        this.createStatLine('Total Playtime', this.formatTime(stats.totalTimeplayed), y);
        y += 50;

        // Git Survivor Stats
        this.createStatSection('🗡️ Git Survivor', y);
        y += 40;
        this.createStatLine('Games Played', stats.gitSurvivor.gamesPlayed, y);
        y += 25;
        this.createStatLine('High Score', stats.gitSurvivor.highScore, y);
        y += 25;
        this.createStatLine('Total Enemies Killed', stats.gitSurvivor.enemiesKilled, y);
        y += 40;

        // Code Defense Stats
        this.createStatSection('🏰 Code Defense', y);
        y += 40;
        this.createStatLine('Games Played', stats.codeDefense.gamesPlayed, y);
        y += 25;
        this.createStatLine('Highest Wave', stats.codeDefense.highWave, y);
        y += 25;
        this.createStatLine('Towers Placed', stats.codeDefense.towersPlaced, y);
        y += 40;

        // Column 2
        let y2 = this.contentY;

        // PR Rush Stats
        this.createStatSection('⏰ PR Rush', y2, 500);
        y2 += 40;
        this.createStatLine('Games Played', stats.prRush.gamesPlayed, y2, 500);
        y2 += 25;
        this.createStatLine('Best Accuracy', `${stats.prRush.bestAccuracy}%`, y2, 500);
        y2 += 25;
        this.createStatLine('PRs Reviewed', stats.prRush.prsReviewed, y2, 500);
        y2 += 40;

        // Dev Commander Stats
        this.createStatSection('⚔️ Dev Commander', y2, 500);
        y2 += 40;
        this.createStatLine('Games Played', stats.devCommander.gamesPlayed, y2, 500);
        y2 += 25;
        this.createStatLine('Max Sprints', stats.devCommander.maxSprints, y2, 500);
        y2 += 25;
        this.createStatLine('Tasks Completed', stats.devCommander.tasksCompleted, y2, 500);
    }

    showAchievements() {
        const allAchievements = gameData.getAchievements();
        const unlockedIds = gameData.data.achievements;

        let y = this.contentY;

        this.add.text(400, y, `Unlocked: ${unlockedIds.length} / ${allAchievements.length}`, {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#ffaa00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        y += 40;

        // Progress bar
        const progressWidth = 600;
        const progressPercent = allAchievements.length > 0
            ? unlockedIds.length / allAchievements.length
            : 0;

        this.add.rectangle(400, y, progressWidth, 20, 0x333333);
        this.add.rectangle(400 - (progressWidth / 2) + (progressWidth * progressPercent / 2), y,
            progressWidth * progressPercent, 20, 0x00ff00);

        y += 40;

        // Grid of achievements (2 columns)
        allAchievements.forEach((achievement, index) => {
            const unlocked = unlockedIds.includes(achievement.id);
            const col = index % 2;
            const row = Math.floor(index / 2);

            const x = 200 + (col * 400);
            const achievementY = y + (row * 80);

            const box = this.add.rectangle(x, achievementY, 350, 70,
                unlocked ? 0x00aa00 : 0x333333, 0.3);
            box.setStrokeStyle(2, unlocked ? 0x00ff00 : 0x666666);

            // Icon
            this.add.text(x - 150, achievementY, achievement.icon, {
                fontSize: '32px'
            });

            // Name and description
            this.add.text(x - 110, achievementY - 15, achievement.name, {
                fontSize: '14px',
                fontFamily: 'monospace',
                color: unlocked ? '#00ff00' : '#666666',
                fontStyle: 'bold'
            });

            this.add.text(x - 110, achievementY + 10,
                unlocked ? achievement.desc : '???', {
                fontSize: '11px',
                fontFamily: 'monospace',
                color: unlocked ? '#ffffff' : '#444444'
            });

            // Lock icon if not unlocked
            if (!unlocked) {
                this.add.text(x + 140, achievementY, '🔒', {
                    fontSize: '24px'
                });
            }
        });
    }

    showRecords() {
        const stats = gameData.data.stats;
        let y = this.contentY + 40;

        this.add.text(400, y - 20, '👑 Your Personal Bests', {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#ffaa00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const records = [
            {
                title: '🗡️ Git Survivor High Score',
                value: stats.gitSurvivor.highScore,
                icon: '🏆'
            },
            {
                title: '🗡️ Git Survivor Most Kills',
                value: stats.gitSurvivor.enemiesKilled,
                icon: '💀'
            },
            {
                title: '🏰 Code Defense Highest Wave',
                value: stats.codeDefense.highWave,
                icon: '🌊'
            },
            {
                title: '🏰 Code Defense Towers Placed',
                value: stats.codeDefense.towersPlaced,
                icon: '🏗️'
            },
            {
                title: '⏰ PR Rush Best Accuracy',
                value: `${stats.prRush.bestAccuracy}%`,
                icon: '🎯'
            },
            {
                title: '⏰ PR Rush Total PRs',
                value: stats.prRush.prsReviewed,
                icon: '📝'
            },
            {
                title: '⚔️ Dev Commander Max Sprints',
                value: stats.devCommander.maxSprints,
                icon: '🏃'
            },
            {
                title: '⚔️ Dev Commander Total Tasks',
                value: stats.devCommander.tasksCompleted,
                icon: '✅'
            }
        ];

        records.forEach((record, index) => {
            const recordY = y + (index * 50);

            const box = this.add.rectangle(400, recordY, 700, 45, 0x1a1a2e, 0.8);
            box.setStrokeStyle(2, 0x00aaff);

            this.add.text(130, recordY, record.icon, {
                fontSize: '24px'
            });

            this.add.text(170, recordY, record.title, {
                fontSize: '14px',
                fontFamily: 'monospace',
                color: '#ffffff'
            }).setOrigin(0, 0.5);

            this.add.text(650, recordY, String(record.value), {
                fontSize: '20px',
                fontFamily: 'monospace',
                color: '#00ff00',
                fontStyle: 'bold'
            }).setOrigin(1, 0.5);
        });
    }

    createStatSection(title, y, x = 200) {
        this.add.text(x, y, title, {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#00aaff',
            fontStyle: 'bold'
        });

        this.add.rectangle(x + 100, y + 12, 200, 2, 0x00aaff);
    }

    createStatLine(label, value, y, x = 100) {
        this.add.text(x, y, label + ':', {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#888888'
        });

        this.add.text(x + 250, y, String(value), {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#00ff00',
            fontStyle: 'bold'
        });
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
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
        backBtn.on('pointerdown', () => this.scene.start('SettingsScene'));
        backBtn.on('pointerover', () => backBtn.setStyle({ backgroundColor: '#555555' }));
        backBtn.on('pointerout', () => backBtn.setStyle({ backgroundColor: '#333333' }));
    }
}
