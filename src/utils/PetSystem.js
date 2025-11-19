// Pet System - Companion pets with passive bonuses

import { gameData } from './GameData.js';

export default class PetSystem {
    constructor(scene) {
        this.scene = scene;
        this.currentPet = null;
        this.petSprite = null;
        this.initializePets();
    }

    initializePets() {
        if (!gameData.data.pets) {
            gameData.data.pets = {
                unlocked: ['rubber_duck'], // Start with rubber duck
                selected: 'rubber_duck',
                fed: {},
                affection: {}
            };
            gameData.save();
        }
    }

    // All available pets
    getPets() {
        return {
            rubber_duck: {
                id: 'rubber_duck',
                name: 'Rubber Duck',
                emoji: '🦆',
                rarity: 'common',
                description: 'Classic debugging companion',
                bonuses: {
                    xpBonus: 1.05,
                    luckBonus: 1.05
                },
                unlockRequirement: 'Default',
                color: 0xFFFF00
            },
            coffee_cup: {
                id: 'coffee_cup',
                name: 'Coffee Cup',
                emoji: '☕',
                rarity: 'common',
                description: 'Keeps you energized',
                bonuses: {
                    speedBonus: 1.1,
                    energyRegen: 1.1
                },
                unlockRequirement: 'Play 10 games',
                color: 0x8B4513
            },
            code_cat: {
                id: 'code_cat',
                name: 'Code Cat',
                emoji: '🐱',
                rarity: 'uncommon',
                description: 'Purrs when bugs are near',
                bonuses: {
                    damageBonus: 1.15,
                    critChance: 1.1
                },
                unlockRequirement: 'Score 10,000 total',
                color: 0xFF6600
            },
            debug_dog: {
                id: 'debug_dog',
                name: 'Debug Dog',
                emoji: '🐕',
                rarity: 'uncommon',
                description: 'Sniffs out errors',
                bonuses: {
                    healthBonus: 1.15,
                    lootBonus: 1.15
                },
                unlockRequirement: 'Complete 5 achievements',
                color: 0x8B4513
            },
            code_owl: {
                id: 'code_owl',
                name: 'Code Owl',
                emoji: '🦉',
                rarity: 'rare',
                description: 'Wise and watchful',
                bonuses: {
                    xpBonus: 1.2,
                    scoreBonus: 1.15
                },
                unlockRequirement: 'Play at midnight',
                color: 0x8B4513
            },
            cyber_dragon: {
                id: 'cyber_dragon',
                name: 'Cyber Dragon',
                emoji: '🐉',
                rarity: 'rare',
                description: 'Breathes digital fire',
                bonuses: {
                    damageBonus: 1.25,
                    powerUpDuration: 1.2
                },
                unlockRequirement: 'Defeat 500 enemies',
                color: 0xFF0000
            },
            phoenix: {
                id: 'phoenix',
                name: 'Phoenix',
                emoji: '🔥',
                rarity: 'epic',
                description: 'Revive from crashes',
                bonuses: {
                    reviveChance: 0.1,
                    scoreBonus: 1.2
                },
                unlockRequirement: 'Reach mastery level 50',
                color: 0xFF6600
            },
            unicorn: {
                id: 'unicorn',
                name: 'Unicorn',
                emoji: '🦄',
                rarity: 'epic',
                description: 'Magical coding powers',
                bonuses: {
                    luckBonus: 1.5,
                    xpBonus: 1.25,
                    powerUpChance: 1.3
                },
                unlockRequirement: 'Find rainbow easter egg',
                color: 0xFF00FF
            },
            robot_companion: {
                id: 'robot_companion',
                name: 'AI Companion',
                emoji: '🤖',
                rarity: 'legendary',
                description: 'Perfect automated assistant',
                bonuses: {
                    allStats: 1.2,
                    autoCollect: true
                },
                unlockRequirement: 'Prestige level 5',
                color: 0x00FFFF
            },
            golden_goose: {
                id: 'golden_goose',
                name: 'Golden Goose',
                emoji: '🪿',
                rarity: 'legendary',
                description: 'Lays golden code',
                bonuses: {
                    resourceBonus: 2.0,
                    lootBonus: 1.5,
                    scoreBonus: 1.3
                },
                unlockRequirement: 'Total mastery level 500',
                color: 0xFFD700
            }
        };
    }

    // Select a pet
    selectPet(petId) {
        const pets = this.getPets();
        const pet = pets[petId];

        if (!pet) {
            return { success: false, message: 'Invalid pet!' };
        }

        if (!this.isPetUnlocked(petId)) {
            return { success: false, message: 'Pet not unlocked!' };
        }

        gameData.data.pets.selected = petId;
        gameData.save();

        return {
            success: true,
            message: `${pet.name} is now your companion!`,
            pet: pet
        };
    }

    // Check if pet is unlocked
    isPetUnlocked(petId) {
        return gameData.data.pets.unlocked.includes(petId);
    }

    // Unlock a pet
    unlockPet(petId) {
        if (!this.isPetUnlocked(petId)) {
            gameData.data.pets.unlocked.push(petId);
            gameData.data.pets.affection[petId] = 0;
            gameData.save();
            return true;
        }
        return false;
    }

