// Tutorial system for teaching players game mechanics

export default class TutorialSystem {
    constructor(scene) {
        this.scene = scene;
        this.currentStep = 0;
        this.tutorialActive = false;
        this.tutorialCompleted = false;
        this.overlays = [];
    }

    // Tutorial data for each game mode
    getTutorialSteps(gameMode) {
        const tutorials = {
            GitSurvivorScene: [
                {
                    title: '🎮 Welcome to Git Survivor!',
                    text: 'You\'re a developer fighting off coding nightmares!\nUse WASD or Arrow Keys to move around.',
                    highlight: null,
                    duration: 4000
                },
                {
                    title: '⚔️ Combat',
                    text: 'Press SPACE or click to shoot at enemies.\nKill bugs, merge conflicts, and other threats!',
                    highlight: null,
                    duration: 4000
                },
                {
                    title: '🎁 Power-ups',
                    text: 'Collect power-ups for special abilities!\n☕ Coffee, 📚 Stack Overflow, 🦆 Rubber Duck, and more!',
                    highlight: null,
                    duration: 4000
                },
                {
                    title: '👹 Boss Battles',
                    text: 'Every 30 kills, face a boss enemy!\nDefeat them for guaranteed power-ups!',
                    highlight: null,
                    duration: 4000
                },
                {
                    title: '📊 Stay Alive!',
                    text: 'Watch your Health, Sanity, and Storage.\nLevel up every 10 kills for bonuses!\n\nGood luck, survivor! 🚀',
                    highlight: null,
                    duration: 5000
                }
            ],
            CodeDefenseScene: [
                {
                    title: '🏰 Welcome to Code Defense!',
                    text: 'Protect your production environment from bugs and hackers!',
                    highlight: null,
                    duration: 3000
                },
                {
                    title: '🛡️ Build Defenses',
                    text: 'Click a tower type at the bottom, then place it on the map.\nDon\'t place too close to the enemy path!',
                    highlight: null,
                    duration: 4000
                },
                {
                    title: '💰 Budget Wisely',
                    text: 'Each tower costs money. Defeat enemies to earn more!\nUpgrade your defenses between waves.',
                    highlight: null,
                    duration: 4000
                },
                {
                    title: '🌊 Waves',
                    text: 'Click "Start Wave" when ready.\nEnemies get stronger each wave!',
                    highlight: null,
                    duration: 4000
                },
                {
                    title: '❤️ Production Health',
                    text: 'Don\'t let enemies reach production!\nIf health hits 0, you lose!\n\nDefend well! 🛡️',
                    highlight: null,
                    duration: 4000
                }
            ],
            PRRushScene: [
                {
                    title: '⏰ Welcome to PR Rush!',
                    text: 'Review pull requests under time pressure!\nOnly the best reviewers survive!',
                    highlight: null,
                    duration: 3000
                },
                {
                    title: '👀 Read Carefully',
                    text: 'Each PR shows:\n- Title and author\n- Code changes\n- Description\n\nLook for security issues!',
                    highlight: null,
                    duration: 4000
                },
                {
                    title: '✅ Make Decisions',
                    text: 'APPROVE good code ✓\nREJECT dangerous code ✗\nCOMMENT for minor issues 💬',
                    highlight: null,
                    duration: 4000
                },
                {
                    title: '🚨 Watch For Red Flags',
                    text: 'Hardcoded passwords, SQL injection, XSS attacks,\nno auth on admin panels, secrets in code!',
                    highlight: null,
                    duration: 4000
                },
                {
                    title: '⏱️ Beat the Clock',
                    text: 'Review as many PRs as you can!\nCorrect decisions give bonus time.\n\nGood luck, reviewer! 👀',
                    highlight: null,
                    duration: 4000
                }
            ],
            DevCommanderScene: [
                {
                    title: '⚔️ Welcome to Dev Commander!',
                    text: 'Manage a team of developers and complete tasks!\nBalance budget, morale, and code quality.',
                    highlight: null,
                    duration: 4000
                },
                {
                    title: '👥 Hire Developers',
                    text: 'Click "Hire Dev" to add team members.\nJuniors are cheap but slow, Seniors are fast but expensive!',
                    highlight: null,
                    duration: 4000
                },
                {
                    title: '📝 Assign Tasks',
                    text: 'Click a dev to select them,\nthen click a task to assign it.\nThey\'ll work automatically!',
                    highlight: null,
                    duration: 4000
                },
                {
                    title: '☕ Keep Morale High',
                    text: 'Buy coffee to boost team morale!\nLow morale = slower work.\nWatch your budget!',
                    highlight: null,
                    duration: 4000
                },
                {
                    title: '🏃 Sprint Management',
                    text: 'Complete sprints to progress.\nManage CI/CD minutes and code quality.\n\nLead your team to success! 💪',
                    highlight: null,
                    duration: 4000
                }
            ],
            DebugDungeonScene: [
                {
                    title: '🏰 Welcome to Debug Dungeon!',
                    text: 'Explore a dungeon filled with bugs and errors!\nClear each room to progress.',
                    highlight: null,
                    duration: 3000
                },
                {
                    title: '⚔️ Combat',
                    text: 'Click to shoot projectiles at bugs!\nEach shot costs 10 mana.',
                    highlight: null,
                    duration: 3000
                },
                {
                    title: '🚪 Room Progression',
                    text: 'Defeat all bugs to unlock the exit door.\nEnter the door to proceed to the next room.',
                    highlight: null,
                    duration: 4000
                },
                {
                    title: '💎 Treasures',
                    text: 'Collect treasures to restore health and mana!\nThey give bonus points too!',
                    highlight: null,
                    duration: 3000
                },
                {
                    title: '🎯 Survive!',
                    text: 'Clear all 10 rooms to win!\nMana regenerates over time.\n\nGood luck, dungeon crawler! 🗡️',
                    highlight: null,
                    duration: 4000
                }
            ],
            RefactorRaceScene: [
                {
                    title: '🏎️ Welcome to Refactor Race!',
                    text: 'Refactor messy code against the clock!\nSpeed and accuracy are key!',
                    highlight: null,
                    duration: 3000
                },
                {
                    title: '📋 Code Issues',
                    text: 'Each code block shows a common refactoring issue.\nRead the problem and the suggested fix.',
                    highlight: null,
                    duration: 4000
                },
                {
                    title: '✅ Refactor or Skip',
                    text: 'Click "Refactor" to fix the code and earn points!\nSkip if you\'re unsure, but you\'ll lose your streak.',
                    highlight: null,
                    duration: 4000
                },
                {
                    title: '⏱️ Time Bonus',
                    text: 'Each successful refactor adds time to the clock!\nBuild a streak for multiplier bonuses!',
                    highlight: null,
                    duration: 4000
                },
                {
                    title: '⌨️ Keyboard Shortcuts',
                    text: 'SPACE = Refactor | S = Skip\n\nRefactor fast and refactor clean! 🚀',
                    highlight: null,
                    duration: 4000
                }
            ]
        };

        return tutorials[gameMode] || [];
    }

