/**
 * devport's design tokens (app/globals.css), plus a light twin. GitHub
 * picks between the two with <picture> and prefers-color-scheme, so every
 * asset is rendered once per theme.
 */

export type ThemeName = 'dark' | 'light';

export interface Theme {
    surface: string;
    surface2: string;
    sunk: string;
    rule: string;
    ruleCard: string;
    ink: string;
    ink2: string;
    ink3: string;
    ink4: string;
    accent: string;
    accentHi: string;
    hash: string;
    add: string;
    /** The circuit between cards. */
    wire: string;
    /** Drop shadow under every card. */
    shadow: string;
    /** Contribution heatmap, empty → busiest. */
    heat: [string, string, string, string, string];
}

export const themes: Record<ThemeName, Theme> = {
    dark: {
        surface: '#0e0e11',
        surface2: '#141418',
        sunk: '#050506',
        rule: '#2b2b35',
        ruleCard: '#272730',
        ink: '#e9e4d4',
        ink2: '#a8a294',
        ink3: '#7d786d',
        ink4: '#55524b',
        accent: '#818cf8',
        accentHi: '#a5b4fc',
        hash: '#d6b36a',
        add: '#7fcf9b',
        wire: '#3a3a47',
        shadow: 'rgba(0,0,0,0.55)',
        heat: ['#17171d', '#2e2b63', '#4940a8', '#6d6ae8', '#a5b4fc'],
    },
    light: {
        surface: '#fbfaf6',
        surface2: '#f3f1ea',
        sunk: '#eceae2',
        rule: '#d6d2c4',
        ruleCard: '#d9d5c8',
        ink: '#1b1a17',
        ink2: '#55524b',
        ink3: '#716c61',
        ink4: '#a39e92',
        accent: '#4f46e5',
        accentHi: '#6366f1',
        hash: '#9a6b12',
        add: '#1f7a45',
        wire: '#c4bfb0',
        shadow: 'rgba(40,36,24,0.14)',
        heat: ['#ebe8df', '#c7cbf7', '#8f94f0', '#5b56e0', '#3730a3'],
    },
};

/** `ink2` → `--ink-2`; arrays become numbered variables (`--heat-0` …). */
export const cssVars = (t: Theme) =>
    Object.entries(t)
        .flatMap(([k, v]) => {
            const name = `--${k.replace(/[A-Z0-9]/g, (c) => '-' + c.toLowerCase())}`;
            return Array.isArray(v) ? v.map((c, i) => `${name}-${i}: ${c};`) : [`${name}: ${v};`];
        })
        .join('\n');
