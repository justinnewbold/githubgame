// Bug Bounty Hunter - Logic puzzle debugging game mode

import Phaser from 'phaser';
import { gameData } from '../utils/GameData.js';
import SoundManager from '../utils/SoundManager.js';
import ParticleEffects from '../utils/ParticleEffects.js';

export default class BugBountyScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BugBountyScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Game state
        this.currentLevel = 1;
        this.maxLevels = 20;
        this.movesRemaining = 0;
        this.stars = 0;
        this.totalStars = 0;

        // Systems
        this.sounds = new SoundManager();
        this.particles = new ParticleEffects(this);

        // Background
        this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);

        // Load level
        this.loadLevel(this.currentLevel);

        // HUD
        this.createHUD();
    }

    getPuzzles() {
        return [
            {
                level: 1,
                title: 'Syntax Error',
                description: 'Fix the missing semicolon',
                code: ['let x = 5', 'console.log(x)'],
                bugs: [0], // Line 0 has bug
                solution: ['let x = 5;', 'console.log(x);'],
                maxMoves: 2,
                hint: 'Add semicolons'
            },
            {
                level: 2,
                title: 'Undefined Variable',
                description: 'Variable y is not defined',
                code: ['let x = 5;', 'console.log(y);'],
                bugs: [1],
                solution: ['let x = 5;', 'let y = x;', 'console.log(y);'],
                maxMoves: 3,
                hint: 'Define y before using it'
            },
            {
                level: 3,
                title: 'Infinite Loop',
                description: 'Loop never terminates',
                code: ['let i = 0;', 'while (i < 10) {', '  console.log(i);', '}'],
                bugs: [2],
                solution: ['let i = 0;', 'while (i < 10) {', '  console.log(i);', '  i++;', '}'],
                maxMoves: 4,
                hint: 'Increment i inside loop'
            },
            {
                level: 4,
                title: 'Type Coercion',
                description: 'String + Number = Bug',
                code: ['let a = "5";', 'let b = 10;', 'console.log(a + b);'],
                bugs: [0],
                solution: ['let a = 5;', 'let b = 10;', 'console.log(a + b);'],
                maxMoves: 3,
                hint: 'Convert string to number'
            },
            {
                level: 5,
                title: 'Array Out of Bounds',
                description: 'Accessing invalid index',
                code: ['let arr = [1, 2, 3];', 'console.log(arr[5]);'],
                bugs: [1],
                solution: ['let arr = [1, 2, 3];', 'if (5 < arr.length)', '  console.log(arr[5]);'],
                maxMoves: 5,
                hint: 'Check bounds before access'
            },
            {
                level: 6,
                title: 'Null Reference',
                description: 'Cannot read property of null',
                code: ['let obj = null;', 'console.log(obj.name);'],
                bugs: [0, 1],
                solution: ['let obj = { name: "test" };', 'console.log(obj.name);'],
                maxMoves: 4,
                hint: 'Initialize object before use'
            },
            {
                level: 7,
                title: 'Async/Await Missing',
                description: 'Promise not awaited',
                code: ['function getData() {', '  return fetch("/api");', '}', 'let data = getData();'],
                bugs: [3],
                solution: ['async function getData() {', '  return await fetch("/api");', '}', 'let data = await getData();'],
                maxMoves: 6,
                hint: 'Use async/await'
            },
            {
                level: 8,
                title: 'Memory Leak',
                description: 'Event listener not removed',
                code: ['function init() {', '  btn.addEventListener("click", handler);', '}'],
                bugs: [1],
                solution: ['function init() {', '  btn.addEventListener("click", handler);', '}', 'function cleanup() {', '  btn.removeEventListener("click", handler);', '}'],
                maxMoves: 7,
                hint: 'Add cleanup function'
            },
            {
                level: 9,
                title: 'Race Condition',
                description: 'Multiple async operations',
                code: ['let data;', 'fetchData().then(d => data = d);', 'processData(data);'],
                bugs: [2],
                solution: ['let data;', 'fetchData().then(d => {', '  data = d;', '  processData(data);', '});'],
                maxMoves: 6,
                hint: 'Wait for async before processing'
            },
            {
                level: 10,
                title: 'SQL Injection',
                description: 'Unsafe query construction',
                code: ['let query = "SELECT * FROM users"', '  + " WHERE name = " + userName;'],
                bugs: [1],
                solution: ['let query = "SELECT * FROM users WHERE name = ?";', 'db.execute(query, [userName]);'],
                maxMoves: 5,
                hint: 'Use parameterized queries'
            },
            // Add 10 more levels
            {
                level: 11,
                title: 'Off By One',
                description: 'Loop boundary error',
                code: ['for (let i = 0; i <= arr.length; i++) {', '  console.log(arr[i]);', '}'],
                bugs: [0],
                solution: ['for (let i = 0; i < arr.length; i++) {', '  console.log(arr[i]);', '}'],
                maxMoves: 3,
                hint: 'Use < instead of <='
            },
            {
                level: 12,
                title: 'Callback Hell',
                description: 'Nested callbacks',
                code: ['getData(d1 => {', '  moreData(d1, d2 => {', '    evenMore(d2, d3 => {', '      console.log(d3);', '    });', '  });', '});'],
                bugs: [0, 1, 2],
                solution: ['async function load() {', '  let d1 = await getData();', '  let d2 = await moreData(d1);', '  let d3 = await evenMore(d2);', '  console.log(d3);', '}'],
                maxMoves: 8,
                hint: 'Refactor to async/await'
            },
            {
                level: 13,
                title: 'Missing Error Handling',
                description: 'No try/catch',
                code: ['let data = JSON.parse(input);', 'console.log(data.value);'],
                bugs: [0, 1],
                solution: ['try {', '  let data = JSON.parse(input);', '  console.log(data.value);', '} catch (e) {', '  console.error(e);', '}'],
                maxMoves: 7,
                hint: 'Wrap in try/catch'
            },
            {
                level: 14,
                title: 'Closure Bug',
                description: 'Wrong variable in closure',
                code: ['for (var i = 0; i < 3; i++) {', '  setTimeout(() => console.log(i), 100);', '}'],
                bugs: [0],
                solution: ['for (let i = 0; i < 3; i++) {', '  setTimeout(() => console.log(i), 100);', '}'],
                maxMoves: 3,
                hint: 'Use let instead of var'
            },
            {
                level: 15,
                title: 'Shallow Copy Issue',
                description: 'Mutating original object',
                code: ['let a = { x: 1 };', 'let b = a;', 'b.x = 2;'],
                bugs: [1],
                solution: ['let a = { x: 1 };', 'let b = { ...a };', 'b.x = 2;'],
                maxMoves: 4,
                hint: 'Use spread operator'
            },
            {
                level: 16,
                title: 'Missing Return',
                description: 'Function returns undefined',
                code: ['function add(a, b) {', '  a + b;', '}'],
                bugs: [1],
                solution: ['function add(a, b) {', '  return a + b;', '}'],
                maxMoves: 3,
                hint: 'Add return statement'
            },
            {
                level: 17,
                title: 'Floating Point Error',
                description: '0.1 + 0.2 !== 0.3',
                code: ['let result = 0.1 + 0.2;', 'if (result === 0.3) {', '  console.log("equal");', '}'],
                bugs: [1],
                solution: ['let result = 0.1 + 0.2;', 'if (Math.abs(result - 0.3) < 0.0001) {', '  console.log("equal");', '}'],
                maxMoves: 5,
                hint: 'Use epsilon comparison'
            },
            {
                level: 18,
                title: 'DOM Not Ready',
                description: 'Accessing DOM too early',
                code: ['let el = document.querySelector(".btn");', 'el.addEventListener("click", handler);'],
                bugs: [0, 1],
                solution: ['document.addEventListener("DOMContentLoaded", () => {', '  let el = document.querySelector(".btn");', '  el.addEventListener("click", handler);', '});'],
                maxMoves: 6,
                hint: 'Wait for DOMContentLoaded'
            },
            {
                level: 19,
                title: 'Integer Overflow',
                description: 'Number too large',
                code: ['let big = 9007199254740992;', 'console.log(big + 1 === big);'],
                bugs: [0],
                solution: ['let big = BigInt(9007199254740992);', 'console.log(big + 1n === big);'],
                maxMoves: 4,
                hint: 'Use BigInt'
            },
            {
                level: 20,
                title: 'The Final Bug',
                description: 'Combination of multiple bugs',
                code: ['var data = null;', 'fetchData().then(d => data = d)', 'if (data.value == "test") {', '  processData(data)', '}'],
                bugs: [0, 1, 2, 3],
                solution: ['let data = null;', 'fetchData().then(d => {', '  data = d;', '  if (data && data.value === "test") {', '    processData(data);', '  }', '});'],
                maxMoves: 10,
                hint: 'Fix all the bugs!'
            }
        ];
    }

    loadLevel(levelNum) {
        const puzzles = this.getPuzzles();
        const puzzle = puzzles.find(p => p.level === levelNum);

        if (!puzzle) {
            this.winGame();
            return;
        }

        this.currentPuzzle = puzzle;
        this.movesRemaining = puzzle.maxMoves;
        this.movesMade = 0;

        this.displayPuzzle(puzzle);
    }

    displayPuzzle(puzzle) {
        // Clear previous
        if (this.puzzleContainer) {
            this.puzzleContainer.destroy();
        }

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.puzzleContainer = this.add.container(0, 0);

        // Title
        const title = this.add.text(width / 2, 100, `Level ${puzzle.level}: ${puzzle.title}`, {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Description
        const desc = this.add.text(width / 2, 130, puzzle.description, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffaa00'
        }).setOrigin(0.5);

        // Code display
        const codeY = 180;
        const codeLines = [];
        puzzle.code.forEach((line, index) => {
            const isBug = puzzle.bugs.includes(index);
            const lineText = this.add.text(100, codeY + (index * 25), `${index + 1}  ${line}`, {
                fontSize: '12px',
                fontFamily: 'monospace',
                color: isBug ? '#ff0000' : '#00ff00',
                backgroundColor: isBug ? '#330000' : '#001100',
                padding: { x: 8, y: 4 }
            });

            if (isBug) {
                lineText.setInteractive({ useHandCursor: true });
                lineText.on('pointerdown', () => this.fixLine(index));
                lineText.on('pointerover', () => lineText.setStyle({ backgroundColor: '#660000' }));
                lineText.on('pointerout', () => lineText.setStyle({ backgroundColor: '#330000' }));
            }

            codeLines.push(lineText);
            this.puzzleContainer.add(lineText);
        });

        // Hint button
        const hintBtn = this.add.text(width / 2, height - 100, '💡 Show Hint', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffffff',
            backgroundColor: '#0066aa',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);

        hintBtn.setInteractive({ useHandCursor: true });
        hintBtn.on('pointerdown', () => {
            this.particles.floatingText(width / 2, height - 150, puzzle.hint, '#ffff00', '16px');
            this.movesRemaining = Math.max(0, this.movesRemaining - 1);
            this.updateHUD();
        });
        hintBtn.on('pointerover', () => hintBtn.setStyle({ backgroundColor: '#0088cc' }));
        hintBtn.on('pointerout', () => hintBtn.setStyle({ backgroundColor: '#0066aa' }));

        this.puzzleContainer.add([title, desc, hintBtn]);
    }

    fixLine(lineIndex) {
        this.movesMade++;
        this.movesRemaining--;

        this.sounds.playSound('collect');
        this.particles.sparkle(400, 300, 0x00ff00, 20);

        // Check if solved
        const allFixed = this.currentPuzzle.bugs.every(bugLine => bugLine === lineIndex || this.movesMade > bugLine);

        if (this.movesRemaining === 0 || allFixed) {
            this.completeLevel();
        }

        this.updateHUD();
    }

    completeLevel() {
        // Calculate stars
        const movesRatio = this.movesMade / this.currentPuzzle.maxMoves;
        let stars = 3;
        if (movesRatio > 0.8) stars = 2;
        if (movesRatio > 1) stars = 1;

        this.stars = stars;
        this.totalStars += stars;

        this.sounds.playSound('upgrade');
        this.particles.confetti(400, 300);

        this.showLevelComplete();
    }

    showLevelComplete() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8);
        overlay.setOrigin(0);

        this.add.text(width / 2, height / 2 - 80, '✅ LEVEL COMPLETE!', {
            fontSize: '32px',
            fontFamily: 'monospace',
            color: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Star display
        const starText = '⭐'.repeat(this.stars) + '☆'.repeat(3 - this.stars);
        this.add.text(width / 2, height / 2 - 30, starText, {
            fontSize: '40px'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 20, `Moves: ${this.movesMade} / ${this.currentPuzzle.maxMoves}`, {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#ffff00'
        }).setOrigin(0.5);

        // Next button
        const nextBtn = this.add.text(width / 2, height / 2 + 80, '[ Next Level → ]', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5);

        nextBtn.setInteractive({ useHandCursor: true });
        nextBtn.on('pointerdown', () => {
            overlay.destroy();
            this.currentLevel++;
            this.loadLevel(this.currentLevel);
        });
        nextBtn.on('pointerover', () => nextBtn.setStyle({ backgroundColor: '#333333' }));
        nextBtn.on('pointerout', () => nextBtn.setStyle({ backgroundColor: '#000000' }));

        // Update stats
        gameData.updateStat('bugBounty.levelsCompleted', this.currentLevel, 'max');
        gameData.updateStat('bugBounty.totalStars', this.totalStars, 'add');
        gameData.save();
    }

    winGame() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.9);
        overlay.setOrigin(0);

        this.add.text(width / 2, height / 2 - 50, '🎉 ALL BUGS FIXED! 🎉', {
            fontSize: '32px',
            fontFamily: 'monospace',
            color: '#ffff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 10, `Total Stars: ${this.totalStars} / 60`, {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#00ff00'
        }).setOrigin(0.5);

        this.createReturnButton();
    }

    createHUD() {
        // Moves remaining
        this.movesText = this.add.text(20, 20, `Moves: ${this.movesRemaining}`, {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#ffff00'
        });

        // Level
        this.levelText = this.add.text(20, 45, `Level: ${this.currentLevel} / ${this.maxLevels}`, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#00aaff'
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

    updateHUD() {
        this.movesText.setText(`Moves: ${this.movesRemaining}`);
        this.levelText.setText(`Level: ${this.currentLevel} / ${this.maxLevels}`);
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