    start(gameMode) {
        const steps = this.getTutorialSteps(gameMode);
        if (steps.length === 0) return;

        this.tutorialActive = true;
        this.currentStep = 0;
        this.steps = steps;

        this.showStep(0);
    }

    showStep(stepIndex) {
        if (stepIndex >= this.steps.length) {
            this.complete();
            return;
        }

        const step = this.steps[stepIndex];
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        // Semi-transparent overlay (not interactive, just visual)
        const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.7);
        overlay.setOrigin(0);
        overlay.setDepth(1000);

        // Tutorial box
        const boxWidth = 600;
        const boxHeight = 200;
        const box = this.scene.add.rectangle(width / 2, height / 2, boxWidth, boxHeight, 0x1a1a2e, 1);
        box.setStrokeStyle(3, 0x00ff00);
        box.setDepth(1001);

        // Title
        const titleText = this.scene.add.text(width / 2, height / 2 - 70, step.title, {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#00ff00',
            fontStyle: 'bold'
        });
        titleText.setOrigin(0.5);
        titleText.setDepth(1002);

        // Content
        const contentText = this.scene.add.text(width / 2, height / 2 + 10, step.text, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: boxWidth - 40 }
        });
        contentText.setOrigin(0.5);
        contentText.setDepth(1002);

        // Progress indicator
        const progressText = this.scene.add.text(width / 2, height / 2 + 80,
            `${stepIndex + 1} / ${this.steps.length}`, {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#888888'
        });
        progressText.setOrigin(0.5);
        progressText.setDepth(1002);

        // Next button or auto-advance
        if (stepIndex < this.steps.length - 1) {
            const nextBtn = this.scene.add.text(width / 2 + 150, height / 2 + 75,
                '[ NEXT → ]', {
                fontSize: '14px',
                fontFamily: 'monospace',
                color: '#00ff00',
                backgroundColor: '#333333',
                padding: { x: 10, y: 5 }
            });
            nextBtn.setOrigin(0.5);
            nextBtn.setDepth(1003);
            nextBtn.setInteractive({ useHandCursor: true });

            nextBtn.on('pointerdown', () => {
                this.clearCurrentStep();
                this.currentStep++;
                this.showStep(this.currentStep);
            });

            nextBtn.on('pointerover', () => nextBtn.setStyle({ backgroundColor: '#555555' }));
            nextBtn.on('pointerout', () => nextBtn.setStyle({ backgroundColor: '#333333' }));

            this.overlays.push(nextBtn);
        } else {
            const doneBtn = this.scene.add.text(width / 2, height / 2 + 75,
                '[ START PLAYING! ]', {
                fontSize: '16px',
                fontFamily: 'monospace',
                color: '#ffffff',
                backgroundColor: '#00aa00',
                padding: { x: 15, y: 8 }
            });
            doneBtn.setOrigin(0.5);
            doneBtn.setDepth(1003);
            doneBtn.setInteractive({ useHandCursor: true });

            doneBtn.on('pointerdown', () => {
                this.complete();
            });

            doneBtn.on('pointerover', () => doneBtn.setStyle({ backgroundColor: '#00ff00' }));
            doneBtn.on('pointerout', () => doneBtn.setStyle({ backgroundColor: '#00aa00' }));

            this.overlays.push(doneBtn);
        }

        // Skip button
        const skipBtn = this.scene.add.text(width / 2 - 150, height / 2 + 75,
            '[ SKIP ]', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#ff0000',
            backgroundColor: '#333333',
            padding: { x: 8, y: 4 }
        });
        skipBtn.setOrigin(0.5);
        skipBtn.setDepth(1003);
        skipBtn.setInteractive({ useHandCursor: true });

        skipBtn.on('pointerdown', () => {
            this.complete();
        });

        skipBtn.on('pointerover', () => skipBtn.setStyle({ backgroundColor: '#555555' }));
        skipBtn.on('pointerout', () => skipBtn.setStyle({ backgroundColor: '#333333' }));

        this.overlays.push(overlay, box, titleText, contentText, progressText, skipBtn);
    }

    clearCurrentStep() {
        this.overlays.forEach(obj => {
            if (obj && obj.destroy) {
                obj.destroy();
            }
        });
        this.overlays = [];
    }

    complete() {
        this.clearCurrentStep();
        this.tutorialActive = false;
        this.tutorialCompleted = true;
    }

    isActive() {
        return this.tutorialActive;
    }

    isCompleted() {
        return this.tutorialCompleted;
    }
}
