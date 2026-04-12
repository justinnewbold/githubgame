// Global game data manager - tracks achievements, stats, and progression
// Uses localStorage for persistence

import { logger } from './Logger.js';

/**
 * @typedef {Object} GameSettings
 * @property {boolean} soundEnabled - Whether sound effects are enabled
 * @property {boolean} musicEnabled - Whether music is enabled
 * @property {number} masterVolume - Master volume (0.0 to 1.0)
 * @property {number} musicVolume - Music volume (0.0 to 1.0)
 * @property {number} sfxVolume - SFX volume (0.0 to 1.0)
 * @property {string} difficulty - Current difficulty ('normal', 'hard', 'nightmare')
 * @property {boolean} [colorBlindMode] - Whether color blind mode is enabled
 * @property {boolean} [hapticFeedback] - Whether haptic feedback is enabled (mobile)
 * @property {boolean} [tutorialSeenGitSurvivor] - Whether tutorial was seen
 */

/**
 * @typedef {Object} Achievement
 * @property {string} id - Unique achievement identifier
 * @property {string} name - Display name
 * @property {string} desc - Description
 * @property {string} icon - Emoji icon
 */

/**
 * GameData - Central manager for game persistence, achievements, and stats
 * @class
 */
export default class GameData {
    constructor() {
        /** @type {string} */
        this.storageKey = 'gitgame_data';
        /** @type {Object} */
        this.data = this.load();
        /** @type {Map<string, Set<Function>>} */
        this._eventListeners = new Map();
    }

