#!/usr/bin/env node

/**
 * Test runner for GitGame
 * Runs all test files in the tests directory
 */

import { run } from 'node:test';
import { spec as specReporter } from 'node:test/reporters';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function findTestFiles(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...await findTestFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.test.js')) {
            files.push(fullPath);
        }
    }

    return files;
}

let testFiles = [];
try {
    testFiles = await findTestFiles(__dirname);
} catch (e) {
    console.error('Error finding test files:', e.message);
    process.exit(1);
}

if (testFiles.length === 0) {
    console.log('No test files found!');
    process.exit(0);
}

console.log(`\n🧪 Running ${testFiles.length} test file(s)...\n`);

run({ files: testFiles })
    .compose(specReporter())
    .pipe(process.stdout);
