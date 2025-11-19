import Phaser from 'phaser';

export default class PRRushScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PRRushScene' });
    }

    init() {
        this.reputation = 100;
        this.prsReviewed = 0;
        this.correctDecisions = 0;
        this.timeRemaining = 60;
        this.currentPR = null;
        this.gameOver = false;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        this.add.rectangle(0, 0, width, height, 0x0a0a1a).setOrigin(0);

        // Title
        this.add.text(width / 2, 20, '⏰ PR Rush Hour', {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#ffaa00'
        }).setOrigin(0.5);

        // Back button
        this.createBackButton();

        // HUD
        this.createHUD();

        // PR Display area
        this.createPRDisplay();

        // Decision buttons
        this.createDecisionButtons();

        // Timer
        this.timer = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });

        // Show first PR
        this.showNextPR();

        // Instructions
        this.showInstructions();

        // PR templates with issues
        this.prTemplates = this.generatePRTemplates();
    }

    generatePRTemplates() {
        return [
            {
                title: 'feat: Add user authentication',
                author: 'junior_dev_2024',
                changes: '+523 -12',
                description: 'Added JWT auth with hardcoded secret key "password123"',
                hasIssue: true,
                issue: 'Hardcoded credentials',
                category: 'security'
            },
            {
                title: 'fix: Resolve null pointer exception',
                author: 'bug_hunter',
                changes: '+5 -3',
                description: 'Added null check before accessing user object',
                hasIssue: false,
                issue: null,
                category: 'bugfix'
            },
            {
                title: 'refactor: Update variable names',
                author: 'code_perfectionist',
                changes: '+2000 -2000',
                description: 'Renamed all variables from camelCase to snake_case across entire codebase',
                hasIssue: true,
                issue: 'Massive unnecessary refactor',
                category: 'refactor'
            },
            {
                title: 'test: Add unit tests for login',
                author: 'test_master',
                changes: '+150 -0',
                description: 'Added comprehensive tests with 95% coverage',
                hasIssue: false,
                issue: null,
                category: 'test'
            },
            {
                title: 'feat: Implement payment system',
                author: 'the_intern',
                changes: '+50 -5',
                description: 'Process payments directly in frontend with card numbers in localStorage',
                hasIssue: true,
                issue: 'Critical security flaw',
                category: 'security'
            },
            {
                title: 'chore: Update dependencies',
                author: 'dependency_bot',
                changes: '+1 -1',
                description: 'Bump lodash from 4.17.20 to 4.17.21',
                hasIssue: false,
                issue: null,
                category: 'chore'
            },
            {
                title: 'fix: Disable error logging',
                author: 'quick_fixer',
                changes: '+1 -1',
                description: 'Removed try-catch to make code run faster',
                hasIssue: true,
                issue: 'Removed error handling',
                category: 'bugfix'
            },
            {
                title: 'docs: Update README',
                author: 'doc_writer',
                changes: '+30 -15',
                description: 'Added setup instructions and API documentation',
                hasIssue: false,
                issue: null,
                category: 'docs'
            },
            {
                title: 'perf: Optimize database queries',
                author: 'performance_guru',
                changes: '+45 -120',
                description: 'Added proper indexing and reduced N+1 queries',
                hasIssue: false,
                issue: null,
                category: 'performance'
            },
            {
                title: 'feat: Add admin panel',
                author: 'full_stack_sam',
                changes: '+200 -0',
                description: 'New admin dashboard accessible at /admin (no auth required)',
                hasIssue: true,
                issue: 'No authentication on admin panel',
                category: 'security'
            },
            {
                title: 'fix: Resolve memory leak',
                author: 'memory_manager',
                changes: '+8 -2',
                description: 'Clear event listeners on component unmount',
                hasIssue: false,
                issue: null,
                category: 'bugfix'
            },
            {
                title: 'feat: Add SQL query builder',
                author: 'database_ninja',
                changes: '+100 -50',
                description: 'Allow users to input custom SQL queries via URL params',
                hasIssue: true,
                issue: 'SQL injection vulnerability',
                category: 'security'
            }
        ];
    }

    createHUD() {
        // Reputation
        this.reputationText = this.add.text(20, 60, `⭐ Reputation: ${this.reputation}%`, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffaa00'
        });

        // PRs reviewed
        this.reviewedText = this.add.text(250, 60, `📝 Reviewed: ${this.prsReviewed}`, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#00aaff'
        });

        // Accuracy
        this.accuracyText = this.add.text(450, 60, `✓ Accuracy: 100%`, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#00ff00'
        });

        // Timer
        this.timerText = this.add.text(650, 60, `⏱️ Time: ${this.timeRemaining}s`, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ff0000'
        });
    }

    createPRDisplay() {
        const width = this.cameras.main.width;

        // PR Container
        const prBox = this.add.rectangle(width / 2, 280, 700, 300, 0x1a1a2e);
        prBox.setStrokeStyle(2, 0xffaa00);

        // PR Title
        this.prTitle = this.add.text(width / 2, 160, '', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // PR Author
        this.prAuthor = this.add.text(width / 2, 190, '', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#888888'
        }).setOrigin(0.5);

        // PR Changes
        this.prChanges = this.add.text(width / 2, 210, '', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#00ff00'
        }).setOrigin(0.5);

        // PR Description
        this.prDescription = this.add.text(width / 2, 280, '', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: 650 }
        }).setOrigin(0.5);

        // Code preview area
        this.codePreview = this.add.text(width / 2, 350, '', {
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 10, y: 10 },
            align: 'left',
            wordWrap: { width: 650 }
        }).setOrigin(0.5);
    }

    createDecisionButtons() {
        const width = this.cameras.main.width;
        const buttonY = 470;

        // Approve button
        const approveBtn = this.add.rectangle(width / 2 - 180, buttonY, 150, 50, 0x00aa00, 0.8);
        approveBtn.setStrokeStyle(2, 0xffffff);
        approveBtn.setInteractive({ useHandCursor: true });

        const approveText = this.add.text(width / 2 - 180, buttonY, '✓ APPROVE', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        approveBtn.on('pointerover', () => approveBtn.setFillStyle(0x00ff00, 1.0));
        approveBtn.on('pointerout', () => approveBtn.setFillStyle(0x00aa00, 0.8));
        approveBtn.on('pointerdown', () => this.makeDecision(true));

        // Request changes button
        const rejectBtn = this.add.rectangle(width / 2 + 30, buttonY, 150, 50, 0xaa0000, 0.8);
        rejectBtn.setStrokeStyle(2, 0xffffff);
        rejectBtn.setInteractive({ useHandCursor: true });

        const rejectText = this.add.text(width / 2 + 30, buttonY, '✗ REJECT', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        rejectBtn.on('pointerover', () => rejectBtn.setFillStyle(0xff0000, 1.0));
        rejectBtn.on('pointerout', () => rejectBtn.setFillStyle(0xaa0000, 0.8));
        rejectBtn.on('pointerdown', () => this.makeDecision(false));

        // Comment button (auto-approve small changes)
        const commentBtn = this.add.rectangle(width / 2 + 240, buttonY, 150, 50, 0x0000aa, 0.8);
        commentBtn.setStrokeStyle(2, 0xffffff);
        commentBtn.setInteractive({ useHandCursor: true });

        const commentText = this.add.text(width / 2 + 240, buttonY, '💬 COMMENT', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        commentBtn.on('pointerover', () => commentBtn.setFillStyle(0x0000ff, 1.0));
        commentBtn.on('pointerout', () => commentBtn.setFillStyle(0x0000aa, 0.8));
        commentBtn.on('pointerdown', () => this.addComment());
    }

    showNextPR() {
        if (this.gameOver) return;

        this.currentPR = Phaser.Utils.Array.GetRandom(this.prTemplates);

        // Update display
        this.prTitle.setText(this.currentPR.title);
        this.prAuthor.setText(`by @${this.currentPR.author}`);
        this.prChanges.setText(`📊 ${this.currentPR.changes} lines`);
        this.prDescription.setText(this.currentPR.description);

        // Generate fake code snippet
        const codeSnippets = this.generateCodeSnippet(this.currentPR);
        this.codePreview.setText(codeSnippets);
    }

    generateCodeSnippet(pr) {
        const snippets = {
            security: [
                '+ const SECRET_KEY = "password123";\n+ const token = jwt.sign(data, SECRET_KEY);',
                '+ localStorage.setItem("creditCard", cardNumber);\n+ processPayment(cardNumber);',
                '+ const query = `SELECT * FROM users WHERE id=${userId}`;\n+ db.execute(query);'
            ],
            bugfix: [
                '- data.user.name\n+ data.user?.name || "Unknown"',
                '+ if (obj !== null && obj !== undefined) {\n+   return obj.value;\n+ }',
                '- return items[index]\n+ return items[index] || null'
            ],
            refactor: [
                '- let userName = "John";\n+ let user_name = "John";',
                '- function getData() {\n+ function get_data() {',
                '- this.maxValue = 100;\n+ this.max_value = 100;'
            ],
            test: [
                '+ it("should login user", () => {\n+   expect(login()).toBe(true);\n+ });',
                '+ describe("Authentication", () => {\n+   test("validates token");\n+ });'
            ],
            chore: [
                '- "lodash": "^4.17.20"\n+ "lodash": "^4.17.21"',
                '+ Updated dependencies to latest versions'
            ],
            docs: [
                '+ ## Installation\n+ Run `npm install` to get started',
                '+ ### API Documentation\n+ POST /api/login - User authentication'
            ],
            performance: [
                '+ // Added index on user_id column\n+ db.createIndex("users", "user_id");',
                '- for(let user of users) {\n-   await db.get(user.id)\n- }\n+ const ids = users.map(u => u.id);\n+ await db.getMany(ids);'
            ]
        };

        const category = pr.category || 'bugfix';
        const snippet = Phaser.Utils.Array.GetRandom(snippets[category] || snippets.bugfix);
        return snippet;
    }

    makeDecision(approved) {
        if (this.gameOver) return;

        let correct = false;

        if (this.currentPR.hasIssue) {
            // PR has issues - should be rejected
            correct = !approved;
        } else {
            // PR is good - should be approved
            correct = approved;
        }

        this.prsReviewed++;

        if (correct) {
            this.correctDecisions++;
            this.reputation += 5;
            this.showFeedback('✓ Correct!', '#00ff00', this.currentPR.issue);
            this.timeRemaining += 3; // Bonus time
        } else {
            this.reputation -= 15;
            this.showFeedback('✗ Wrong!', '#ff0000', this.currentPR.issue);
            this.timeRemaining -= 2; // Time penalty
        }

        this.reputation = Phaser.Math.Clamp(this.reputation, 0, 100);

        if (this.reputation <= 0) {
            this.endGame('You got fired! 💼');
            return;
        }

        // Show next PR
        this.time.delayedCall(1500, () => {
            this.showNextPR();
        });

        this.updateHUD();
    }

    addComment() {
        // Comment gives small rep bonus, doesn't count as reviewed
        this.reputation += 2;
        const messages = [
            '💬 "LGTM but consider adding tests"',
            '💬 "Nice work! Small suggestion on line 42"',
            '💬 "Great PR! Could you update the docs?"',
            '💬 "Looks good! Minor: rename this variable"'
        ];

        this.showFeedback(Phaser.Utils.Array.GetRandom(messages), '#00aaff', null);

        this.time.delayedCall(1000, () => {
            this.showNextPR();
        });
    }

    showFeedback(message, color, issue) {
        const width = this.cameras.main.width;

        const feedback = this.add.text(width / 2, 540, message, {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: color,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        if (issue) {
            const issueText = this.add.text(width / 2, 560, `Issue: ${issue}`, {
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#ffaa00',
                fontStyle: 'italic'
            }).setOrigin(0.5);

            this.time.delayedCall(1500, () => issueText.destroy());
        }

        this.time.delayedCall(1500, () => feedback.destroy());
    }

    updateTimer() {
        if (this.gameOver) return;

        this.timeRemaining--;

        if (this.timeRemaining <= 0) {
            this.endGame('Time\'s up! ⏰');
        }

        this.updateHUD();
    }

    updateHUD() {
        this.reputationText.setText(`⭐ Reputation: ${Math.floor(this.reputation)}%`);
        this.reviewedText.setText(`📝 Reviewed: ${this.prsReviewed}`);

        const accuracy = this.prsReviewed > 0
            ? Math.floor((this.correctDecisions / this.prsReviewed) * 100)
            : 100;
        this.accuracyText.setText(`✓ Accuracy: ${accuracy}%`);

        this.timerText.setText(`⏱️ Time: ${Math.max(0, this.timeRemaining)}s`);

        // Change timer color when low
        if (this.timeRemaining <= 10) {
            this.timerText.setColor('#ff0000');
            if (this.timeRemaining % 2 === 0) {
                this.timerText.setScale(1.2);
            } else {
                this.timerText.setScale(1.0);
            }
        }
    }

    endGame(reason) {
        this.gameOver = true;
        this.timer.remove();

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.9).setOrigin(0);

        this.add.text(width / 2, height / 2 - 80, 'SHIFT OVER!', {
            fontSize: '48px',
            fontFamily: 'monospace',
            color: '#ffaa00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 - 30, reason, {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#ffffff',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        const accuracy = this.prsReviewed > 0
            ? Math.floor((this.correctDecisions / this.prsReviewed) * 100)
            : 0;

        this.add.text(width / 2, height / 2 + 20, `PRs Reviewed: ${this.prsReviewed}`, {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#00aaff'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 45, `Accuracy: ${accuracy}%`, {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#00ff00'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 70, `Final Reputation: ${Math.floor(this.reputation)}%`, {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffaa00'
        }).setOrigin(0.5);

        const funnyMessages = [
            '🏆 "You survived PR hell!"',
            '😅 "At least you tried..."',
            '🎯 "Pretty good for a human!"',
            '🤖 "Maybe automate next time?"',
            '☕ "Time for coffee break!"'
        ];

        this.add.text(width / 2, height / 2 + 110, Phaser.Utils.Array.GetRandom(funnyMessages), {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#888888',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        const menuBtn = this.add.text(width / 2, height / 2 + 160, '[ Return to Menu ]', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);
        menuBtn.setInteractive({ useHandCursor: true });
        menuBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));
    }

    showInstructions() {
        const msg = this.add.text(400, 120, '💡 Review PRs quickly! Approve good ones, reject bad ones!', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#888888'
        }).setOrigin(0.5);

        this.time.delayedCall(5000, () => {
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
