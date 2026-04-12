/**
 * ChallengeSystem - Daily and Weekly challenges with rotating objectives
 * Provides special goals, rewards, and leaderboard competition
 */

import { logger } from './Logger.js';
import { gameData } from './GameData.js';

// Challenge type definitions
const CHALLENGE_TYPES = {
    // Score challenges
    score_target: {
        generate: (difficulty) => ({
            type: 'score_target',
            target: [1000, 2500, 5000, 10000][difficulty],
            description: (t) => `Score ${t.toLocaleString()} points in a single game`
        })
    },
    cumulative_score: {
        generate: (difficulty) => ({
            type: 'cumulative_score',
            target: [5000, 15000, 30000, 50000][difficulty],
            description: (t) => `Score ${t.toLocaleString()} total points`
        })
    },

    // Survival challenges
    survive_time: {
        generate: (difficulty) => ({
            type: 'survive_time',
            target: [60, 180, 300, 600][difficulty], // seconds
            description: (t) => `Survive for ${Math.floor(t / 60)} minute${t >= 120 ? 's' : ''}`
        })
    },

    // Kill challenges
    kill_count: {
        generate: (difficulty) => ({
            type: 'kill_count',
            target: [25, 50, 100, 200][difficulty],
            description: (t) => `Eliminate ${t} enemies in a single game`
        })
    },
    cumulative_kills: {
        generate: (difficulty) => ({
            type: 'cumulative_kills',
            target: [100, 250, 500, 1000][difficulty],
            description: (t) => `Eliminate ${t} enemies total`
        })
    },

    // Combo challenges
    combo_reach: {
        generate: (difficulty) => ({
            type: 'combo_reach',
            target: [5, 10, 15, 25][difficulty],
            description: (t) => `Reach a ${t}x combo`
        })
    },

    // Collection challenges
    collect_powerups: {
        generate: (difficulty) => ({
            type: 'collect_powerups',
            target: [10, 25, 50, 100][difficulty],
            description: (t) => `Collect ${t} power-ups`
        })
    },

    // Game count challenges
    play_games: {
        generate: (difficulty) => ({
            type: 'play_games',
            target: [3, 5, 10, 15][difficulty],
            description: (t) => `Play ${t} games`
        })
    },

    // Mode-specific challenges
    play_mode: {
        generate: (difficulty, mode) => ({
            type: 'play_mode',
            target: [1, 2, 3, 5][difficulty],
            mode: mode,
            description: (t, m) => `Play ${t} game${t > 1 ? 's' : ''} of ${m}`
        })
    },

    // Perfect game challenges
    no_damage_game: {
        generate: () => ({
            type: 'no_damage_game',
            target: 1,
            description: () => `Complete a game without taking damage`
        })
    }
};

// Reward tiers
const REWARDS = {
    daily: {
        easy: { points: 50, title: 'Daily Novice' },
        medium: { points: 100, title: 'Daily Warrior' },
        hard: { points: 200, title: 'Daily Champion' }
    },
    weekly: {
        easy: { points: 150, title: 'Weekly Starter' },
        medium: { points: 300, title: 'Weekly Hero' },
        hard: { points: 500, title: 'Weekly Legend' }
    }
};

export default class ChallengeSystem {
    constructor() {
        this.initializeChallenges();
    }

    /**
     * Initialize challenge data
     */
    initializeChallenges() {
        if (!gameData.data.challenges) {
            gameData.data.challenges = {
                daily: null,
                weekly: null,
                history: [],
                streaks: {
                    daily: 0,
                    weekly: 0,
                    lastDailyComplete: null,
                    lastWeeklyComplete: null
                },
                totalRewards: 0
            };
        }

        // Check and generate new challenges if needed
        this.checkAndGenerateChallenges();
    }

    /**
     * Check if challenges need to be refreshed
     */
    checkAndGenerateChallenges() {
        const now = new Date();
        const today = this.getDateKey(now);
        const thisWeek = this.getWeekKey(now);

        // Check daily challenge
        if (!gameData.data.challenges.daily || gameData.data.challenges.daily.dateKey !== today) {
            this.generateDailyChallenge();
        }

        // Check weekly challenge
        if (!gameData.data.challenges.weekly || gameData.data.challenges.weekly.weekKey !== thisWeek) {
            this.generateWeeklyChallenge();
        }
    }

    /**
     * Get date key for daily challenges (YYYY-MM-DD)
     */
    getDateKey(date) {
        return date.toISOString().split('T')[0];
    }

    /**
     * Get week key for weekly challenges (YYYY-WW)
     */
    getWeekKey(date) {
        const year = date.getFullYear();
        const startOfYear = new Date(year, 0, 1);
        const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
        const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
        return `${year}-W${week.toString().padStart(2, '0')}`;
    }

