// Prestige System - Reset progress for permanent bonuses

import { gameData } from './GameData.js';

export default class PrestigeSystem {
    constructor() {
        this.initializePrestige();
    }

    initializePrestige() {
        if (!gameData.data.prestige) {
            gameData.data.prestige = {
                level: 0,
                tokens: 0,
                perks: [],
                totalRuns: 0,
                lifetimeScore: 0
            };
            gameData.save();
        }
    }

    // Get all available prestige perks
    getPerks() {
        return {
            // Score bonuses
            scoreBoost1: {
                id: 'scoreBoost1',
                name: 'Score Boost I',
                description: '+10% score multiplier',
                cost: 1,
                effect: { scoreMultiplier: 1.1 },
                maxLevel: 5,
                icon: '📈'
            },
            scoreBoost2: {
                id: 'scoreBoost2',
                name: 'Score Boost II',
                description: '+25% score multiplier',
                cost: 3,
                effect: { scoreMultiplier: 1.25 },
                maxLevel: 3,
                requires: ['scoreBoost1'],
                icon: '📊'
            },

            // Power-up bonuses
            powerUpDuration: {
                id: 'powerUpDuration',
                name: 'Extended Power-ups',
                description: '+50% power-up duration',
                cost: 2,
                effect: { powerUpDuration: 1.5 },
                maxLevel: 3,
                icon: '⏱️'
            },
            powerUpChance: {
                id: 'powerUpChance',
                name: 'Lucky Find',
                description: '+20% power-up spawn rate',
                cost: 2,
                effect: { powerUpChance: 1.2 },
                maxLevel: 5,
                icon: '🍀'
            },

            // Survival bonuses
            healthBoost: {
                id: 'healthBoost',
                name: 'Vitality',
                description: 'Start with +25% health',
                cost: 2,
                effect: { healthMultiplier: 1.25 },
                maxLevel: 4,
                icon: '❤️'
            },
            damageReduction: {
                id: 'damageReduction',
                name: 'Armor',
                description: 'Take 10% less damage',
                cost: 3,
                effect: { damageReduction: 0.9 },
                maxLevel: 3,
                icon: '🛡️'
            },

            // Attack bonuses
            attackSpeed: {
                id: 'attackSpeed',
                name: 'Quick Hands',
                description: '+15% attack speed',
                cost: 2,
                effect: { attackSpeed: 1.15 },
                maxLevel: 4,
                icon: '⚡'
            },
            attackDamage: {
                id: 'attackDamage',
                name: 'Heavy Hitter',
                description: '+20% damage',
                cost: 3,
                effect: { attackDamage: 1.2 },
                maxLevel: 3,
                icon: '💪'
            },

            // Economic bonuses
            startingResources: {
                id: 'startingResources',
                name: 'Head Start',
                description: 'Start with bonus resources',
                cost: 2,
                effect: { startingResources: 100 },
                maxLevel: 5,
                icon: '💰'
            },
            resourceGain: {
                id: 'resourceGain',
                name: 'Prosperity',
                description: '+15% resource generation',
                cost: 2,
                effect: { resourceGain: 1.15 },
                maxLevel: 5,
                icon: '💎'
            },

            // XP and progression
            xpBoost: {
                id: 'xpBoost',
                name: 'Fast Learner',
                description: '+25% XP gain',
                cost: 2,
                effect: { xpMultiplier: 1.25 },
                maxLevel: 4,
                icon: '📚'
            },
            comboBonus: {
                id: 'comboBonus',
                name: 'Combo Master',
                description: 'Combos build faster',
                cost: 3,
                effect: { comboMultiplier: 1.3 },
                maxLevel: 3,
                icon: '🔥'
            },

            // Special perks
            secondChance: {
                id: 'secondChance',
                name: 'Second Chance',
                description: 'Revive once per game',
                cost: 5,
                effect: { revive: true },
                maxLevel: 1,
                icon: '🔄'
            },
            bossSlayer: {
                id: 'bossSlayer',
                name: 'Boss Slayer',
                description: '+50% damage vs bosses',
                cost: 4,
                effect: { bossDamage: 1.5 },
                maxLevel: 2,
                icon: '👹'
            },
            treasureHunter: {
                id: 'treasureHunter',
                name: 'Treasure Hunter',
                description: 'Better loot from enemies',
                cost: 3,
                effect: { lootQuality: 1.3 },
                maxLevel: 3,
                icon: '🎁'
            },
            speedDemon: {
                id: 'speedDemon',
                name: 'Speed Demon',
                description: '+20% movement speed',
                cost: 2,
                effect: { moveSpeed: 1.2 },
                maxLevel: 3,
                icon: '🏃'
            }
        };
    }

    // Check if player can prestige
    canPrestige() {
        const totalScore = gameData.data.stats.totalScore;
        const currentLevel = gameData.data.prestige.level;

        // Require 10,000 score per prestige level
        const requiredScore = (currentLevel + 1) * 10000;

        return totalScore >= requiredScore;
    }

