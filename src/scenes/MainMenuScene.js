import Phaser from 'phaser';
import { gameData } from '../utils/GameData.js';
import { logger } from '../utils/Logger.js';
import { musicManager } from '../utils/MusicManager.js';
import { saveStateManager } from '../utils/SaveStateManager.js';
import { shareManager } from '../utils/ShareManager.js';
import { challengeSystem } from '../utils/ChallengeSystem.js';

const GAME_MODES = [
    {
        title: '🗡️ Git Survivor',
        description: 'Roguelike: Face merge conflicts & bugs!',
        sceneName: 'GitSurvivorScene',
        color: 0x4a90e2
    },
    {
        title: '🏰 Code Defense',
        description: 'Tower Defense: Protect your codebase!',
        sceneName: 'CodeDefenseScene',
        color: 0xe24a4a
    },
    {
        title: '⏰ PR Rush',
        description: 'Time Management: Review PRs under pressure!',
        sceneName: 'PRRushScene',
        color: 0xe2a94a
    },
    {
        title: '⚔️ Dev Commander',
        description: 'RTS: Manage your dev team!',
        sceneName: 'DevCommanderScene',
        color: 0x7e4ae2
    },
    {
        title: '🏰 Debug Dungeon',
        description: 'Dungeon Crawler: Clear rooms of bugs!',
        sceneName: 'DebugDungeonScene',
        color: 0x9b59b6
    },
    {
        title: '🏎️ Refactor Race',
        description: 'Time Trial: Refactor code at speed!',
        sceneName: 'RefactorRaceScene',
        color: 0x16a085
    },
    {
        title: '🏃 Sprint Survivor',
        description: 'Endless Runner: Dodge to survive!',
        sceneName: 'SprintSurvivorScene',
        color: 0x3498db
    },
    {
        title: '🐛 Bug Bounty',
        description: 'Puzzle: Fix bugs with limited moves!',
        sceneName: 'BugBountyScene',
        color: 0xe74c3c
    },
    {
        title: '⛏️ Legacy Excavator',
        description: 'Mining: Dig for code artifacts!',
        sceneName: 'LegacyExcavatorScene',
        color: 0xf39c12
    },
    {
        title: '👹 Boss Rush',
        description: 'Challenge: Fight all bosses!',
        sceneName: 'BossRushScene',
        color: 0xc0392b
    }
];

