/**
 * The hero: an animated SVG terminal. `whoami` types itself, the name
 * lands, `cat now.txt` answers, and the prompt waits with a blinking
 * cursor. GitHub serves SVG through <img>, where external fonts cannot
 * load — so both faces are subset to the glyphs used and embedded.
 *
 * Everything animates with CSS on opacity and transform, and each typed
 * character is its own <text> at a fixed monospace advance: per-character
 * opacity is the one typing effect every browser renders the same.
 *
 * Two layouts share the script: desktop (744px, mascot in its own panel)
 * and mobile (280px, mascot tucked top-right, output on two lines).
 */
import fs from 'fs';
import path from 'path';
import subsetFont from 'subset-font';
import type { Layout } from './boards';
import { site } from './data';
import { themes, type ThemeName } from './theme';

const FOLIO = path.join(import.meta.dir, '..', 'folio');

/** Commit Mono is 600 units on a 1000 em. */
const ADVANCE = 0.6;

interface Spec {
    w: number;
    h: number;
    card: { x: number; y: number; w: number; h: number; chamfer: number };
    left: number;
    mono: number;
    display: number;
    small: number;
    role: number;
    bar: { square: number; y: number; start: number; step: number; title: number; rule: number };
    y: { whoami: number; name: number; role: number; cat: number; out: number[]; prompt: number };
    mascot: { x: number; y: number; size: number };
    /** The dotted side panel behind the mascot, desktop only. */
    panel?: { x: number; meta: number };
    /** What `cat now.txt` prints, one entry per line. */
    now: string[];
}

const NOW = ["thapar cs '26", "smart india hackathon '24 winner"];

const SPECS: Record<Layout, Spec> = {
    desktop: {
        w: 744, h: 300,
        card: { x: 12, y: 8, w: 720, h: 264, chamfer: 12 },
        left: 38, mono: 13, display: 64, small: 10.5, role: 13,
        bar: { square: 8, y: 19, start: 16, step: 13, title: 27, rule: 38.5 },
        y: { whoami: 76, name: 140, role: 166, cat: 204, out: [228], prompt: 256 },
        mascot: { x: 542, y: 58, size: 180 },
        panel: { x: 532, meta: 240 },
        now: [NOW.join(' · ')],
    },
    mobile: {
        w: 280, h: 236,
        card: { x: 5, y: 5, w: 270, h: 206, chamfer: 8 },
        left: 15, mono: 10, display: 34, small: 8, role: 8.6,
        bar: { square: 6, y: 12, start: 10, step: 9, title: 18.5, rule: 25.5 },
        y: { whoami: 46, name: 83, role: 99, cat: 125, out: [142, 157], prompt: 181 },
        mascot: { x: 204, y: 144, size: 64 },
        now: NOW,
    },
};

