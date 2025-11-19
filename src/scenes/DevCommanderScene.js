import Phaser from 'phaser';

export default class DevCommanderScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DevCommanderScene' });
    }

    init() {
        this.developers = [];
        this.tasks = [];
        this.completedTasks = 0;
        this.money = 1000;
        this.cicdMinutes = 100;
        this.codeQuality = 100;
        this.morale = 100;
        this.selectedDev = null;
        this.gameTime = 0;
        this.sprint = 1;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        this.add.rectangle(0, 0, width, height, 0x0a0a1a).setOrigin(0);

        // Title
        this.add.text(width / 2, 20, '⚔️ Dev Commander', {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#7e4ae2'
        }).setOrigin(0.5);

        // Back button
        this.createBackButton();

        // HUD
        this.createHUD();

        // Office area (where devs work)
        this.createOfficeArea();

        // Task board
        this.createTaskBoard();

        // Developer roster
        this.createDeveloperRoster();

        // Control panel
        this.createControlPanel();

        // Spawn initial developers
        this.hireDeveloper('Junior', 200, 250);
        this.hireDeveloper('Junior', 350, 250);

        // Generate initial tasks
        this.generateTasks(3);

        // Instructions
        this.showInstructions();

        // Game timer
        this.time.addEvent({
            delay: 1000,
            callback: this.updateGameTime,
            callbackScope: this,
            loop: true
        });

        // Random events
        this.time.addEvent({
            delay: 15000,
            callback: this.triggerRandomEvent,
            callbackScope: this,
            loop: true
        });
    }

    createHUD() {
        const hudY = 60;

        // Money
        this.moneyText = this.add.text(20, hudY, `💰 Budget: $${this.money}`, {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#00ff00'
        });

        // CI/CD minutes
        this.cicdText = this.add.text(180, hudY, `⚙️ CI/CD: ${this.cicdMinutes}min`, {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#00aaff'
        });

        // Code quality
        this.qualityText = this.add.text(360, hudY, `📊 Quality: ${this.codeQuality}%`, {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#ffaa00'
        });

        // Morale
        this.moraleText = this.add.text(540, hudY, `😊 Morale: ${this.morale}%`, {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#ff00ff'
        });

        // Sprint info
        this.sprintText = this.add.text(20, hudY + 20, `Sprint ${this.sprint} | Tasks: ${this.completedTasks}`, {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#888888'
        });
    }

    createOfficeArea() {
        const officeBox = this.add.rectangle(400, 280, 760, 300, 0x1a1a2e);
        officeBox.setStrokeStyle(2, 0x7e4ae2);

        this.add.text(400, 145, '🏢 Development Office', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#7e4ae2'
        }).setOrigin(0.5);

        // Desks
        for (let i = 0; i < 6; i++) {
            const x = 150 + (i % 3) * 200;
            const y = 220 + Math.floor(i / 3) * 150;
            this.add.rectangle(x, y, 80, 60, 0x2a2a3e, 0.5).setStrokeStyle(1, 0x555555);
            this.add.text(x, y, '🖥️', { fontSize: '24px' }).setOrigin(0.5);
        }
    }

    createTaskBoard() {
        const boardBox = this.add.rectangle(650, 280, 250, 300, 0x2a2a3e);
        boardBox.setStrokeStyle(2, 0xffaa00);

        this.add.text(650, 145, '📋 Task Board', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffaa00'
        }).setOrigin(0.5);

        this.taskBoardY = 180;
    }

    createDeveloperRoster() {
        // Developer list area
        this.add.text(100, 450, '👥 Team:', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#ffffff'
        });

        this.devRosterY = 470;
    }

    createControlPanel() {
        // Hire button
        const hireBtn = this.add.rectangle(100, 530, 120, 30, 0x00aa00, 0.8);
        hireBtn.setStrokeStyle(2, 0xffffff);
        hireBtn.setInteractive({ useHandCursor: true });

        this.add.text(100, 530, '+ Hire Dev ($300)', {
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);

        hireBtn.on('pointerdown', () => this.showHireMenu());
        hireBtn.on('pointerover', () => hireBtn.setFillStyle(0x00ff00, 1.0));
        hireBtn.on('pointerout', () => hireBtn.setFillStyle(0x00aa00, 0.8));

        // Sprint button
        const sprintBtn = this.add.rectangle(250, 530, 120, 30, 0x0000aa, 0.8);
        sprintBtn.setStrokeStyle(2, 0xffffff);
        sprintBtn.setInteractive({ useHandCursor: true });

        this.add.text(250, 530, '🏃 Next Sprint', {
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);

        sprintBtn.on('pointerdown', () => this.nextSprint());
        sprintBtn.on('pointerover', () => sprintBtn.setFillStyle(0x0000ff, 1.0));
        sprintBtn.on('pointerout', () => sprintBtn.setFillStyle(0x0000aa, 0.8));

        // Coffee break button
        const coffeeBtn = this.add.rectangle(400, 530, 120, 30, 0xaa6600, 0.8);
        coffeeBtn.setStrokeStyle(2, 0xffffff);
        coffeeBtn.setInteractive({ useHandCursor: true });

        this.add.text(400, 530, '☕ Coffee ($50)', {
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);

        coffeeBtn.on('pointerdown', () => this.buyCoffee());
        coffeeBtn.on('pointerover', () => coffeeBtn.setFillStyle(0xffaa00, 1.0));
        coffeeBtn.on('pointerout', () => coffeeBtn.setFillStyle(0xaa6600, 0.8));

        // Add task button
        const taskBtn = this.add.rectangle(550, 530, 120, 30, 0xaa00aa, 0.8);
        taskBtn.setStrokeStyle(2, 0xffffff);
        taskBtn.setInteractive({ useHandCursor: true });

        this.add.text(550, 530, '📝 New Tasks', {
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);

        taskBtn.on('pointerdown', () => this.generateTasks(2));
        taskBtn.on('pointerover', () => taskBtn.setFillStyle(0xff00ff, 1.0));
        taskBtn.on('pointerout', () => taskBtn.setFillStyle(0xaa00aa, 0.8));
    }

    hireDeveloper(level, x, y) {
        const cost = 300;
        if (this.money < cost) {
            this.showFloatingText(100, 530, 'Not enough money!', '#ff0000');
            return;
        }

        this.money -= cost;

        const devTypes = {
            'Junior': { speed: 1, quality: 60, cost: 10, color: 0x00ff00, emoji: '👶' },
            'Mid': { speed: 1.5, quality: 80, cost: 20, color: 0x00aaff, emoji: '🧑' },
            'Senior': { speed: 2, quality: 95, cost: 40, color: 0xffaa00, emoji: '🧔' }
        };

        const type = devTypes[level] || devTypes['Junior'];

        const dev = this.add.circle(x || 200, y || 250, 12, type.color);
        dev.setStrokeStyle(2, 0xffffff);
        dev.setInteractive({ useHandCursor: true });
        this.physics.add.existing(dev);

        dev.devData = {
            level: level,
            speed: type.speed,
            quality: type.quality,
            upkeepCost: type.cost,
            currentTask: null,
            progress: 0,
            emoji: type.emoji,
            morale: 100
        };

        // Make draggable
        this.input.setDraggable(dev);

        dev.on('drag', (pointer, dragX, dragY) => {
            dev.x = dragX;
            dev.y = dragY;
        });

        dev.on('pointerdown', () => {
            this.selectDeveloper(dev);
        });

        this.developers.push(dev);

        this.showFloatingText(x || 200, y || 250, `Hired ${level}!`, '#00ff00');
        this.updateHUD();
    }

    selectDeveloper(dev) {
        // Deselect all
        this.developers.forEach(d => {
            d.setStrokeStyle(2, 0xffffff);
        });

        // Select this one
        dev.setStrokeStyle(3, 0xffff00);
        this.selectedDev = dev;

        this.showFloatingText(dev.x, dev.y - 30,
            `${dev.devData.emoji} ${dev.devData.level} Dev`, '#ffff00');
    }

    generateTasks(count) {
        const taskTypes = [
            { name: 'Bug Fix', difficulty: 1, reward: 100, time: 5 },
            { name: 'Feature', difficulty: 3, reward: 300, time: 15 },
            { name: 'Refactor', difficulty: 2, reward: 200, time: 10 },
            { name: 'Tests', difficulty: 1, reward: 150, time: 7 },
            { name: 'Documentation', difficulty: 1, reward: 80, time: 4 },
            { name: 'Optimization', difficulty: 3, reward: 250, time: 12 }
        ];

        for (let i = 0; i < count; i++) {
            const type = Phaser.Utils.Array.GetRandom(taskTypes);
            const task = {
                name: type.name,
                difficulty: type.difficulty,
                reward: type.reward,
                timeRequired: type.time,
                progress: 0,
                assignedDev: null,
                id: Date.now() + i
            };

            this.tasks.push(task);
        }

        this.renderTaskBoard();
    }

    renderTaskBoard() {
        // Clear existing task displays
        this.children.list.forEach(child => {
            if (child.taskDisplay) {
                child.destroy();
            }
        });

        let yOffset = 0;
        this.tasks.forEach((task, index) => {
            if (index >= 5) return; // Only show 5 tasks

            const y = this.taskBoardY + yOffset;
            const taskBg = this.add.rectangle(650, y, 230, 40, 0x1a1a2e, 0.8);
            taskBg.setStrokeStyle(1, 0xffaa00);
            taskBg.taskDisplay = true;
            taskBg.setInteractive({ useHandCursor: true });

            const taskText = this.add.text(550, y - 8, `${task.name} ⭐${task.difficulty}`, {
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#ffffff'
            });
            taskText.taskDisplay = true;

            const rewardText = this.add.text(550, y + 8, `💰 $${task.reward} | ⏱️ ${task.timeRequired}s`, {
                fontSize: '9px',
                fontFamily: 'monospace',
                color: '#00ff00'
            });
            rewardText.taskDisplay = true;

            // Progress bar
            if (task.progress > 0) {
                const progressBg = this.add.rectangle(650, y + 18, 200, 4, 0x333333);
                progressBg.taskDisplay = true;

                const progressBar = this.add.rectangle(550 + (200 * task.progress / 100), y + 18,
                    200 * task.progress / 100, 4, 0x00ff00);
                progressBar.taskDisplay = true;
            }

            // Click to assign
            taskBg.on('pointerdown', () => {
                if (this.selectedDev && !this.selectedDev.devData.currentTask) {
                    this.assignTask(this.selectedDev, task);
                }
            });

            yOffset += 50;
        });
    }

    assignTask(dev, task) {
        if (dev.devData.currentTask) {
            this.showFloatingText(dev.x, dev.y - 30, 'Already working!', '#ff0000');
            return;
        }

        dev.devData.currentTask = task;
        task.assignedDev = dev;

        this.showFloatingText(dev.x, dev.y - 30, `Working on ${task.name}`, '#00aaff');
    }

    update() {
        // Update developers working on tasks
        this.developers.forEach(dev => {
            if (dev.devData.currentTask) {
                const task = dev.devData.currentTask;
                const progressPerSecond = (dev.devData.speed * 100) / task.timeRequired;

                task.progress += progressPerSecond / 60; // 60 fps

                if (task.progress >= 100) {
                    this.completeTask(dev, task);
                }
            }
        });

        // Render updates
        this.renderTaskBoard();
        this.updateHUD();
    }

    completeTask(dev, task) {
        this.money += task.reward;
        this.completedTasks++;
        this.cicdMinutes -= 5;

        // Quality based on dev level
        const qualityImpact = (dev.devData.quality / 100) * 2;
        this.codeQuality = Math.min(100, this.codeQuality + qualityImpact);

        this.showFloatingText(dev.x, dev.y, `+$${task.reward}`, '#00ff00');

        // Remove task
        const taskIndex = this.tasks.indexOf(task);
        if (taskIndex > -1) {
            this.tasks.splice(taskIndex, 1);
        }

        dev.devData.currentTask = null;
        dev.devData.morale -= 5; // Working decreases morale
    }

    buyCoffee() {
        const cost = 50;
        if (this.money < cost) {
            this.showFloatingText(400, 530, 'Not enough money!', '#ff0000');
            return;
        }

        this.money -= cost;
        this.morale += 20;

        this.developers.forEach(dev => {
            dev.devData.morale = Math.min(100, dev.devData.morale + 20);
            this.showFloatingText(dev.x, dev.y - 20, '☕', '#ffaa00');
        });

        this.showFloatingText(400, 480, 'Coffee break! Morale +20', '#00ff00');
    }

    nextSprint() {
        this.sprint++;

        // Pay upkeep
        let totalCost = 0;
        this.developers.forEach(dev => {
            totalCost += dev.devData.upkeepCost;
        });

        this.money -= totalCost;

        // Generate new tasks
        this.generateTasks(3);

        // Morale decay
        this.morale -= 10;
        this.codeQuality -= 5;

        this.showFloatingText(400, 300, `Sprint ${this.sprint} Started!`, '#00aaff');

        if (this.money < 0) {
            this.gameOver('Ran out of money! 💸');
        }
    }

    updateGameTime() {
        this.gameTime++;

        // Passive effects
        this.cicdMinutes = Math.min(100, this.cicdMinutes + 0.5);

        if (this.cicdMinutes <= 0) {
            this.gameOver('Out of CI/CD minutes! ⚙️');
        }

        if (this.morale <= 0) {
            this.gameOver('Team morale collapsed! 😢');
        }
    }

    triggerRandomEvent() {
        const events = [
            { msg: '🐛 Bug in production! -$200', effect: () => this.money -= 200 },
            { msg: '🎉 Client happy! +$300', effect: () => this.money += 300 },
            { msg: '☕ Free coffee day! +20 morale', effect: () => this.morale += 20 },
            { msg: '📦 Dependency update broke tests!', effect: () => this.codeQuality -= 10 },
            { msg: '🚀 Successful deploy! +10 quality', effect: () => this.codeQuality += 10 },
            { msg: '💤 Developer called in sick!', effect: () => {
                if (this.developers.length > 0) {
                    const dev = Phaser.Utils.Array.GetRandom(this.developers);
                    dev.devData.morale -= 30;
                }
            }}
        ];

        const event = Phaser.Utils.Array.GetRandom(events);
        event.effect();
        this.showFloatingText(400, 200, event.msg, '#ffaa00');
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
            duration: 2000,
            onComplete: () => floatingText.destroy()
        });
    }

    updateHUD() {
        this.moneyText.setText(`💰 Budget: $${Math.floor(this.money)}`);
        this.cicdText.setText(`⚙️ CI/CD: ${Math.floor(this.cicdMinutes)}min`);
        this.qualityText.setText(`📊 Quality: ${Math.floor(this.codeQuality)}%`);
        this.moraleText.setText(`😊 Morale: ${Math.floor(this.morale)}%`);
        this.sprintText.setText(`Sprint ${this.sprint} | Tasks: ${this.completedTasks}`);
    }

    showHireMenu() {
        // Simple hire junior for now
        const randomX = 150 + Phaser.Math.Between(0, 400);
        const randomY = 220 + Phaser.Math.Between(0, 150);
        this.hireDeveloper('Junior', randomX, randomY);
    }

    gameOver(reason) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.9).setOrigin(0);

        this.add.text(width / 2, height / 2 - 60, 'GAME OVER', {
            fontSize: '48px',
            fontFamily: 'monospace',
            color: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 - 10, reason, {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#ffaa00'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 30, `Sprints Completed: ${this.sprint}`, {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#00aaff'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 55, `Tasks Completed: ${this.completedTasks}`, {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#00ff00'
        }).setOrigin(0.5);

        const menuBtn = this.add.text(width / 2, height / 2 + 100, '[ Return to Menu ]', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);
        menuBtn.setInteractive({ useHandCursor: true });
        menuBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));

        this.physics.pause();
    }

    showInstructions() {
        const msg = this.add.text(400, 570, '💡 Hire devs, assign tasks, manage resources! Click devs to select, then click tasks to assign.', {
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#888888',
            align: 'center',
            wordWrap: { width: 700 }
        }).setOrigin(0.5);

        this.time.delayedCall(10000, () => {
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