export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
        this.currentPage = 0;
        this.modesPerPage = 4;
    }

    init(data = {}) {
        this.currentPage = data.page || 0;
    }

    create() {
        musicManager.init();
        musicManager.play('menu');

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.continueState = saveStateManager.load('quick-save');
        this.latestAchievement = gameData.getLastUnlockedAchievement();
        this.pageCount = Math.ceil(GAME_MODES.length / this.modesPerPage);
        this.currentPage = Phaser.Math.Clamp(this.currentPage, 0, this.pageCount - 1);
        this.featuredChallenge = this.getFeaturedChallenge();

        this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);

        this.createDifficultySelector();
        this.createUtilityButtons(width);
        this.createHeader(width);
        this.createQuickAccessBar(width);
        this.createModeSection(width);
        this.createSidebarPanels(width, height);
        this.registerKeyboardShortcuts();

        this.add.text(width / 2, height - 20,
            'Made with ❤️, bugs, and suspiciously fast hotfixes', {
                fontSize: '10px',
                fontFamily: 'monospace',
                color: '#555555'
            }).setOrigin(0.5);
    }

    createHeader(width) {
        this.add.text(width / 2, 80, 'GitGame', {
            fontSize: '64px',
            fontFamily: 'monospace',
            color: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, 130, '⚠️ Only the Best Devs Survive! ⚠️', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffaa00'
        }).setOrigin(0.5);

        const quotes = [
            '"Works on my machine" - Famous Last Words',
            '"It\'s not a bug, it\'s a feature" - Survivor Chronicles',
            '"Just one more merge..." - Epitaph',
            '"I\'ll fix it in production" - Legends Never Die',
            '"Who needs tests anyway?" - Natural Selection'
        ];

        this.add.text(width / 2, 160, Phaser.Utils.Array.GetRandom(quotes), {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#888888',
            fontStyle: 'italic'
        }).setOrigin(0.5);
    }

    createUtilityButtons(width) {
        const buttonConfig = {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 }
        };

        const shareBtn = this.add.text(width - 130, 20, '📤 Share Stats', buttonConfig);
        shareBtn.setOrigin(1, 0);
        shareBtn.setInteractive({ useHandCursor: true });
        shareBtn.on('pointerdown', () => this.shareStats());
        shareBtn.on('pointerover', () => shareBtn.setStyle({ backgroundColor: '#555555' }));
        shareBtn.on('pointerout', () => shareBtn.setStyle({ backgroundColor: '#333333' }));

        const settingsBtn = this.add.text(width - 20, 20, '⚙️ Settings', buttonConfig);
        settingsBtn.setOrigin(1, 0);
        settingsBtn.setInteractive({ useHandCursor: true });
        settingsBtn.on('pointerdown', () => this.scene.start('SettingsScene'));
        settingsBtn.on('pointerover', () => settingsBtn.setStyle({ backgroundColor: '#555555' }));
        settingsBtn.on('pointerout', () => settingsBtn.setStyle({ backgroundColor: '#333333' }));
    }

    createQuickAccessBar(width) {
        const actions = [
            { label: '📊 Stats', scene: 'StatsScene', hotkey: 'S', x: width / 2 - 170, data: { returnScene: 'MainMenuScene' } },
            { label: '🏆 Achievements', scene: 'AchievementsScene', hotkey: 'A', x: width / 2, data: {} },
            { label: '📋 Challenges', scene: 'ChallengesScene', hotkey: 'D', x: width / 2 + 170, data: {} }
        ];

        actions.forEach(({ label, scene, hotkey, x, data }) => {
            const btn = this.add.text(x, 198, `${label} [${hotkey}]`, {
                fontSize: '13px',
                fontFamily: 'monospace',
                color: '#ffffff',
                backgroundColor: '#243b53',
                padding: { x: 10, y: 6 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            btn.on('pointerdown', () => this.scene.start(scene, data));
            btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#335c81' }));
            btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#243b53' }));
        });
    }

    createModeSection(width) {
        const sectionTop = this.continueState ? 245 : 225;

        if (this.continueState) {
            this.createContinueButton(width / 2, sectionTop - 35);
        }

        this.add.text(width / 2, sectionTop + 10, 'Choose Your Incident Response', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#00d4ff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, sectionTop + 32,
            `Page ${this.currentPage + 1}/${this.pageCount} • Press ←/→ to browse • Press 1-4 to launch`, {
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#9ca3af'
            }).setOrigin(0.5);

        this.createPageControls(width / 2, sectionTop + 32);

        const visibleModes = this.getVisibleModes();
        visibleModes.forEach((mode, index) => {
            this.createGameModeButton(width / 2, sectionTop + 78 + index * 72, mode, index);
        });
    }

    createPageControls(centerX, y) {
        const prevBtn = this.add.text(centerX - 250, y, this.currentPage > 0 ? '◀ Prev' : '◀', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: this.currentPage > 0 ? '#ffffff' : '#555555',
            backgroundColor: '#222831',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5);

        if (this.currentPage > 0) {
            prevBtn.setInteractive({ useHandCursor: true });
            prevBtn.on('pointerdown', () => this.changePage(-1));
        }

        const nextBtn = this.add.text(centerX + 250, y, this.currentPage < this.pageCount - 1 ? 'Next ▶' : '▶', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: this.currentPage < this.pageCount - 1 ? '#ffffff' : '#555555',
            backgroundColor: '#222831',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5);

        if (this.currentPage < this.pageCount - 1) {
            nextBtn.setInteractive({ useHandCursor: true });
            nextBtn.on('pointerdown', () => this.changePage(1));
        }
    }

    createSidebarPanels(width, height) {
        this.createChallengePanel(160, height - 96);
        this.createProgressPanel(width - 160, height - 96);
    }

    createChallengePanel(x, y) {
        const panel = this.add.rectangle(x, y, 280, 118, 0x111827, 0.92)
            .setStrokeStyle(2, 0xf59e0b);

        this.add.text(panel.x - 120, panel.y - 40, 'Daily Challenge Spotlight', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#fbbf24',
            fontStyle: 'bold'
        });

        const challenge = this.featuredChallenge;
        const body = challenge
            ? `${challenge.displayDescription}\nProgress: ${challenge.progress}/${challenge.target} • Reset: ${challengeSystem.formatTimeRemaining(challengeSystem.getDailyTimeRemaining())}`
            : 'No active challenge right now. Check back after the next reset!';

        this.add.text(panel.x - 120, panel.y - 8, body, {
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#ffffff',
            wordWrap: { width: 235 },
            lineSpacing: 6
        });

        const openBtn = this.add.text(panel.x - 120, panel.y + 36, 'Open Challenges [D]', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#111827',
            backgroundColor: '#fbbf24',
            padding: { x: 8, y: 5 }
        }).setInteractive({ useHandCursor: true });

        openBtn.on('pointerdown', () => this.scene.start('ChallengesScene'));
        openBtn.on('pointerover', () => openBtn.setStyle({ backgroundColor: '#fcd34d' }));
        openBtn.on('pointerout', () => openBtn.setStyle({ backgroundColor: '#fbbf24' }));
    }

    createDifficultySelector() {
        const difficulties = ['normal', 'hard', 'nightmare'];
        const currentDifficulty = gameData.getDifficulty();

        this.add.text(20, 20, 'Difficulty:', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#ffffff'
        });

        difficulties.forEach((difficulty, index) => {
            const x = 100 + (index * 100);
            const y = 20;
            const colors = { normal: 0x00ff00, hard: 0xffaa00, nightmare: 0xff0000 };
            const labels = { normal: '😊 Normal', hard: '😅 Hard', nightmare: '💀 Nightmare' };
            const isSelected = difficulty === currentDifficulty;

            const btn = this.add.text(x, y, labels[difficulty], {
                fontSize: '11px',
                fontFamily: 'monospace',
                color: isSelected ? '#ffffff' : '#888888',
                backgroundColor: isSelected ? '#' + colors[difficulty].toString(16).padStart(6, '0') : '#333333',
                padding: { x: 8, y: 4 }
            });

            btn.setInteractive({ useHandCursor: true });
            btn.on('pointerdown', () => {
                gameData.setDifficulty(difficulty);
                this.scene.restart({ page: this.currentPage });
            });
            btn.on('pointerover', () => {
                if (!isSelected) {
                    btn.setStyle({ backgroundColor: '#555555' });
                }
            });
            btn.on('pointerout', () => {
                if (!isSelected) {
                    btn.setStyle({ backgroundColor: '#333333' });
                }
            });
        });

        const gamesPlayed = gameData.getStat('gamesPlayed');
        const totalScore = gameData.getStat('totalScore');
        if (gamesPlayed > 0) {
            this.add.text(20, 45, `Games Played: ${gamesPlayed} | Total Score: ${totalScore}`, {
                fontSize: '10px',
                fontFamily: 'monospace',
                color: '#888888'
            });
        }
    }

    createProgressPanel(x, y) {
        const panel = this.add.rectangle(x, y, 280, 118, 0x111827, 0.92)
            .setStrokeStyle(2, 0x00aaff);

        const unlockedCount = Object.keys(gameData.data.achievements.unlocked || {}).length;
        const totalAchievements = gameData.getAchievements().length;
        const latestLine = this.latestAchievement
            ? `${this.latestAchievement.icon} ${this.latestAchievement.name}`
            : 'No achievements yet — squash a few bugs!';

        this.add.text(panel.x - 120, panel.y - 40, 'Progress Snapshot', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#00aaff',
            fontStyle: 'bold'
        });

        this.add.text(panel.x - 120, panel.y - 10,
            `🏆 ${unlockedCount}/${totalAchievements} achievements\n🎯 Best Git Survivor: ${gameData.getStat('gitSurvivor.highScore')}\n🆕 ${latestLine}`,
            {
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#ffffff',
                lineSpacing: 8,
                wordWrap: { width: 230 }
            });

        const statsBtn = this.add.text(panel.x - 120, panel.y + 36, 'Open Stats [S]', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#111827',
            backgroundColor: '#38bdf8',
            padding: { x: 8, y: 5 }
        }).setInteractive({ useHandCursor: true });

        statsBtn.on('pointerdown', () => this.scene.start('StatsScene', { returnScene: 'MainMenuScene' }));
        statsBtn.on('pointerover', () => statsBtn.setStyle({ backgroundColor: '#7dd3fc' }));
        statsBtn.on('pointerout', () => statsBtn.setStyle({ backgroundColor: '#38bdf8' }));
    }

    createContinueButton(x, y) {
        const timestamp = new Date(this.continueState.timestamp).toLocaleString();
        const button = this.add.rectangle(x, y, 600, 44, 0x00a86b, 0.88)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive({ useHandCursor: true });

        const title = this.add.text(x, y - 8, '▶ Continue Last Git Survivor Run [C]', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const subtitle = this.add.text(x, y + 10,
            `Level ${this.continueState.data?.level || 1} • Score ${this.continueState.data?.score || 0} • Saved ${timestamp}`,
            {
                fontSize: '10px',
                fontFamily: 'monospace',
                color: '#d1fae5'
            }).setOrigin(0.5);

        button.on('pointerdown', () => {
            this.scene.start('GitSurvivorScene', { restoreState: this.continueState });
        });
        button.on('pointerover', () => {
            button.setFillStyle(0x10b981, 1);
            title.setScale(1.01);
            subtitle.setScale(1.01);
        });
        button.on('pointerout', () => {
            button.setFillStyle(0x00a86b, 0.88);
            title.setScale(1);
            subtitle.setScale(1);
        });
    }

    createGameModeButton(x, y, mode, index) {
        const button = this.add.rectangle(x, y, 600, 56, mode.color, 0.82)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive({ useHandCursor: true });

        const slotLabel = this.add.text(x - 275, y, `${index + 1}`, {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#111827',
            backgroundColor: '#ffffff',
            padding: { x: 6, y: 4 },
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const titleText = this.add.text(x - 220, y - 10, mode.title, {
            fontSize: '19px',
            fontFamily: 'monospace',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        const descText = this.add.text(x - 220, y + 12, mode.description, {
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#e5e7eb'
        }).setOrigin(0, 0.5);

        const launch = () => {
            logger.info('MainMenu', `Starting ${mode.sceneName}`);
            this.scene.start(mode.sceneName);
        };

        button.on('pointerover', () => {
            button.setFillStyle(mode.color, 1);
            button.setScale(1.02);
            titleText.setScale(1.02);
            descText.setScale(1.02);
            slotLabel.setScale(1.02);
        });
        button.on('pointerout', () => {
            button.setFillStyle(mode.color, 0.82);
            button.setScale(1);
            titleText.setScale(1);
            descText.setScale(1);
            slotLabel.setScale(1);
        });
        button.on('pointerdown', launch);
    }

    getVisibleModes() {
        const start = this.currentPage * this.modesPerPage;
        return GAME_MODES.slice(start, start + this.modesPerPage);
    }

    getFeaturedChallenge() {
        const challenges = challengeSystem.getDailyChallenges();
        return challenges.find(challenge => !challenge.claimedReward && !challenge.completed)
            || challenges.find(challenge => !challenge.claimedReward)
            || challenges[0]
            || null;
    }

    changePage(direction) {
        const nextPage = Phaser.Math.Clamp(this.currentPage + direction, 0, this.pageCount - 1);
        if (nextPage !== this.currentPage) {
            this.currentPage = nextPage;
            this.scene.restart({ page: this.currentPage });
        }
    }

    registerKeyboardShortcuts() {
        this.input.keyboard.on('keydown-LEFT', () => this.changePage(-1));
        this.input.keyboard.on('keydown-RIGHT', () => this.changePage(1));
        this.input.keyboard.on('keydown-S', () => this.scene.start('StatsScene', { returnScene: 'MainMenuScene' }));
        this.input.keyboard.on('keydown-A', () => this.scene.start('AchievementsScene'));
        this.input.keyboard.on('keydown-D', () => this.scene.start('ChallengesScene'));

        if (this.continueState) {
            this.input.keyboard.on('keydown-C', () => {
                this.scene.start('GitSurvivorScene', { restoreState: this.continueState });
            });
        }

        ['ONE', 'TWO', 'THREE', 'FOUR'].forEach((keyName, index) => {
            this.input.keyboard.on(`keydown-${keyName}`, () => {
                const mode = this.getVisibleModes()[index];
                if (mode) {
                    this.scene.start(mode.sceneName);
                }
            });
        });
    }

    async shareStats() {
        try {
            const result = await shareManager.shareStats({
                gamesPlayed: gameData.getStat('gamesPlayed'),
                totalScore: gameData.getStat('totalScore'),
                achievements: Object.keys(gameData.data.achievements.unlocked || {}).length
            });

            const message = result.success
                ? (result.method === 'clipboard' ? 'Stats copied to clipboard!' : 'Stats shared successfully!')
                : 'Unable to share stats right now.';
            this.showToast(message, result.success ? '#00ff00' : '#ff6666');
        } catch (error) {
            logger.error('MainMenuScene', 'Failed to share stats', { error: error.message });
            this.showToast('Unable to share stats right now.', '#ff6666');
        }
    }

    showToast(message, color = '#00ff00') {
        const width = this.cameras.main.width;
        const toast = this.add.text(width / 2, 225, message, {
            fontSize: '12px',
            fontFamily: 'monospace',
            color,
            backgroundColor: '#111827',
            padding: { x: 10, y: 6 }
        }).setOrigin(0.5).setDepth(50);

        this.tweens.add({
            targets: toast,
            alpha: 0,
            y: 205,
            delay: 1200,
            duration: 500,
            onComplete: () => toast.destroy()
        });
    }
}