    // Get current selected pet
    getCurrentPet() {
        const petId = gameData.data.pets.selected;
        const pets = this.getPets();
        return pets[petId] || null;
    }

    // Get all active bonuses from current pet
    getActiveBonuses() {
        const pet = this.getCurrentPet();
        if (!pet) return {};

        // Apply affection multiplier
        const affection = this.getPetAffection(pet.id);
        const affectionBonus = 1 + (affection / 1000); // Max 10% bonus at 100 affection

        const bonuses = { ...pet.bonuses };

        // Multiply bonuses by affection
        Object.keys(bonuses).forEach(key => {
            if (typeof bonuses[key] === 'number') {
                bonuses[key] = 1 + ((bonuses[key] - 1) * affectionBonus);
            }
        });

        return bonuses;
    }

    // Feed pet (increases affection)
    feedPet(petId, amount = 1) {
        if (!this.isPetUnlocked(petId)) {
            return { success: false, message: 'Pet not unlocked!' };
        }

        if (!gameData.data.pets.affection[petId]) {
            gameData.data.pets.affection[petId] = 0;
        }

        gameData.data.pets.affection[petId] = Math.min(100, gameData.data.pets.affection[petId] + amount);
        gameData.save();

        return {
            success: true,
            affection: gameData.data.pets.affection[petId]
        };
    }

    // Get pet affection level
    getPetAffection(petId) {
        return gameData.data.pets.affection[petId] || 0;
    }

    // Spawn pet sprite in scene
    spawnPet(x, y) {
        const pet = this.getCurrentPet();
        if (!pet) return;

        // Clean up existing pet
        if (this.petSprite) {
            this.petSprite.destroy();
        }

        // Create pet sprite
        this.petSprite = this.scene.add.text(x, y, pet.emoji, {
            fontSize: '32px'
        }).setOrigin(0.5);
        this.petSprite.setDepth(100);

        // Floating animation
        this.scene.tweens.add({
            targets: this.petSprite,
            y: y - 10,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.currentPet = pet;
    }

    // Update pet position to follow player
    updatePetPosition(playerX, playerY) {
        if (!this.petSprite) return;

        // Follow behind player with smooth movement
        const offsetX = -40;
        const offsetY = -40;
        const targetX = playerX + offsetX;
        const targetY = playerY + offsetY;

        // Lerp movement
        const lerpFactor = 0.05;
        this.petSprite.x += (targetX - this.petSprite.x) * lerpFactor;
        this.petSprite.y += (targetY - this.petSprite.y) * lerpFactor;
    }

    // Pet reactions to game events
    petReaction(eventType) {
        if (!this.petSprite) return;

        switch (eventType) {
            case 'happy':
                // Jump animation
                this.scene.tweens.add({
                    targets: this.petSprite,
                    y: this.petSprite.y - 30,
                    duration: 200,
                    yoyo: true,
                    ease: 'Quad.easeOut'
                });
                break;

            case 'excited':
                // Spin animation
                this.scene.tweens.add({
                    targets: this.petSprite,
                    angle: 360,
                    duration: 500,
                    ease: 'Quad.easeInOut'
                });
                break;

            case 'scared':
                // Shake animation
                this.scene.tweens.add({
                    targets: this.petSprite,
                    x: this.petSprite.x + 5,
                    duration: 50,
                    yoyo: true,
                    repeat: 5
                });
                break;
        }
    }

    // Check and auto-unlock pets based on requirements
    checkUnlocks() {
        const pets = this.getPets();
        const unlocked = [];

        Object.values(pets).forEach(pet => {
            if (this.isPetUnlocked(pet.id)) return;

            let shouldUnlock = false;

            // Check unlock requirements
            if (pet.unlockRequirement === 'Default') {
                shouldUnlock = true;
            } else if (pet.unlockRequirement.includes('Play') && pet.unlockRequirement.includes('games')) {
                const required = parseInt(pet.unlockRequirement.match(/\d+/)[0]);
                if (gameData.data.stats.gamesPlayed >= required) {
                    shouldUnlock = true;
                }
            } else if (pet.unlockRequirement.includes('Score')) {
                const required = parseInt(pet.unlockRequirement.match(/\d+/)[0].replace(',', ''));
                if (gameData.data.stats.totalScore >= required) {
                    shouldUnlock = true;
                }
            } else if (pet.unlockRequirement.includes('achievements')) {
                const required = parseInt(pet.unlockRequirement.match(/\d+/)[0]);
                if (gameData.data.achievements.length >= required) {
                    shouldUnlock = true;
                }
            } else if (pet.unlockRequirement.includes('Defeat') && pet.unlockRequirement.includes('enemies')) {
                const required = parseInt(pet.unlockRequirement.match(/\d+/)[0]);
                const enemiesKilled = gameData.data.stats.gitSurvivor?.enemiesKilled || 0;
                if (enemiesKilled >= required) {
                    shouldUnlock = true;
                }
            }

            if (shouldUnlock) {
                this.unlockPet(pet.id);
                unlocked.push(pet);
            }
        });

        return unlocked;
    }

    // Cleanup
    cleanup() {
        if (this.petSprite) {
            this.petSprite.destroy();
            this.petSprite = null;
        }
        this.currentPet = null;
    }
}
