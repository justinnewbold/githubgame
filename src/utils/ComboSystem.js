// Combo and Streak system for scoring multipliers

export default class ComboSystem {
    constructor(scene) {
        this.scene = scene;
        this.combo = 0;
        this.maxCombo = 0;
        this.lastHitTime = 0;
        this.comboTimeout = 3000; // 3 seconds to maintain combo
        this.multiplier = 1;
        this.comboText = null;
        this.comboTimer = null;
    }

    // Add to combo
    addHit() {
        this.combo++;
        this.lastHitTime = Date.now();

        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }

        // Update multiplier based on combo
        this.updateMultiplier();

        // Show combo display
        this.showCombo();

        // Reset timer
        if (this.comboTimer) {
            this.comboTimer.remove();
        }

        this.comboTimer = this.scene.time.delayedCall(this.comboTimeout, () => {
            this.resetCombo();
        });

        return this.multiplier;
    }

    updateMultiplier() {
        // Multiplier increases with combo
        if (this.combo >= 50) {
            this.multiplier = 5;
        } else if (this.combo >= 30) {
            this.multiplier = 4;
        } else if (this.combo >= 20) {
            this.multiplier = 3;
        } else if (this.combo >= 10) {
            this.multiplier = 2;
        } else if (this.combo >= 5) {
            this.multiplier = 1.5;
        } else {
            this.multiplier = 1;
        }
    }

    showCombo() {
        const width = this.scene.cameras.main.width;

        // Remove old combo text
        if (this.comboText) {
            this.comboText.destroy();
        }

        // Combo milestones with special messages
        const milestones = {
            5: { msg: 'Nice!', color: '#ffaa00' },
            10: { msg: 'Great!', color: '#ff6600' },
            20: { msg: 'Awesome!', color: '#ff00ff' },
            30: { msg: 'Incredible!', color: '#00ffff' },
            50: { msg: 'LEGENDARY!', color: '#ffff00' },
            100: { msg: 'GODLIKE!!!', color: '#ff0000' }
        };

        let comboMsg = `${this.combo}x COMBO`;
        let comboColor = '#00ff00';

        if (milestones[this.combo]) {
            comboMsg = `${this.combo}x ${milestones[this.combo].msg}`;
            comboColor = milestones[this.combo].color;

            // Extra visual feedback for milestones
            if (this.scene.particles) {
                this.scene.particles.flash(200, 255, 200, 0);
                this.scene.particles.sparkle(width / 2, 100, parseInt(comboColor.replace('#', '0x')), 30);
            }

            if (this.scene.sounds) {
                this.scene.sounds.playSound('upgrade');
            }
        }

        // Create combo text
        this.comboText = this.scene.add.text(width - 20, 100, comboMsg, {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: comboColor,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.comboText.setOrigin(1, 0.5);

        // Add multiplier text
        if (this.multiplier > 1) {
            const multText = this.scene.add.text(width - 20, 125,
                `x${this.multiplier} SCORE`, {
                fontSize: '14px',
                fontFamily: 'monospace',
                color: '#ffff00',
                stroke: '#000000',
                strokeThickness: 3
            });
            multText.setOrigin(1, 0.5);

            // Cleanup with combo text
            const oldMultText = multText;
            this.scene.time.delayedCall(this.comboTimeout, () => {
                if (oldMultText && oldMultText.active) {
                    oldMultText.destroy();
                }
            });
        }

        // Pulse effect
        this.scene.tweens.add({
            targets: this.comboText,
            scale: 1.2,
            duration: 100,
            yoyo: true
        });
    }

    resetCombo() {
        if (this.combo > 0) {
            // Show combo lost
            if (this.comboText) {
                this.scene.tweens.add({
                    targets: this.comboText,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => {
                        if (this.comboText) {
                            this.comboText.destroy();
                        }
                    }
                });
            }
        }

        this.combo = 0;
        this.multiplier = 1;
    }

    getCombo() {
        return this.combo;
    }

    getMultiplier() {
        return this.multiplier;
    }

    getMaxCombo() {
        return this.maxCombo;
    }

    // Calculate score with multiplier
    calculateScore(baseScore) {
        return Math.floor(baseScore * this.multiplier);
    }
}
