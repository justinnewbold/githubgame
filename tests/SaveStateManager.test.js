import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

const storage = {};
global.localStorage = {
    getItem: (key) => storage[key] || null,
    setItem: (key, value) => {
        storage[key] = value;
    },
    removeItem: (key) => {
        delete storage[key];
    },
    clear: () => {
        Object.keys(storage).forEach((key) => delete storage[key]);
    },
    key: (index) => Object.keys(storage)[index] || null,
    get length() {
        return Object.keys(storage).length;
    }
};

const { saveStateManager } = await import('../src/utils/SaveStateManager.js');

describe('SaveStateManager', () => {
    beforeEach(() => {
        localStorage.clear();
        saveStateManager.stopAutoSave();
    });

    it('captures custom scene state and restores it', () => {
        const scene = {
            scene: { key: 'GitSurvivorScene' },
            score: 250,
            player: {
                x: 320,
                y: 240,
                setPosition(x, y) {
                    this.x = x;
                    this.y = y;
                }
            },
            captureState() {
                return {
                    score: this.score,
                    player: { x: this.player.x, y: this.player.y }
                };
            },
            restoreState(data) {
                this.score = data.score;
                this.player.setPosition(data.player.x, data.player.y);
            }
        };

        const saved = saveStateManager.save('quick-save', saveStateManager.captureState(scene));
        assert.strictEqual(saved, true);

        const loaded = saveStateManager.load('quick-save');
        assert.ok(loaded);
        assert.strictEqual(loaded.sceneName, 'GitSurvivorScene');

        const newScene = {
            score: 0,
            player: {
                x: 0,
                y: 0,
                setPosition(x, y) {
                    this.x = x;
                    this.y = y;
                }
            },
            restoreState: scene.restoreState
        };

        const restored = saveStateManager.restore(newScene, loaded);
        assert.strictEqual(restored, true);
        assert.strictEqual(newScene.score, 250);
        assert.strictEqual(newScene.player.x, 320);
        assert.strictEqual(newScene.player.y, 240);
    });
});