    // Get number of tokens earned from prestiging
    getPrestigeTokens() {
        const totalScore = gameData.data.stats.totalScore;
        const currentLevel = gameData.data.prestige.level;

        // More tokens for higher scores
        const baseTokens = Math.floor(totalScore / 10000);
        const bonus = currentLevel; // Bonus tokens for each prestige level

        return baseTokens + bonus;
    }

    // Perform prestige
    prestige() {
        if (!this.canPrestige()) {
            return { success: false, message: 'Not enough score to prestige!' };
        }

        const tokensEarned = this.getPrestigeTokens();

        // Save pre-prestige stats
        gameData.data.prestige.lifetimeScore += gameData.data.stats.totalScore;
        gameData.data.prestige.totalRuns++;
        gameData.data.prestige.level++;
        gameData.data.prestige.tokens += tokensEarned;

        // Reset progress but keep achievements and prestige perks
        const savedPrestige = { ...gameData.data.prestige };
        const savedAchievements = [...gameData.data.achievements];
        const savedCustomization = { ...gameData.data.customization };
        const savedEvents = { ...gameData.data.events };
        const savedEasterEggs = { ...gameData.data.easterEggs };

        // Reset stats
        gameData.data.stats = {
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
            legacyExcavator: { highScore: 0, gamesPlayed: 0, maxDepth: 0, artifactsFound: 0 }
        };

        // Restore permanent progress
        gameData.data.prestige = savedPrestige;
        gameData.data.achievements = savedAchievements;
        gameData.data.customization = savedCustomization;
        gameData.data.events = savedEvents;
        gameData.data.easterEggs = savedEasterEggs;

        gameData.save();

        return {
            success: true,
            message: `Prestige Level ${savedPrestige.level}!`,
            tokensEarned: tokensEarned,
            totalTokens: savedPrestige.tokens
        };
    }

    // Purchase a perk
    purchasePerk(perkId) {
        const perks = this.getPerks();
        const perk = perks[perkId];

        if (!perk) {
            return { success: false, message: 'Invalid perk!' };
        }

        // Check if player has perk already
        const currentLevel = this.getPerkLevel(perkId);

        if (currentLevel >= (perk.maxLevel || 1)) {
            return { success: false, message: 'Perk already at max level!' };
        }

        // Check requirements
        if (perk.requires) {
            for (const requiredPerk of perk.requires) {
                if (!this.hasPerk(requiredPerk)) {
                    return { success: false, message: `Requires ${perks[requiredPerk].name} first!` };
                }
            }
        }

        // Check cost
        if (gameData.data.prestige.tokens < perk.cost) {
            return { success: false, message: 'Not enough prestige tokens!' };
        }

        // Purchase perk
        gameData.data.prestige.tokens -= perk.cost;

        const existingPerk = gameData.data.prestige.perks.find(p => p.id === perkId);
        if (existingPerk) {
            existingPerk.level++;
        } else {
            gameData.data.prestige.perks.push({ id: perkId, level: 1 });
        }

        gameData.save();

        return {
            success: true,
            message: `Purchased ${perk.name}!`,
            remainingTokens: gameData.data.prestige.tokens
        };
    }

    // Check if player has perk
    hasPerk(perkId) {
        return gameData.data.prestige.perks.some(p => p.id === perkId);
    }

    // Get perk level
    getPerkLevel(perkId) {
        const perk = gameData.data.prestige.perks.find(p => p.id === perkId);
        return perk ? perk.level : 0;
    }

    // Get all active bonuses
    getActiveBonuses() {
        const bonuses = {
            scoreMultiplier: 1,
            powerUpDuration: 1,
            powerUpChance: 1,
            healthMultiplier: 1,
            damageReduction: 1,
            attackSpeed: 1,
            attackDamage: 1,
            startingResources: 0,
            resourceGain: 1,
            xpMultiplier: 1,
            comboMultiplier: 1,
            bossDamage: 1,
            lootQuality: 1,
            moveSpeed: 1,
            revive: false
        };

        const perks = this.getPerks();

        gameData.data.prestige.perks.forEach(playerPerk => {
            const perk = perks[playerPerk.id];
            if (!perk) return;

            // Apply effects, scaling with level
            Object.keys(perk.effect).forEach(key => {
                if (typeof bonuses[key] === 'number') {
                    if (key === 'startingResources') {
                        bonuses[key] += perk.effect[key] * playerPerk.level;
                    } else {
                        // Multiplicative stacking
                        bonuses[key] *= Math.pow(perk.effect[key], playerPerk.level);
                    }
                } else if (typeof bonuses[key] === 'boolean') {
                    bonuses[key] = perk.effect[key];
                }
            });
        });

        return bonuses;
    }

    // Get prestige info
    getPrestigeInfo() {
        return {
            level: gameData.data.prestige.level,
            tokens: gameData.data.prestige.tokens,
            totalRuns: gameData.data.prestige.totalRuns,
            lifetimeScore: gameData.data.prestige.lifetimeScore,
            canPrestige: this.canPrestige(),
            nextPrestigeTokens: this.getPrestigeTokens(),
            activeBonuses: this.getActiveBonuses(),
            perks: gameData.data.prestige.perks
        };
    }
}

// Singleton
export const prestigeSystem = new PrestigeSystem();
