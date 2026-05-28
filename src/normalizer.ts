import tinycolor from 'tinycolor2';
import { RawTokens } from './extractor.js';

export interface DTCGTokens {
  $schema: string;
  tokens: {
    color: Record<string, any>;
    typography: Record<string, any>;
    spacing: Record<string, any>;
    radius: Record<string, any>;
    shadow: Record<string, any>;
    [key: string]: any;
  };
}

export function normalizeToDTCG(raw: RawTokens, darkMode = false): DTCGTokens {
  const tokens: any = {
    color: {},
    typography: {},
    spacing: {},
    radius: {},
    shadow: {},
  };

  // Colors → palette + semantic (using frequency + tinycolor analysis)
  const colorCount: Record<string, number> = {};
  raw.colors.forEach((c) => {
    const key = tinycolor(c).toHexString();
    colorCount[key] = (colorCount[key] || 0) + 1;
  });
  const sortedColors = Object.entries(colorCount).sort((a, b) => b[1] - a[1]);

  sortedColors.forEach(([hex], i) => {
    const name = i === 0 ? 'primary' : i === 1 ? 'secondary' : `neutral-${i}`;
    tokens.color[name] = { $value: hex, $type: 'color' };
  });

  // Typography
  raw.typography.forEach((t, i) => {
    tokens.typography[`body-${i + 1}`] = {
      $value: {
        fontFamily: t.family,
        fontSize: t.size,
        fontWeight: t.weight,
        lineHeight: t.lineHeight,
      },
      $type: 'typography',
    };
  });

  // Spacing (keep as-is with frequency)
  raw.spacing.forEach((val, i) => {
    tokens.spacing[`space-${i + 1}`] = { $value: val, $type: 'dimension' };
  });

  // Radius & Shadow (simple mapping)
  raw.radii.forEach((r, i) => tokens.radius[`radius-${i + 1}`] = { $value: r, $type: 'borderRadius' });
  raw.shadows.forEach((s, i) => tokens.shadow[`shadow-${i + 1}`] = { $value: s, $type: 'boxShadow' });

  // CSS variables (preserve as-is)
  Object.keys(raw.cssVars).forEach((key) => {
    tokens[key.replace('--', '')] = { $value: raw.cssVars[key], $type: 'color' }; // or other types
  });

  return {
    $schema: 'https://github.com/design-tokens/community-group-format',
    tokens,
  };
}