    /**
     * Load game data from localStorage
     * @returns {Object} Game data object
     */
    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Validate the structure and merge with defaults to ensure all fields exist
                return this.mergeWithDefaults(parsed);
            }
        } catch (e) {
            logger.error('GameData', 'Failed to load game data, using defaults', { error: e.message });
            // If parsing fails, clear corrupted data
            this.clearCorruptedData();
        }

        // Default data structure
        return this.getDefaultData();
    }

    getDefaultData() {
        return {
            stats: {
                gamesPlayed: 0,
                totalScore: 0,
                totalTimeplayed: 0,
                gitSurvivor: { highScore: 0, gamesPlayed: 0, enemiesKilled: 0 },
                codeDefense: { highWave: 0, gamesPlayed: 0, towersPlaced: 0 },
                prRush: { bestAccuracy: 0, gamesPlayed: 0, prsReviewed: 0 },
                devCommander: { maxSprints: 0, gamesPlayed: 0, tasksCompleted: 0 },
                debugDungeon: { highScore: 0, gamesPlayed: 0, bugsFixed: 0 },
                refactorRace: { highScore: 0, gamesPlayed: 0, totalRefactors: 0 },
                sprintSurvivor: { highScore: 0, gamesPlayed: 0, maxDistance: 0 },
                bugBounty: { levelsCompleted: 0, totalStars: 0 },
                legacyExcavator: { highScore: 0, gamesPlayed: 0, maxDepth: 0, artifactsFound: 0 },
                bossRush: { highScore: 0, gamesPlayed: 0, bossesDefeated: 0 }
            },
            achievements: {
                unlocked: {},
                progress: {},
                totalPoints: 0,
                lastUnlocked: null
            },
            unlockedContent: {
                difficulty: ['normal'], // normal, hard, nightmare
                skins: ['default'],
                powerups: []
            },
            settings: {
                soundEnabled: true,
                musicEnabled: true,
                masterVolume: 1.0,
                musicVolume: 1.0,
                sfxVolume: 1.0,
                difficulty: 'normal',
                colorBlindMode: false,
                hapticFeedback: true
            }
        };
    }

    // ==================== Event System ====================

    /**
     * Subscribe to a game event
     * @param {string} event - Event name ('achievement', 'levelUp', 'powerUp', 'gameOver', 'settingsChanged')
     * @param {Function} callback - Function to call when event fires
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this._eventListeners.has(event)) {
            this._eventListeners.set(event, new Set());
        }
        this._eventListeners.get(event).add(callback);

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Unsubscribe from a game event
     * @param {string} event - Event name
     * @param {Function} callback - Function to remove
     */
    off(event, callback) {
        if (this._eventListeners.has(event)) {
            this._eventListeners.get(event).delete(callback);
        }
    }

    /**
     * Emit a game event
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    emit(event, data) {
        if (this._eventListeners.has(event)) {
            this._eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    logger.error('GameData', `Error in event listener for ${event}`, { error: e.message });
                }
            });
        }
    }

    // ==================== Settings Access ====================

    /**
     * Get all settings (safe accessor)
     * @returns {GameSettings} Current settings object
     */
    getSettings() {
        return { ...this.data.settings };
    }

    /**
     * Get a specific setting value
     * @param {string} key - Setting key
     * @param {*} defaultValue - Default value if setting doesn't exist
     * @returns {*} Setting value
     */
    getSetting(key, defaultValue = null) {
        return this.data.settings[key] !== undefined ? this.data.settings[key] : defaultValue;
    }

    /**
     * Update a setting value
     * @param {string} key - Setting key
     * @param {*} value - New value
     * @returns {boolean} Success status
     */
    setSetting(key, value) {
        const oldValue = this.data.settings[key];
        this.data.settings[key] = value;
        const saved = this.save();

        if (saved && oldValue !== value) {
            this.emit('settingsChanged', { key, value, oldValue });
        }

        return saved;
    }

    /**
     * Save game data to localStorage
     * @returns {boolean} Success status
     */
    save() {
        try {
            const serialized = JSON.stringify(this.data);
            // Check if serialization worked and data isn't too large
            if (serialized && serialized.length < 5000000) { // 5MB limit
                localStorage.setItem(this.storageKey, serialized);
                return true;
            } else {
                logger.error('GameData', 'Game data too large to save');
                return false;
            }
        } catch (e) {
            logger.error('GameData', 'Failed to save game data', { error: e.message });
            // Check for quota exceeded error
            if (e.name === 'QuotaExceededError') {
                logger.error('GameData', 'Storage quota exceeded. Consider clearing old data.');
            }
            return false;
        }
    }

    // Merge saved data with defaults to handle missing fields
    mergeWithDefaults(saved) {
        const defaults = this.getDefaultData();

        // Deep merge function
        const deepMerge = (target, source) => {
            const result = { ...target };
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = deepMerge(target[key] || {}, source[key]);
                } else {
                    result[key] = source[key] !== undefined ? source[key] : target[key];
                }
            }
            return result;
        };

        return deepMerge(defaults, saved);
    }

    /**
     * Clear corrupted localStorage data
     */
    clearCorruptedData() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (e) {
            logger.error('GameData', 'Failed to clear corrupted data', { error: e.message });
        }
    }

    // Achievement definitions
    getAchievements() {
        return [
            { id: 'first_blood', name: 'First Blood', desc: 'Kill your first bug', icon: '🐛' },
            { id: 'survivor', name: 'Survivor', desc: 'Survive 100 enemies in Git Survivor', icon: '💪' },
            { id: 'tower_master', name: 'Tower Master', desc: 'Place 50 towers', icon: '🏰' },
            { id: 'pr_pro', name: 'PR Pro', desc: 'Review 100 PRs', icon: '👀' },
            { id: 'perfect_review', name: 'Perfect Review', desc: 'Get 100% accuracy in PR Rush', icon: '💯' },
            { id: 'team_player', name: 'Team Player', desc: 'Hire 10 developers', icon: '👥' },
            { id: 'sprint_master', name: 'Sprint Master', desc: 'Complete 10 sprints', icon: '🏃' },
            { id: 'workaholic', name: 'Workaholic', desc: 'Play 50 games total', icon: '😅' },
            { id: 'coffee_addict', name: 'Coffee Addict', desc: 'Buy coffee 20 times', icon: '☕' },
            { id: 'boss_slayer', name: 'Boss Slayer', desc: 'Defeat a boss enemy', icon: '⚔️' },
            { id: 'no_bugs', name: 'Bug Free', desc: 'Win Code Defense without losing HP', icon: '✨' },
            { id: 'speedrun', name: 'Speedrunner', desc: 'Complete a game in under 2 minutes', icon: '⚡' },
            { id: 'hoarder', name: 'Hoarder', desc: 'Collect 50 power-ups', icon: '🎁' },
            { id: 'merge_king', name: 'Merge King', desc: 'Defeat 10 merge conflicts', icon: '👑' },
            { id: 'senior_dev', name: 'Senior Dev', desc: 'Hire a senior developer', icon: '🧔' }
        ];
    }

    /**
     * Unlock an achievement
     * @param {string} id - Achievement ID
     * @returns {Achievement|null} The unlocked achievement, or null if already unlocked
     */
    unlockAchievement(id) {
        if (!this.hasAchievement(id)) {
            if (!this.data.achievements.unlocked) {
                this.data.achievements.unlocked = {};
            }
            const unlockedAt = Date.now();
            this.data.achievements.unlocked[id] = { unlockedAt };
            this.data.achievements.lastUnlocked = id;
            this.save();
            const achievement = this.getAchievements().find(a => a.id === id);
            if (achievement) {
                this.emit('achievement', achievement);
            }
            return achievement;
        }
        return null;
    }

    hasAchievement(id) {
        return !!(this.data.achievements.unlocked && this.data.achievements.unlocked[id]);
    }

    getLastUnlockedAchievement() {
        const lastUnlockedId = this.data.achievements.lastUnlocked;
        if (!lastUnlockedId) {
            return null;
        }

        const achievement = this.getAchievements().find(({ id }) => id === lastUnlockedId);
        if (!achievement) {
            return null;
        }

        return {
            ...achievement,
            unlockedAt: this.data.achievements.unlocked?.[lastUnlockedId]?.unlockedAt || null
        };
    }

    /**
     * Update a stat value
     * @param {string} path - Dot-separated path to stat (e.g., 'gitSurvivor.highScore')
     * @param {*} value - Value to set/add
     * @param {string} operation - 'set', 'increment', or 'max'
     * @returns {boolean} Success status
     */
    updateStat(path, value, operation = 'set') {
        try {
            const keys = path.split('.');
            let current = this.data.stats;

            // Navigate and create missing intermediate objects
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (!current[key] || typeof current[key] !== 'object') {
                    current[key] = {};
                }
                current = current[key];
            }

            const lastKey = keys[keys.length - 1];

            // Validate value is a number for numeric operations
            if ((operation === 'increment' || operation === 'max') && typeof value !== 'number') {
                logger.error('GameData', `Invalid value type for ${operation} operation: ${typeof value}`);
                return false;
            }

            // Perform operation
            if (operation === 'increment') {
                current[lastKey] = (current[lastKey] || 0) + value;
            } else if (operation === 'max') {
                current[lastKey] = Math.max(current[lastKey] || 0, value);
            } else {
                current[lastKey] = value;
            }

            return this.save();
        } catch (e) {
            logger.error('GameData', `Failed to update stat '${path}'`, { error: e.message });
            return false;
        }
    }

    /**
     * Get a stat value
     * @param {string} path - Dot-separated path to stat
     * @returns {number|*} Stat value or 0 if not found
     */
    getStat(path) {
        try {
            const keys = path.split('.');
            let current = this.data.stats;

            for (let key of keys) {
                if (current === null || current === undefined) {
                    return 0;
                }
                current = current[key];
            }

            return current !== undefined ? current : 0;
        } catch (e) {
            logger.error('GameData', `Failed to get stat '${path}'`, { error: e.message });
            return 0;
        }
    }

    /**
     * Get current difficulty setting
     * @returns {string} Difficulty ('normal', 'hard', 'nightmare')
     */
    getDifficulty() {
        return this.data.settings.difficulty || 'normal';
    }

    /**
     * Set difficulty
     * @param {string} difficulty - New difficulty
     */
    setDifficulty(difficulty) {
        this.setSetting('difficulty', difficulty);
    }

    /**
     * Check and unlock achievements based on current stats
     * @returns {Achievement[]} Newly unlocked achievements
     */
    checkAchievements() {
        const unlocked = [];

        // Check various achievement conditions
        if (this.getStat('gitSurvivor.enemiesKilled') >= 100 && !this.hasAchievement('survivor')) {
            unlocked.push(this.unlockAchievement('survivor'));
        }

        if (this.getStat('codeDefense.towersPlaced') >= 50 && !this.hasAchievement('tower_master')) {
            unlocked.push(this.unlockAchievement('tower_master'));
        }

        if (this.getStat('prRush.prsReviewed') >= 100 && !this.hasAchievement('pr_pro')) {
            unlocked.push(this.unlockAchievement('pr_pro'));
        }

        if (this.getStat('gamesPlayed') >= 50 && !this.hasAchievement('workaholic')) {
            unlocked.push(this.unlockAchievement('workaholic'));
        }

        return unlocked.filter(a => a !== null);
    }

    /**
     * Reset all game data to defaults
     * @returns {boolean} Success status
     */
    reset() {
        try {
            localStorage.removeItem(this.storageKey);
            this.data = this.getDefaultData();
            this.save();
            return true;
        } catch (e) {
            logger.error('GameData', 'Failed to reset game data', { error: e.message });
            return false;
        }
    }

    /**
     * Validate data integrity
     * @returns {boolean} True if data structure is valid
     */
    validateData() {
        if (!this.data || typeof this.data !== 'object') return false;
        if (!this.data.stats || typeof this.data.stats !== 'object') return false;
        if (!this.data.settings || typeof this.data.settings !== 'object') return false;
        if (!this.data.achievements || typeof this.data.achievements !== 'object') return false;
        return true;
    }

    /**
     * Export data for backup
     * @returns {string|null} JSON string of game data
     */
    exportData() {
        try {
            return JSON.stringify(this.data, null, 2);
        } catch (e) {
            logger.error('GameData', 'Failed to export data', { error: e.message });
            return null;
        }
    }

    /**
     * Import data from backup
     * @param {string} jsonString - JSON string to import
     * @returns {boolean} Success status
     */
    importData(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            this.data = this.mergeWithDefaults(imported);
            return this.save();
        } catch (e) {
            logger.error('GameData', 'Failed to import data', { error: e.message });
            return false;
        }
    }
}

// Singleton instance
export const gameData = new GameData();