    /**
     * Generate a seeded random number for consistent daily/weekly challenges
     */
    seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    /**
     * Generate daily challenges
     */
    generateDailyChallenge() {
        const now = new Date();
        const dateKey = this.getDateKey(now);
        const seed = parseInt(dateKey.replace(/-/g, ''));

        // Generate 3 daily challenges with varying difficulties
        const challenges = [
            this.generateChallenge(seed, 0, 'easy'),      // Easy
            this.generateChallenge(seed + 1, 1, 'medium'), // Medium
            this.generateChallenge(seed + 2, 2, 'hard')    // Hard
        ];

        gameData.data.challenges.daily = {
            dateKey,
            challenges,
            generatedAt: Date.now(),
            expiresAt: this.getNextMidnight().getTime()
        };

        gameData.save();
        logger.info('ChallengeSystem', 'Generated new daily challenges');
    }

    /**
     * Generate weekly challenges
     */
    generateWeeklyChallenge() {
        const now = new Date();
        const weekKey = this.getWeekKey(now);
        const seed = parseInt(weekKey.replace(/\D/g, ''));

        // Generate 3 weekly challenges (harder than daily)
        const challenges = [
            this.generateChallenge(seed, 1, 'easy'),      // Easy (medium difficulty)
            this.generateChallenge(seed + 1, 2, 'medium'), // Medium (hard difficulty)
            this.generateChallenge(seed + 2, 3, 'hard')    // Hard (very hard)
        ];

        gameData.data.challenges.weekly = {
            weekKey,
            challenges,
            generatedAt: Date.now(),
            expiresAt: this.getNextMonday().getTime()
        };

        gameData.save();
        logger.info('ChallengeSystem', 'Generated new weekly challenges');
    }

    /**
     * Generate a single challenge
     */
    generateChallenge(seed, difficulty, tier) {
        const types = Object.keys(CHALLENGE_TYPES);
        const typeIndex = Math.floor(this.seededRandom(seed) * types.length);
        const type = types[typeIndex];
        const generator = CHALLENGE_TYPES[type];

        // For mode-specific challenges, pick a random mode
        const modes = ['GitSurvivor', 'CodeDefense', 'BranchRacer'];
        const mode = modes[Math.floor(this.seededRandom(seed + 100) * modes.length)];

        const challenge = generator.generate(difficulty, mode);

        return {
            id: `${type}_${seed}`,
            ...challenge,
            tier,
            progress: 0,
            completed: false,
            claimedReward: false,
            displayDescription: challenge.description(challenge.target, challenge.mode)
        };
    }

