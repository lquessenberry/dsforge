import { chromium } from 'playwright';
import tinycolor from 'tinycolor2';

export interface RawTokens {
  url: string;
  cssVars: Record<string, string>;
  colors: string[];
  typography: Array<{ family: string; size: string; weight: string; lineHeight: string }>;
  spacing: string[];
  radii: string[];
  shadows: string[];
}

export async function extractFromURL(url: string, darkMode = false): Promise<RawTokens> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  if (darkMode) await page.emulateMedia({ colorScheme: 'dark' });

  await page.goto(url, { waitUntil: 'networkidle' });

  const raw = await page.evaluate(() => {
    const styles = {
      cssVars: {} as Record<string, string>,
      colors: new Set<string>(),
      typography: new Map<string, any>(),
      spacing: new Set<string>(),
      radii: new Set<string>(),
      shadows: new Set<string>(),
    };

    // Root CSS variables (most accurate source of truth)
    const rootStyle = getComputedStyle(document.documentElement);
    for (let i = 0; i < rootStyle.length; i++) {
      const prop = rootStyle[i];
      if (prop.startsWith('--')) {
        styles.cssVars[prop] = rootStyle.getPropertyValue(prop).trim();
      }
    }

    // Scan all elements for computed styles
    document.querySelectorAll('*').forEach((el) => {
      const s = getComputedStyle(el);

      styles.colors.add(s.backgroundColor);
      styles.colors.add(s.color);
      styles.colors.add(s.borderColor);

      // Typography grouping
      const typoKey = `${s.fontFamily}|${s.fontSize}|${s.fontWeight}`;
      if (!styles.typography.has(typoKey)) {
        styles.typography.set(typoKey, {
          family: s.fontFamily,
          size: s.fontSize,
          weight: s.fontWeight,
          lineHeight: s.lineHeight,
        });
      }

      // Spacing (most common values)
      ['padding', 'margin', 'gap'].forEach((prop) => {
        const val = s.getPropertyValue(prop);
        if (val && val !== '0px') styles.spacing.add(val);
      });

      styles.radii.add(s.borderRadius);
      styles.shadows.add(s.boxShadow);
    });

    return {
      cssVars: styles.cssVars,
      colors: Array.from(styles.colors).filter((c) => c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent'),
      typography: Array.from(styles.typography.values()),
      spacing: Array.from(styles.spacing),
      radii: Array.from(styles.radii).filter(Boolean),
      shadows: Array.from(styles.shadows).filter(Boolean),
    };
  });

  await browser.close();
  return { url, ...raw };
}