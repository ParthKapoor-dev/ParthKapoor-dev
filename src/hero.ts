/**
 * The hero: an animated SVG terminal. `whoami` types itself, the name
 * lands, `cat now.txt` answers, and the prompt waits with a blinking
 * cursor. GitHub serves SVG through <img>, where external fonts cannot
 * load — so both faces are subset to the glyphs used and embedded.
 *
 * Everything animates with CSS on opacity and transform, and each typed
 * character is its own <text> at a fixed monospace advance: per-character
 * opacity is the one typing effect every browser renders the same.
 */
import fs from 'fs';
import path from 'path';
import subsetFont from 'subset-font';
import { site } from './data';
import { themes, type ThemeName } from './theme';

const FOLIO = path.join(import.meta.dir, '..', 'folio');

export const HERO_W = 744;
export const HERO_H = 300;

/** Commit Mono is 600 units on a 1000 em. */
const ADVANCE = 0.6;
const MONO = 13;
const CHAR_W = MONO * ADVANCE;

const CARD = { x: 12, y: 8, w: 720, h: 264, chamfer: 12 };
const LEFT = 38;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

interface Line {
    y: number;
    /** Seconds after load. */
    at: number;
    svg: string;
    /** All text in the line, for the font subset. */
    text: string;
}

/** A prompt with a command that types out one character at a time. */
function typed(y: number, at: number, command: string, speed = 0.065): Line & { done: number } {
    const chars = [...command]
        .map((c, i) => c === ' ' ? '' :
            `<text class="mono ink t" x="${(LEFT + CHAR_W * (2 + i)).toFixed(2)}" y="${y}" style="animation-delay:${(at + 0.12 + i * speed).toFixed(2)}s">${esc(c)}</text>`)
        .join('');
    return {
        y, at,
        done: at + 0.12 + command.length * speed,
        text: '❯' + command,
        svg: `<text class="mono accent t" x="${LEFT}" y="${y}" style="animation-delay:${at}s">❯</text>${chars}`,
    };
}

function output(y: number, at: number, body: string, text: string): Line {
    return { y, at, text, svg: `<g class="rise" style="animation-delay:${at}s">${body.replace('{y}', String(y))}</g>` };
}

async function embedFonts(text: string) {
    const glyphs = [...new Set(text + 'PARTHKOparthko0123456789 ')].join('');
    const mono = await subsetFont(fs.readFileSync(path.join(FOLIO, 'fonts', 'CommitMono-VF.woff2')), glyphs, {
        targetFormat: 'woff2',
        variationAxes: { wght: 420, ital: 0 },
    });
    const display = await subsetFont(fs.readFileSync(path.join(FOLIO, 'fonts', 'BarlowSemiCondensed-SemiBold.ttf')), glyphs.toUpperCase(), {
        targetFormat: 'woff2',
    });
    return `
    @font-face { font-family: "HeroMono"; src: url(data:font/woff2;base64,${Buffer.from(mono).toString('base64')}) format("woff2"); }
    @font-face { font-family: "HeroDisplay"; src: url(data:font/woff2;base64,${Buffer.from(display).toString('base64')}) format("woff2"); }`;
}

