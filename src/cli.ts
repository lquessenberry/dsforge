#!/usr/bin/env tsx
import { program } from 'commander';
import chalk from 'chalk';
import { extractFromURL } from './extractor.js';
import { normalizeToDTCG } from './normalizer.js';
import { buildDesignSystem } from './builder.js';
import fs from 'fs/promises';
import path from 'path';

program
  .name('dsforge')
  .description('Deconstruct + rebuild design systems pixel-perfect from live websites')
  .version('0.1.0');

program
  .command('extract <url>')
  .description('Extract raw design tokens from a live website')
  .option('--dark', 'Force dark mode')
  .option('--output <path>', 'Output JSON path', './extracted-raw.json')
  .action(async (url, options) => {
    console.log(chalk.blue(`🔍 Extracting from ${url} ${options.dark ? '(dark)' : '(light)'}`));
    const raw = await extractFromURL(url, options.dark);
    await fs.writeFile(options.output, JSON.stringify(raw, null, 2));
    console.log(chalk.green(`✅ Raw tokens saved to ${options.output}`));
  });

program
  .command('build <tokensPath>')
  .description('Rebuild design system from tokens JSON')
  .option('--output <dir>', 'Output directory', './build')
  .action(async (tokensPath, options) => {
    const tokens = JSON.parse(await fs.readFile(tokensPath, 'utf-8'));
    await buildDesignSystem(tokens, options.output);
  });

program
  .command('full <url>')
  .description('Extract → normalize → rebuild in one command')
  .option('--dark', 'Force dark mode')
  .option('--output <dir>', 'Output directory', './dsforge-output')
  .action(async (url, options) => {
    console.log(chalk.cyan.bold(`🚀 Full pipeline: ${url}`));
    const raw = await extractFromURL(url, options.dark);
    const dtcg = normalizeToDTCG(raw, options.dark);

    const tokensPath = path.join(options.output, 'tokens.json');
    await fs.mkdir(options.output, { recursive: true });
    await fs.writeFile(tokensPath, JSON.stringify(dtcg, null, 2));

    await buildDesignSystem(dtcg, options.output);
    console.log(chalk.green.bold(`🎉 Done! Full design system ready in ${options.output}`));
    console.log(chalk.gray('   • variables.css\n   • tailwind.config.js\n   • theme.ts'));
  });

program.parse();