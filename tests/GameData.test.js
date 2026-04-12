/**
 * Tests for GameData utility
 * Run with: npm test
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

// Mock localStorage for Node.js environment
global.localStorage = {
    data: {},
    getItem(key) {
        return this.data[key] || null;
    },
    setItem(key, value) {
        this.data[key] = value;
    },
    removeItem(key) {
        delete this.data[key];
    },
    clear() {
        this.data = {};
    }
};

// Now import GameData after localStorage is mocked
const GameData = (await import('../src/utils/GameData.js')).default;

describe('GameData', () => {
    let gameData;

    beforeEach(() => {
        global.localStorage.clear();
        gameData = new GameData();
    });

    describe('Initialization', () => {
        it('should initialize with default data structure', () => {
            assert.ok(gameData.data);
            assert.ok(gameData.data.stats);
            assert.ok(gameData.data.settings);
            assert.ok(typeof gameData.data.achievements === 'object');
            assert.ok(gameData.data.achievements.unlocked !== undefined);
        });

        it('should have correct default stats', () => {
            assert.strictEqual(gameData.data.stats.gamesPlayed, 0);
            assert.strictEqual(gameData.data.stats.totalScore, 0);
        });
    });

    describe('updateStat', () => {
        it('should set a stat value', () => {
            gameData.updateStat('gamesPlayed', 5);
            assert.strictEqual(gameData.getStat('gamesPlayed'), 5);
        });

        it('should increment a stat value', () => {
            gameData.updateStat('gamesPlayed', 1, 'increment');
            gameData.updateStat('gamesPlayed', 3, 'increment');
            assert.strictEqual(gameData.getStat('gamesPlayed'), 4);
        });

        it('should handle max operation correctly', () => {
            gameData.updateStat('totalScore', 100, 'max');
            gameData.updateStat('totalScore', 50, 'max');
            assert.strictEqual(gameData.getStat('totalScore'), 100);

            gameData.updateStat('totalScore', 150, 'max');
            assert.strictEqual(gameData.getStat('totalScore'), 150);
        });

        it('should handle nested paths', () => {
            gameData.updateStat('gitSurvivor.highScore', 1000);
            assert.strictEqual(gameData.getStat('gitSurvivor.highScore'), 1000);
        });

        it('should create missing nested objects', () => {
            gameData.updateStat('newGame.newStat.value', 42);
            assert.strictEqual(gameData.getStat('newGame.newStat.value'), 42);
        });

        it('should return false for invalid numeric operations', () => {
            const result = gameData.updateStat('test', 'string', 'increment');
            assert.strictEqual(result, false);
        });
    });

    describe('getStat', () => {
        it('should return 0 for non-existent stat', () => {
            assert.strictEqual(gameData.getStat('nonExistent'), 0);
        });

        it('should return 0 for deeply nested non-existent path', () => {
            assert.strictEqual(gameData.getStat('a.b.c.d.e'), 0);
        });

        it('should retrieve nested stats correctly', () => {
            gameData.updateStat('gitSurvivor.enemiesKilled', 50);
            assert.strictEqual(gameData.getStat('gitSurvivor.enemiesKilled'), 50);
        });
    });

    describe('Achievements', () => {
        it('should start with no achievements', () => {
            assert.strictEqual(Object.keys(gameData.data.achievements.unlocked || {}).length, 0);
        });

        it('should unlock achievements', () => {
            const achievement = gameData.unlockAchievement('first_blood');
            assert.ok(achievement);
            assert.strictEqual(achievement.id, 'first_blood');
            assert.ok(gameData.hasAchievement('first_blood'));
        });

        it('should track the last unlocked achievement', () => {
            gameData.unlockAchievement('first_blood');
            const latest = gameData.getLastUnlockedAchievement();
            assert.ok(latest);
            assert.strictEqual(latest.id, 'first_blood');
            assert.ok(latest.unlockedAt);
        });

        it('should not unlock same achievement twice', () => {
            gameData.unlockAchievement('first_blood');
            const second = gameData.unlockAchievement('first_blood');
            assert.strictEqual(second, null);
            assert.strictEqual(Object.keys(gameData.data.achievements.unlocked).length, 1);
        });
    });

    describe('Persistence', () => {
        it('should save and load data', () => {
            gameData.updateStat('gamesPlayed', 10);
            gameData.unlockAchievement('survivor');

            // Create new instance which should load from localStorage
            const gameData2 = new GameData();
            assert.strictEqual(gameData2.getStat('gamesPlayed'), 10);
            assert.ok(gameData2.hasAchievement('survivor'));
        });

        it('should handle corrupted data gracefully', () => {
            global.localStorage.setItem('gitgame_data', 'invalid json{');
            const gameData2 = new GameData();
            assert.ok(gameData2.data);
            assert.strictEqual(gameData2.getStat('gamesPlayed'), 0);
        });
    });

    describe('Validation', () => {
        it('should validate correct data structure', () => {
            assert.ok(gameData.validateData());
        });

        it('should detect invalid data', () => {
            gameData.data = null;
            assert.strictEqual(gameData.validateData(), false);
        });
    });

    describe('Export/Import', () => {
        it('should export data as JSON string', () => {
            gameData.updateStat('gamesPlayed', 5);
            const exported = gameData.exportData();
            assert.ok(exported);
            assert.ok(exported.includes('"gamesPlayed": 5'));
        });

        it('should import data from JSON string', () => {
            const testData = {
                stats: { gamesPlayed: 20, totalScore: 5000 },
                achievements: { unlocked: { first_blood: { unlockedAt: Date.now() } }, progress: {}, totalPoints: 0 },
                settings: { difficulty: 'hard' },
                unlockedContent: { difficulty: ['normal', 'hard'] }
            };
            const success = gameData.importData(JSON.stringify(testData));
            assert.ok(success);
            assert.strictEqual(gameData.getStat('gamesPlayed'), 20);
            assert.ok(gameData.hasAchievement('first_blood'));
        });

        it('should handle invalid import data', () => {
            const success = gameData.importData('invalid{json');
            assert.strictEqual(success, false);
        });
    });

    describe('Reset', () => {
        it('should reset all data to defaults', () => {
            gameData.updateStat('gamesPlayed', 100);
            gameData.unlockAchievement('survivor');

            gameData.reset();

            assert.strictEqual(gameData.getStat('gamesPlayed'), 0);
            assert.strictEqual(Object.keys(gameData.data.achievements.unlocked || {}).length, 0);
        });
    });
});