export async function heroSvg(theme: ThemeName): Promise<string> {
    const t = themes[theme];
    const whoami = typed(76, 0.35, 'whoami');
    const nameAt = whoami.done + 0.15;
    const cat = typed(204, nameAt + 0.75, 'cat now.txt', 0.055);
    const outAt = cat.done + 0.15;
    const finalAt = outAt + 0.35;

    const title = `${site.handle}@devport: ~`;
    const role = site.role;
    const now = `thapar cs '26 · smart india hackathon '24 winner`;
    const meta = 'patiala, in · utc+05:30';

    const lines: Line[] = [
        whoami,
        output(0, nameAt, `<text class="display" x="${LEFT - 2}" y="140">${esc(site.name.toUpperCase())}</text>`, site.name),
        output(0, nameAt + 0.2, `<text class="mono ink2" x="${LEFT}" y="166">${esc(role)}</text>`, role),
        cat,
        output(0, outAt, `<text class="mono" x="${LEFT}" y="228"><tspan class="accent">→</tspan> <tspan class="ink2">${esc(now)}</tspan></text>`, '→' + now),
        output(0, finalAt, `<text class="mono accent" x="${LEFT}" y="256">❯</text><rect class="cursor" x="${LEFT + CHAR_W * 2}" y="245" width="${CHAR_W.toFixed(2)}" height="14" style="animation-delay:${finalAt}s"/>`, '❯'),
    ];

    const fonts = await embedFonts([title, meta, ...lines.map((l) => l.text)].join(''));
    const mascot = fs.readFileSync(path.join(FOLIO, 'media', 'mascots', 'thinking-in-code.svg')).toString('base64');
    const { x, y, w, h, chamfer: c } = CARD;
    const cx = HERO_W / 2 + 0.5;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${HERO_W}" height="${HERO_H}" viewBox="0 0 ${HERO_W} ${HERO_H}" role="img" aria-labelledby="t d">
<title id="t">${esc(site.name)} — ${esc(role)}</title>
<desc id="d">A terminal: whoami prints ${esc(site.name)}; cat now.txt prints: ${esc(now)}.</desc>
<style>${fonts}
  .mono { font-family: HeroMono, ui-monospace, monospace; font-size: ${MONO}px; }
  .display { font-family: HeroDisplay, "Arial Narrow", sans-serif; font-size: 64px; letter-spacing: 0.01em; fill: ${t.ink}; }
  .ink { fill: ${t.ink}; } .ink2 { fill: ${t.ink2}; } .ink3 { fill: ${t.ink3}; } .accent { fill: ${t.accent}; }
  .small { font-size: 10.5px; }
  .t { opacity: 0; animation: show 0.01s linear both; }
  .rise { opacity: 0; animation: rise 0.5s cubic-bezier(0.23, 1, 0.32, 1) both; }
  .cursor { fill: ${t.accent}; animation: blink 1.1s steps(1) infinite; }
  .bob { animation: bob 2.8s ease-in-out infinite; }
  @keyframes show { to { opacity: 1; } }
  @keyframes rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0; } }
  @keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
  @media (prefers-reduced-motion: reduce) { .t, .rise, .cursor, .bob { animation: none; opacity: 1; } }
</style>
<defs>
  <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="${t.shadow.startsWith('rgba') ? t.shadow.replace(/,[\d.]+\)$/, ',1)') : t.shadow}" flood-opacity="${t.shadow.match(/,([\d.]+)\)$/)?.[1] ?? 0.5}"/></filter>
  <clipPath id="card"><polygon points="${x + 0.5},${y + 0.5} ${x + w - 0.5},${y + 0.5} ${x + w - 0.5},${y + h - c} ${x + w - c},${y + h - 0.5} ${x + 0.5},${y + h - 0.5}"/></clipPath>
  <pattern id="dots" width="12" height="12" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="1" height="1" fill="${t.rule}"/></pattern>
</defs>

<path d="M${cx},${y + h} V${HERO_H}" stroke="${t.wire}" stroke-width="1" shape-rendering="crispEdges"/>
<path d="M${cx},${HERO_H - 9} V${HERO_H - 1}" stroke="${t.accent}" stroke-width="1" shape-rendering="crispEdges" class="t" style="animation-delay:${finalAt}s"/>
<polygon filter="url(#shadow)" points="${x + 0.5},${y + 0.5} ${x + w - 0.5},${y + 0.5} ${x + w - 0.5},${y + h - c} ${x + w - c},${y + h - 0.5} ${x + 0.5},${y + h - 0.5}" fill="${t.surface}" stroke="${t.ruleCard}"/>
<rect x="${cx - 8.5}" y="${y + h - 1.5}" width="16" height="3" fill="${t.ink3}"/>

<!-- title bar -->
<rect x="${x + 16}" y="19" width="8" height="8" fill="${t.ink4}"/><rect x="${x + 29}" y="19" width="8" height="8" fill="${t.ink4}"/><rect x="${x + 42}" y="19" width="8" height="8" fill="${t.accent}"/>
<text class="mono ink3 small" x="${HERO_W / 2}" y="27" text-anchor="middle">${esc(title)}</text>
<path d="M${x + 1},38.5 H${x + w - 1}" stroke="${t.rule}" shape-rendering="crispEdges"/>

<!-- mascot panel -->
<g clip-path="url(#card)"><rect x="532" y="39" width="199" height="${y + h - 40}" fill="url(#dots)"/>
<path d="M531.5,39 V${y + h - 1}" stroke="${t.rule}" shape-rendering="crispEdges"/></g>
<g class="bob"><image x="542" y="58" width="180" height="180" href="data:image/svg+xml;base64,${mascot}"/></g>
<text class="mono ink3 small" x="632" y="240" text-anchor="middle">${esc(meta)}</text>

${lines.map((l) => l.svg).join('\n')}
</svg>`;
}
