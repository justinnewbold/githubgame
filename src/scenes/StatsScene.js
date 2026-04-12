import Phaser from 'phaser';
import { gameData } from '../utils/GameData.js';
import Leaderboard, { leaderboard } from '../utils/Leaderboard.js';
import { logger } from '../utils/Logger.js';

export default class StatsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StatsScene' });
        this.currentTab = 'stats';
        this.selectedGameMode = 'gitSurvivor';
        this.returnScene = 'SettingsScene';
    }

    init(data = {}) {
        this.currentTab = data.tab || this.currentTab || 'stats';
        this.selectedGameMode = data.mode || this.selectedGameMode || 'gitSurvivor';
        this.returnScene = data.returnScene || this.returnScene || 'SettingsScene';
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
        this.createTabs();

        // Content area
        this.contentY = 140;
        this.showContent();
    }

    createTabs() {
        const tabs = [
            { id: 'stats', label: '📈 Stats', x: 130 },
            { id: 'achievements', label: '🏆 Achievements', x: 310 },
            { id: 'leaderboards', label: '🏅 Leaderboards', x: 490 },
            { id: 'records', label: '👑 Records', x: 670 }
        ];

        tabs.forEach(tab => {
            const isActive = this.currentTab === tab.id;

            const tabBtn = this.add.rectangle(tab.x, 100, 160, 40,
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
                this.scene.restart({ tab: tab.id, mode: this.selectedGameMode, returnScene: this.returnScene });
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
        } else if (this.currentTab === 'leaderboards') {
            this.showLeaderboards();
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
        const unlockedIds = Object.keys(gameData.data.achievements.unlocked || {});

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

    showLeaderboards() {
        const width = this.cameras.main.width;
        let y = this.contentY;

        // Game mode selector
        const gameModes = [
            'gitSurvivor', 'codeDefense', 'prRush', 'devCommander',
            'bugBounty', 'bossRush', 'sprintSurvivor'
        ];

        // Title
        this.add.text(width / 2, y, '🏅 Local Leaderboards', {
            fontSize: '22px',
            fontFamily: 'monospace',
            color: '#ffaa00',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        y += 40;

        // Game mode buttons
        const buttonWidth = 95;
        const startX = (width - (gameModes.length * buttonWidth)) / 2 + buttonWidth / 2;

        gameModes.forEach((mode, index) => {
            const btnX = startX + index * buttonWidth;
            const isSelected = this.selectedGameMode === mode;
            const icon = Leaderboard.getModeIcon(mode);

            const btn = this.add.rectangle(btnX, y, 90, 30,
                isSelected ? 0x00aa00 : 0x333333, 0.8);
            btn.setStrokeStyle(1, isSelected ? 0xffffff : 0x666666);
            btn.setInteractive({ useHandCursor: true });

            this.add.text(btnX, y, icon, {
                fontSize: '16px'
            }).setOrigin(0.5);

            btn.on('pointerdown', () => {
                this.scene.restart({ tab: this.currentTab, mode, returnScene: this.returnScene });
            });

            if (!isSelected) {
                btn.on('pointerover', () => btn.setFillStyle(0x555555, 0.8));
                btn.on('pointerout', () => btn.setFillStyle(0x333333, 0.8));
            }
        });

        y += 50;

        // Mode name
        const modeName = Leaderboard.getModeName(this.selectedGameMode);
        const modeIcon = Leaderboard.getModeIcon(this.selectedGameMode);
        this.add.text(width / 2, y, `${modeIcon} ${modeName}`, {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#00aaff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        y += 35;

        // Leaderboard entries
        const entries = leaderboard.getEntries(this.selectedGameMode);

        if (entries.length === 0) {
            this.add.text(width / 2, y + 80, 'No scores yet!', {
                fontSize: '16px',
                fontFamily: 'monospace',
                color: '#666666',
                fontStyle: 'italic'
            }).setOrigin(0.5);

            this.add.text(width / 2, y + 110, 'Play this game mode to set a high score.', {
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#444444'
            }).setOrigin(0.5);
        } else {
            // Header row
            this.add.text(80, y, 'RANK', {
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#888888',
                fontStyle: 'bold'
            });
            this.add.text(160, y, 'NAME', {
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#888888',
                fontStyle: 'bold'
            });
            this.add.text(350, y, 'SCORE', {
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#888888',
                fontStyle: 'bold'
            });
            this.add.text(500, y, 'DIFFICULTY', {
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#888888',
                fontStyle: 'bold'
            });
            this.add.text(650, y, 'DATE', {
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#888888',
                fontStyle: 'bold'
            });

            y += 25;

            // Entries
            entries.forEach((entry, index) => {
                const rank = index + 1;
                const rowY = y + index * 35;
                const isTop3 = rank <= 3;

                // Row background
                const rowBg = this.add.rectangle(width / 2, rowY, 700, 30,
                    isTop3 ? 0x1a2a1a : 0x1a1a2e, 0.6);
                rowBg.setStrokeStyle(1, isTop3 ? 0x00aa00 : 0x333333);

                // Rank with medal for top 3
                let rankDisplay = `#${rank}`;
                let rankColor = '#ffffff';
                if (rank === 1) {
                    rankDisplay = '🥇 1st';
                    rankColor = '#ffd700';
                } else if (rank === 2) {
                    rankDisplay = '🥈 2nd';
                    rankColor = '#c0c0c0';
                } else if (rank === 3) {
                    rankDisplay = '🥉 3rd';
                    rankColor = '#cd7f32';
                }

                this.add.text(80, rowY, rankDisplay, {
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    color: rankColor,
                    fontStyle: isTop3 ? 'bold' : 'normal'
                }).setOrigin(0, 0.5);

                // Name
                this.add.text(160, rowY, entry.name, {
                    fontSize: '16px',
                    fontFamily: 'monospace',
                    color: isTop3 ? '#00ff00' : '#ffffff',
                    fontStyle: 'bold'
                }).setOrigin(0, 0.5);

                // Score
                this.add.text(350, rowY, entry.score.toLocaleString(), {
                    fontSize: '16px',
                    fontFamily: 'monospace',
                    color: '#ffaa00',
                    fontStyle: 'bold'
                }).setOrigin(0, 0.5);

                // Difficulty
                const diffColors = {
                    normal: '#00ff00',
                    hard: '#ffaa00',
                    nightmare: '#ff0000'
                };
                this.add.text(500, rowY, entry.difficulty || 'normal', {
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: diffColors[entry.difficulty] || '#888888'
                }).setOrigin(0, 0.5);

                // Date
                this.add.text(650, rowY, Leaderboard.formatDate(entry.timestamp), {
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: '#666666'
                }).setOrigin(0, 0.5);
            });
        }
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
        backBtn.on('pointerdown', () => this.scene.start(this.returnScene));
        backBtn.on('pointerover', () => backBtn.setStyle({ backgroundColor: '#555555' }));
        backBtn.on('pointerout', () => backBtn.setStyle({ backgroundColor: '#333333' }));
    }
}
