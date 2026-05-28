# dsforge – Pixel-Perfect Design System CLI

Deconstruct any live site → rebuild perfect tokens & code.

## Commands
- `npx tsx src/cli.ts extract https://example.com`
- `npx tsx src/cli.ts full https://stripe.com --dark`
- `npx tsx src/cli.ts build ./tokens.json`

Outputs: CSS variables, Tailwind config, TS theme + raw DTCG tokens.

Built for you to own, fork, and extend (add component detection, visual diff with pixelmatch, multi-page crawling, etc.).