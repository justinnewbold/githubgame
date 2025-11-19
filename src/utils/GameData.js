// Global game data manager - tracks achievements, stats, and progression
// Uses localStorage for persistence

export default class GameData {
    constructor() {
        this.storageKey = 'gitgame_data';
        this.data = this.load();
    }

    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Could not load game data:', e);
        }

        // Default data structure
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
            achievements: [],
            unlockedContent: {
                difficulty: ['normal'], // normal, hard, nightmare
                skins: ['default'],
                powerups: []
            },
            settings: {
                soundEnabled: true,
                musicEnabled: true,
                difficulty: 'normal'
            }
        };
    }

    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (e) {
            console.warn('Could not save game data:', e);
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

    unlockAchievement(id) {
        if (!this.data.achievements.includes(id)) {
            this.data.achievements.push(id);
            this.save();
            return this.getAchievements().find(a => a.id === id);
        }
        return null;
    }

    hasAchievement(id) {
        return this.data.achievements.includes(id);
    }

    updateStat(path, value, operation = 'set') {
        const keys = path.split('.');
        let current = this.data.stats;

        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
        }

        const lastKey = keys[keys.length - 1];

        if (operation === 'increment') {
            current[lastKey] = (current[lastKey] || 0) + value;
        } else if (operation === 'max') {
            current[lastKey] = Math.max(current[lastKey] || 0, value);
        } else {
            current[lastKey] = value;
        }

        this.save();
    }

    getStat(path) {
        const keys = path.split('.');
        let current = this.data.stats;

        for (let key of keys) {
            current = current[key];
            if (current === undefined) return 0;
        }

        return current;
    }

    getDifficulty() {
        return this.data.settings.difficulty || 'normal';
    }

    setDifficulty(difficulty) {
        this.data.settings.difficulty = difficulty;
        this.save();
    }

    // Check and unlock achievements based on stats
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

    reset() {
        localStorage.removeItem(this.storageKey);
        this.data = this.load();
    }
}

// Singleton instance
export const gameData = new GameData();
