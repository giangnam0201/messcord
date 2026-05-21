#!/usr/bin/env node
/**
 * Cross-platform .env bootstrap.
 *
 * Copies .env.example to .env when .env does not exist. Safe to run
 * repeatedly: existing .env files are never overwritten. Wired into the
 * `postinstall` npm script so a fresh `npm install` works on Windows
 * (where `cp` is unavailable) without manual setup.
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const examplePath = path.join(projectRoot, '.env.example');
const envPath = path.join(projectRoot, '.env');

if (!fs.existsSync(examplePath)) {
  console.warn('[setup-env] .env.example not found, skipping.');
  process.exit(0);
}

if (fs.existsSync(envPath)) {
  console.log('[setup-env] .env already exists, leaving it untouched.');
  process.exit(0);
}

fs.copyFileSync(examplePath, envPath);
console.log('[setup-env] Created .env from .env.example.');
console.log('[setup-env] Edit .env to set a real NEXTAUTH_SECRET before deploying.');
