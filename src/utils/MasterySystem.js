// Mastery System - Level 1-100 progression per game mode

import { gameData } from './GameData.js';

export default class MasterySystem {
    constructor() {
        this.initializeMastery();
    }

    initializeMastery() {
        if (!gameData.data.mastery) {
            gameData.data.mastery = {
                gitSurvivor: { level: 1, xp: 0 },
                codeDefense: { level: 1, xp: 0 },
                prRush: { level: 1, xp: 0 },
                devCommander: { level: 1, xp: 0 },
                debugDungeon: { level: 1, xp: 0 },
                refactorRace: { level: 1, xp: 0 },
                sprintSurvivor: { level: 1, xp: 0 },
                bugBounty: { level: 1, xp: 0 },
                legacyExcavator: { level: 1, xp: 0 }
            };
            gameData.save();
        }
    }

    // XP required for each level (exponential curve)
    getRequiredXP(level) {
        return Math.floor(100 * Math.pow(1.15, level - 1));
    }

    // Add XP to a mode
    addXP(mode, amount) {
        if (!gameData.data.mastery[mode]) {
            gameData.data.mastery[mode] = { level: 1, xp: 0 };
        }

        const mastery = gameData.data.mastery[mode];
        const levelsGained = [];

        mastery.xp += amount;

        // Check for level ups
        while (mastery.level < 100) {
            const requiredXP = this.getRequiredXP(mastery.level);

            if (mastery.xp >= requiredXP) {
                mastery.xp -= requiredXP;
                mastery.level++;
                levelsGained.push(mastery.level);

                // Unlock rewards
                this.unlockMasteryReward(mode, mastery.level);
            } else {
                break;
            }
        }

        gameData.save();

        return {
            newLevel: mastery.level,
            levelsGained: levelsGained,
            currentXP: mastery.xp,
            requiredXP: this.getRequiredXP(mastery.level)
        };
    }

    // Get mastery rewards for a level
    getMasteryRewards(mode, level) {
        const rewards = {
            // Every 5 levels
            5: { type: 'coins', amount: 500, icon: '💰' },
            10: { type: 'skin', id: 'random', icon: '👨‍💻' },
            15: { type: 'coins', amount: 1000, icon: '💰' },
            20: { type: 'color', id: 'random', icon: '🎨' },
            25: { type: 'powerup', id: 'random', icon: '⚡' },
            30: { type: 'coins', amount: 2000, icon: '💰' },
            35: { type: 'trail', id: 'random', icon: '✨' },
            40: { type: 'skin', id: 'legendary', icon: '👑' },
            45: { type: 'coins', amount: 3000, icon: '💰' },
            50: { type: 'title', id: `${mode}_master`, icon: '🏆', title: `${mode} Master` },

            // Every 10 levels after 50
            60: { type: 'coins', amount: 5000, icon: '💰' },
            70: { type: 'coins', amount: 7500, icon: '💰' },
            80: { type: 'coins', amount: 10000, icon: '💰' },
            90: { type: 'coins', amount: 15000, icon: '💰' },
            100: { type: 'title', id: `${mode}_grandmaster`, icon: '👑', title: `${mode} Grandmaster` }
        };

        return rewards[level] || null;
    }

    // Unlock mastery reward
    unlockMasteryReward(mode, level) {
        const reward = this.getMasteryRewards(mode, level);
        if (!reward) return;

        switch (reward.type) {
            case 'coins':
                gameData.data.stats.totalScore += reward.amount;
                break;

            case 'skin':
                // Unlock random skin or specific one
                if (reward.id === 'random') {
                    const skins = ['ninja', 'wizard', 'robot', 'superhero', 'alien', 'pirate', 'vampire'];
                    const randomSkin = skins[Math.floor(Math.random() * skins.length)];
                    this.unlockCustomization('skin', randomSkin);
                } else {
                    this.unlockCustomization('skin', reward.id);
                }
                break;

            case 'color':
                const colors = ['red', 'purple', 'gold', 'pink', 'cyan', 'orange'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                this.unlockCustomization('color', randomColor);
                break;

            case 'trail':
                const trails = ['sparkle', 'fire', 'rainbow', 'code'];
                const randomTrail = trails[Math.floor(Math.random() * trails.length)];
                this.unlockCustomization('trail', randomTrail);
                break;

            case 'title':
                if (!gameData.data.titles) {
                    gameData.data.titles = [];
                }
                if (!gameData.data.titles.includes(reward.id)) {
                    gameData.data.titles.push(reward.id);
                }
                break;
        }

        gameData.save();
    }

    unlockCustomization(type, id) {
        if (!gameData.data.customization) {
            gameData.data.customization = {
                unlockedSkins: ['default'],
                selectedSkin: 'default',
                unlockedColors: ['blue', 'green'],
                selectedColor: 'blue',
                unlockedTrails: ['none'],
                selectedTrail: 'none'
            };
        }

        const key = `unlocked${type.charAt(0).toUpperCase() + type.slice(1)}s`;
        if (!gameData.data.customization[key].includes(id)) {
            gameData.data.customization[key].push(id);
        }
    }

    // Get mastery info for a mode
    getMasteryInfo(mode) {
        const mastery = gameData.data.mastery[mode] || { level: 1, xp: 0 };
        const requiredXP = this.getRequiredXP(mastery.level);
        const progress = (mastery.xp / requiredXP) * 100;

        return {
            level: mastery.level,
            currentXP: mastery.xp,
            requiredXP: requiredXP,
            progress: progress,
            nextReward: this.getNextReward(mode, mastery.level)
        };
    }

    // Get next reward milestone
    getNextReward(mode, currentLevel) {
        const rewardLevels = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100];
        const nextLevel = rewardLevels.find(level => level > currentLevel);

        if (!nextLevel) return null;

        return {
            level: nextLevel,
            levelsAway: nextLevel - currentLevel,
            reward: this.getMasteryRewards(mode, nextLevel)
        };
    }

    // Get all mastery levels
    getAllMastery() {
        const result = {};

        Object.keys(gameData.data.mastery).forEach(mode => {
            result[mode] = this.getMasteryInfo(mode);
        });

        return result;
    }

    // Get total mastery level across all modes
    getTotalMasteryLevel() {
        let total = 0;

        Object.keys(gameData.data.mastery).forEach(mode => {
            total += gameData.data.mastery[mode].level;
        });

        return total;
    }

    // Get mastery rank title
    getMasteryRank() {
        const total = this.getTotalMasteryLevel();

        if (total >= 900) return { title: 'Legendary Developer', color: '#FFD700' };
        if (total >= 700) return { title: 'Elite Programmer', color: '#FF00FF' };
        if (total >= 500) return { title: 'Senior Engineer', color: '#00FFFF' };
        if (total >= 300) return { title: 'Mid-Level Developer', color: '#00FF00' };
        if (total >= 100) return { title: 'Junior Developer', color: '#FFFF00' };
        return { title: 'Intern', color: '#FFFFFF' };
    }
}

// Singleton
export const masterySystem = new MasterySystem();