export const HERO_SIZE: Record<Layout, { width: number; height: number }> = {
    desktop: { width: SPECS.desktop.w, height: SPECS.desktop.h },
    mobile: { width: SPECS.mobile.w, height: SPECS.mobile.h },
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

interface Line {
    svg: string;
    /** All text in the line, for the font subset. */
    text: string;
}

/** A prompt with a command that types out one character at a time. */
function typed(s: Spec, y: number, at: number, command: string, speed = 0.065): Line & { done: number } {
    const charW = s.mono * ADVANCE;
    const chars = [...command]
        .map((c, i) => c === ' ' ? '' :
            `<text class="mono ink t" x="${(s.left + charW * (2 + i)).toFixed(2)}" y="${y}" style="animation-delay:${(at + 0.12 + i * speed).toFixed(2)}s">${esc(c)}</text>`)
        .join('');
    return {
        done: at + 0.12 + command.length * speed,
        text: '❯' + command,
        svg: `<text class="mono accent t" x="${s.left}" y="${y}" style="animation-delay:${at}s">❯</text>${chars}`,
    };
}

const output = (at: number, body: string, text: string): Line =>
    ({ text, svg: `<g class="rise" style="animation-delay:${at.toFixed(2)}s">${body}</g>` });

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

export async function heroSvg(theme: ThemeName, layout: Layout): Promise<string> {
    const s = SPECS[layout];
    const t = themes[theme];
    const charW = s.mono * ADVANCE;

    const whoami = typed(s, s.y.whoami, 0.35, 'whoami');
    const nameAt = whoami.done + 0.15;
    const cat = typed(s, s.y.cat, nameAt + 0.75, 'cat now.txt', 0.055);
    const outAt = cat.done + 0.15;
    const finalAt = outAt + 0.2 * s.now.length + 0.15;

    const title = `${site.handle}@devport: ~`;
    const role = site.role;
    const meta = 'patiala, in · utc+05:30';

    const lines: Line[] = [
        whoami,
        output(nameAt, `<text class="display" x="${s.left - 2}" y="${s.y.name}">${esc(site.name.toUpperCase())}</text>`, site.name),
        output(nameAt + 0.2, `<text class="mono ink2 role" x="${s.left}" y="${s.y.role}">${esc(role)}</text>`, role),
        cat,
        ...s.now.map((text, i) =>
            output(outAt + i * 0.2, `<text class="mono" x="${s.left}" y="${s.y.out[i]}"><tspan class="accent">→</tspan> <tspan class="ink2">${esc(text)}</tspan></text>`, '→' + text)),
        output(finalAt, `<text class="mono accent" x="${s.left}" y="${s.y.prompt}">❯</text><rect class="cursor" x="${(s.left + charW * 2).toFixed(2)}" y="${s.y.prompt - s.mono * 0.85}" width="${charW.toFixed(2)}" height="${(s.mono * 1.08).toFixed(1)}" style="animation-delay:${finalAt.toFixed(2)}s"/>`, '❯'),
    ];

    const fonts = await embedFonts([title, s.panel ? meta : '', ...lines.map((l) => l.text)].join(''));
    const mascot = fs.readFileSync(path.join(FOLIO, 'media', 'mascots', 'thinking-in-code.svg')).toString('base64');
    const { x, y, w, h, chamfer: c } = s.card;
    const cx = s.w / 2 + 0.5;
    const shape = `${x + 0.5},${y + 0.5} ${x + w - 0.5},${y + 0.5} ${x + w - 0.5},${y + h - c} ${x + w - c},${y + h - 0.5} ${x + 0.5},${y + h - 0.5}`;
    const b = s.bar;
    const squares = [t.ink4, t.ink4, t.accent]
        .map((fill, i) => `<rect x="${x + b.start + i * b.step}" y="${b.y}" width="${b.square}" height="${b.square}" fill="${fill}"/>`)
        .join('');

    const panel = s.panel
        ? `<g clip-path="url(#card)"><rect x="${s.panel.x}" y="${b.rule + 0.5}" width="${x + w - s.panel.x}" height="${y + h - b.rule}" fill="url(#dots)"/>
<path d="M${s.panel.x - 0.5},${b.rule + 0.5} V${y + h - 1}" stroke="${t.rule}" shape-rendering="crispEdges"/></g>
<text class="mono ink3 small" x="${(s.panel.x + x + w) / 2}" y="${s.panel.meta}" text-anchor="middle">${esc(meta)}</text>`
        : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${s.w}" height="${s.h}" viewBox="0 0 ${s.w} ${s.h}" role="img" aria-labelledby="t d">
<title id="t">${esc(site.name)} — ${esc(role)}</title>
<desc id="d">A terminal: whoami prints ${esc(site.name)}; cat now.txt prints: ${esc(NOW.join(' · '))}.</desc>
<style>${fonts}
  .mono { font-family: HeroMono, ui-monospace, monospace; font-size: ${s.mono}px; }
  .role { font-size: ${s.role}px; }
  .display { font-family: HeroDisplay, "Arial Narrow", sans-serif; font-size: ${s.display}px; letter-spacing: 0.01em; fill: ${t.ink}; }
  .ink { fill: ${t.ink}; } .ink2 { fill: ${t.ink2}; } .ink3 { fill: ${t.ink3}; } .accent { fill: ${t.accent}; }
  .small { font-size: ${s.small}px; }
  .t { opacity: 0; animation: show 0.01s linear both; }
  .rise { opacity: 0; animation: rise 0.5s cubic-bezier(0.23, 1, 0.32, 1) both; }
  .cursor { fill: ${t.accent}; animation: blink 1.1s steps(1) infinite; }
  .bob { animation: bob 2.8s ease-in-out infinite; }
  @keyframes show { to { opacity: 1; } }
  @keyframes rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0; } }
  @keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-${(s.mascot.size / 36).toFixed(1)}px); } }
  @media (prefers-reduced-motion: reduce) { .t, .rise, .cursor, .bob { animation: none; opacity: 1; } }
</style>
<defs>
  <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="${layout === 'desktop' ? 6 : 4}" stdDeviation="${layout === 'desktop' ? 5 : 3.5}" flood-color="${t.shadow.startsWith('rgba') ? t.shadow.replace(/,[\d.]+\)$/, ',1)') : t.shadow}" flood-opacity="${t.shadow.match(/,([\d.]+)\)$/)?.[1] ?? 0.5}"/></filter>
  <clipPath id="card"><polygon points="${shape}"/></clipPath>
  <pattern id="dots" width="12" height="12" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="1" height="1" fill="${t.rule}"/></pattern>
</defs>

<path d="M${cx},${y + h} V${s.h}" stroke="${t.wire}" stroke-width="1" shape-rendering="crispEdges"/>
<path d="M${cx},${s.h - 9} V${s.h - 1}" stroke="${t.accent}" stroke-width="1" shape-rendering="crispEdges" class="t" style="animation-delay:${finalAt.toFixed(2)}s"/>
<polygon filter="url(#shadow)" points="${shape}" fill="${t.surface}" stroke="${t.ruleCard}"/>
<rect x="${cx - 8.5}" y="${y + h - 1.5}" width="16" height="3" fill="${t.ink3}"/>

<!-- title bar -->
${squares}
<text class="mono ink3 small" x="${s.w / 2}" y="${b.title}" text-anchor="middle">${esc(title)}</text>
<path d="M${x + 1},${b.rule} H${x + w - 1}" stroke="${t.rule}" shape-rendering="crispEdges"/>

${panel}
<g class="bob"><image x="${s.mascot.x}" y="${s.mascot.y}" width="${s.mascot.size}" height="${s.mascot.size}" href="data:image/svg+xml;base64,${mascot}"/></g>

${lines.map((l) => l.svg).join('\n')}
</svg>`;
}
