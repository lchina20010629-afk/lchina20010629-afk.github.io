#!/usr/bin/env node
/**
 * Life Growth Dashboard Encryption CLI
 * Portable tool for managing published encrypted content
 */

import { Command } from 'commander';
import { bootstrap } from './commands/bootstrap.js';
import { encrypt } from './commands/encrypt.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
const version = pkg.version;

const program = new Command();

program
  .name('life-growth')
  .description('Encryption CLI for Life Growth Dashboard')
  .version(version);

// Bootstrap command
program
  .command('bootstrap')
  .description('Initialize vault with password verifier')
  .option('--output <dir>', 'Output directory', 'public/data')
  .option('--stdin-password', 'Read password from stdin')
  .action(bootstrap);

// Encrypt command
program
  .command('encrypt')
  .description('Encrypt entry and update manifest')
  .requiredOption('--type <type>', 'Entry type: diary|course|weekly|monthly|yearly')
  .option('--date <date>', 'Date (YYYY-MM-DD) for diary/course')
  .option('--period <period>', 'Period (YYYY-WXX|YYYY-MM|YYYY) for reviews')
  .requiredOption('--input <file>', 'Input JSON file')
  .option('--output <dir>', 'Output directory', 'public/data')
  .option('--stdin-password', 'Read password from stdin')
  .action(encrypt);

program.parse();
