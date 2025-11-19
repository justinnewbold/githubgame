import Phaser from 'phaser';

export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);

        // Title
        const title = this.add.text(width / 2, 80, 'GitGame', {
            fontSize: '64px',
            fontFamily: 'monospace',
            color: '#00ff00',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5);

        // Subtitle with humor
        const subtitle = this.add.text(width / 2, 130, '⚠️ Only the Best Devs Survive! ⚠️', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffaa00'
        });
        subtitle.setOrigin(0.5);

        // Funny quote
        const quotes = [
            '"Works on my machine" - Famous Last Words',
            '"It\'s not a bug, it\'s a feature" - Survivor Chronicles',
            '"Just one more merge..." - Epitaph',
            '"I\'ll fix it in production" - Legends Never Die',
            '"Who needs tests anyway?" - Natural Selection'
        ];
        const randomQuote = Phaser.Utils.Array.GetRandom(quotes);
        const quote = this.add.text(width / 2, 160, randomQuote, {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#888888',
            fontStyle: 'italic'
        });
        quote.setOrigin(0.5);

        // Game mode buttons
        const buttonY = 220;
        const buttonSpacing = 80;

        this.createGameModeButton(width / 2, buttonY,
            '🗡️ Git Survivor',
            'Roguelike: Face merge conflicts & bugs!',
            'GitSurvivorScene',
            0x4a90e2);

        this.createGameModeButton(width / 2, buttonY + buttonSpacing,
            '🏰 Code Defense',
            'Tower Defense: Protect your codebase!',
            'CodeDefenseScene',
            0xe24a4a);

        this.createGameModeButton(width / 2, buttonY + buttonSpacing * 2,
            '⏰ PR Rush',
            'Time Management: Review PRs under pressure!',
            'PRRushScene',
            0xe2a94a);

        this.createGameModeButton(width / 2, buttonY + buttonSpacing * 3,
            '⚔️ Dev Commander',
            'RTS: Manage your dev team!',
            'DevCommanderScene',
            0x7e4ae2);

        // Footer
        const footer = this.add.text(width / 2, height - 20,
            'Made with ❤️ and lots of git conflicts', {
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#555555'
        });
        footer.setOrigin(0.5);
    }

    createGameModeButton(x, y, title, description, sceneName, color) {
        // Button background
        const buttonWidth = 600;
        const buttonHeight = 60;

        const button = this.add.rectangle(x, y, buttonWidth, buttonHeight, color, 0.8);
        button.setStrokeStyle(2, 0xffffff);
        button.setInteractive({ useHandCursor: true });

        // Title text
        const titleText = this.add.text(x, y - 12, title, {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        titleText.setOrigin(0.5);

        // Description text
        const descText = this.add.text(x, y + 12, description, {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#dddddd'
        });
        descText.setOrigin(0.5);

        // Hover effects
        button.on('pointerover', () => {
            button.setFillStyle(color, 1.0);
            button.setScale(1.05);
            titleText.setScale(1.05);
            descText.setScale(1.05);
        });

        button.on('pointerout', () => {
            button.setFillStyle(color, 0.8);
            button.setScale(1.0);
            titleText.setScale(1.0);
            descText.setScale(1.0);
        });

        button.on('pointerdown', () => {
            button.setScale(0.95);
            titleText.setScale(0.95);
            descText.setScale(0.95);
        });

        button.on('pointerup', () => {
            button.setScale(1.0);
            titleText.setScale(1.0);
            descText.setScale(1.0);

            // Transition to the selected game mode
            this.cameras.main.fade(250, 0, 0, 0);
            this.time.delayedCall(250, () => {
                this.scene.start(sceneName);
            });
        });

        return button;
    }
}