    /**
     * Get next midnight timestamp
     */
    getNextMidnight() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow;
    }

    /**
     * Get next Monday timestamp
     */
    getNextMonday() {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() + (day === 0 ? 1 : 8 - day);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    /**
     * Update challenge progress based on game stats
     */
    updateProgress(gameStats) {
        this.checkAndGenerateChallenges();

        const { score, time, kills, combo, powerups, damageTaken, gameMode } = gameStats;

        // Update daily challenges
        if (gameData.data.challenges.daily) {
            gameData.data.challenges.daily.challenges.forEach(challenge => {
                if (challenge.completed) return;
                this.updateChallengeProgress(challenge, gameStats);
            });
        }

        // Update weekly challenges
        if (gameData.data.challenges.weekly) {
            gameData.data.challenges.weekly.challenges.forEach(challenge => {
                if (challenge.completed) return;
                this.updateChallengeProgress(challenge, gameStats);
            });
        }

        gameData.save();
    }

    /**
     * Update a single challenge's progress
     */
    updateChallengeProgress(challenge, stats) {
        const { score, time, kills, combo, powerups, damageTaken, gameMode } = stats;

        switch (challenge.type) {
            case 'score_target':
                if (score >= challenge.target) {
                    challenge.progress = challenge.target;
                    challenge.completed = true;
                }
                break;

            case 'cumulative_score':
                challenge.progress = Math.min(challenge.progress + score, challenge.target);
                if (challenge.progress >= challenge.target) {
                    challenge.completed = true;
                }
                break;

            case 'survive_time':
                if (time >= challenge.target) {
                    challenge.progress = challenge.target;
                    challenge.completed = true;
                } else {
                    challenge.progress = Math.max(challenge.progress, time);
                }
                break;

            case 'kill_count':
                if (kills >= challenge.target) {
                    challenge.progress = challenge.target;
                    challenge.completed = true;
                }
                break;

            case 'cumulative_kills':
                challenge.progress = Math.min(challenge.progress + kills, challenge.target);
                if (challenge.progress >= challenge.target) {
                    challenge.completed = true;
                }
                break;

            case 'combo_reach':
                if (combo >= challenge.target) {
                    challenge.progress = challenge.target;
                    challenge.completed = true;
                } else {
                    challenge.progress = Math.max(challenge.progress, combo);
                }
                break;

            case 'collect_powerups':
                challenge.progress = Math.min(challenge.progress + powerups, challenge.target);
                if (challenge.progress >= challenge.target) {
                    challenge.completed = true;
                }
                break;

            case 'play_games':
                challenge.progress = Math.min(challenge.progress + 1, challenge.target);
                if (challenge.progress >= challenge.target) {
                    challenge.completed = true;
                }
                break;

            case 'play_mode':
                if (gameMode === challenge.mode) {
                    challenge.progress = Math.min(challenge.progress + 1, challenge.target);
                    if (challenge.progress >= challenge.target) {
                        challenge.completed = true;
                    }
                }
                break;

            case 'no_damage_game':
                if (damageTaken === 0 && time >= 60) {
                    challenge.progress = 1;
                    challenge.completed = true;
                }
                break;
        }

        if (challenge.completed) {
            logger.info('ChallengeSystem', `Challenge completed: ${challenge.displayDescription}`);
        }
    }

    /**
     * Claim reward for a completed challenge
     */
    claimReward(challengeId, isWeekly = false) {
        const challengeSet = isWeekly
            ? gameData.data.challenges.weekly
            : gameData.data.challenges.daily;

        if (!challengeSet) return null;

        const challenge = challengeSet.challenges.find(c => c.id === challengeId);
        const hasReachedTarget = typeof challenge?.target === 'number'
            ? challenge.progress >= challenge.target
            : challenge?.completed;

        if (!challenge || !challenge.completed || challenge.claimedReward || !hasReachedTarget) {
            return null;
        }

        const rewardTier = isWeekly ? REWARDS.weekly : REWARDS.daily;
        const reward = rewardTier[challenge.tier];

        challenge.claimedReward = true;
        gameData.data.challenges.totalRewards += reward.points;

        // Update streaks
        const streaks = gameData.data.challenges.streaks;
        if (isWeekly) {
            streaks.lastWeeklyComplete = Date.now();
            streaks.weekly++;
        } else {
            streaks.lastDailyComplete = Date.now();
            streaks.daily++;
        }

        // Add to history
        gameData.data.challenges.history.push({
            challengeId,
            isWeekly,
            completedAt: Date.now(),
            reward: reward.points,
            tier: challenge.tier
        });

        // Keep only last 50 history entries
        if (gameData.data.challenges.history.length > 50) {
            gameData.data.challenges.history = gameData.data.challenges.history.slice(-50);
        }

        gameData.save();
        logger.info('ChallengeSystem', `Reward claimed: ${reward.points} points`);

        return reward;
    }

    /**
     * Get current daily challenges
     */
    getDailyChallenges() {
        this.checkAndGenerateChallenges();
        return gameData.data.challenges.daily?.challenges || [];
    }

    /**
     * Get current weekly challenges
     */
    getWeeklyChallenges() {
        this.checkAndGenerateChallenges();
        return gameData.data.challenges.weekly?.challenges || [];
    }

    /**
     * Get time remaining for daily reset
     */
    getDailyTimeRemaining() {
        const now = Date.now();
        const expires = gameData.data.challenges.daily?.expiresAt || this.getNextMidnight().getTime();
        return Math.max(0, expires - now);
    }

    /**
     * Get time remaining for weekly reset
     */
    getWeeklyTimeRemaining() {
        const now = Date.now();
        const expires = gameData.data.challenges.weekly?.expiresAt || this.getNextMonday().getTime();
        return Math.max(0, expires - now);
    }

    /**
     * Format time remaining as string
     */
    formatTimeRemaining(ms) {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

        if (hours >= 24) {
            const days = Math.floor(hours / 24);
            return `${days}d ${hours % 24}h`;
        }
        return `${hours}h ${minutes}m`;
    }

    /**
     * Get streak information
     */
    getStreaks() {
        return gameData.data.challenges.streaks;
    }

    /**
     * Get total rewards earned
     */
    getTotalRewards() {
        return gameData.data.challenges.totalRewards;
    }

    /**
     * Get challenge history
     */
    getHistory(limit = 10) {
        return gameData.data.challenges.history.slice(-limit).reverse();
    }

    /**
     * Get challenge completion stats
     */
    getStats() {
        const history = gameData.data.challenges.history;
        const dailyCompleted = history.filter(h => !h.isWeekly).length;
        const weeklyCompleted = history.filter(h => h.isWeekly).length;

        return {
            dailyCompleted,
            weeklyCompleted,
            totalCompleted: history.length,
            totalRewards: this.getTotalRewards(),
            streaks: this.getStreaks()
        };
    }

    /**
     * Reset all challenges (for testing)
     */
    static resetAll() {
        gameData.data.challenges = {
            daily: null,
            weekly: null,
            history: [],
            streaks: {
                daily: 0,
                weekly: 0,
                lastDailyComplete: null,
                lastWeeklyComplete: null
            },
            totalRewards: 0
        };
        gameData.save();
        logger.info('ChallengeSystem', 'All challenges reset');
    }
}

// Singleton instance
export const challengeSystem = new ChallengeSystem();
