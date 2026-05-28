import StyleDictionary from '@amzn/style-dictionary';
import fs from 'fs/promises';
import path from 'path';
import { DTCGTokens } from './normalizer.js';

export async function buildDesignSystem(tokens: DTCGTokens, outputDir = './build') {
  await fs.mkdir(outputDir, { recursive: true });

  // Write tokens for Style Dictionary
  await fs.writeFile(path.join(outputDir, 'tokens.json'), JSON.stringify(tokens, null, 2));

  const sd = new StyleDictionary({
    source: [path.join(outputDir, 'tokens.json')],
    platforms: {
      css: {
        transformGroup: 'css',
        buildPath: `${outputDir}/`,
        files: [{ destination: 'variables.css', format: 'css/variables' }],
      },
      tailwind: {
        transformGroup: 'css',
        buildPath: `${outputDir}/`,
        files: [{
          destination: 'tailwind.config.js',
          format: 'javascript/module',
        }],
      },
      ts: {
        transformGroup: 'js',
        buildPath: `${outputDir}/`,
        files: [{ destination: 'theme.ts', format: 'typescript/es6' }],
      },
    },
  });

  await sd.buildAllPlatforms();
  console.log('✅ Rebuilt design system in', outputDir);
}