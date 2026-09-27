/**
 * The README is a stack of boards. A board is rows of cells; each cell
 * holds one card and becomes one linked image. Cells in a row share a
 * height and the widths of a row sum to the layout's width, so the sliced
 * images sit edge to edge on GitHub and the circuit drawn across them
 * reconnects.
 *
 * Every tile has two faces. The desktop face lays a row out across 744px;
 * the mobile face lays the same row out across 280px with a denser card.
 * Rows are the same in both layouts — the README breaks lines with <br>
 * between rows, which has to hold for every screen — so a phone gets a
 * row of three small cards where the desktop gets three large ones.
 */
import icons from './icons.json';
import {
    COMMIT_TYPE, PROJECT_COUNT, featured, more, notable, shortHash, site, socials, timeline,
    type Project,
} from './data';
import type { UserStats } from './types';

export type Layout = 'desktop' | 'mobile';

export const LAYOUT: Record<Layout, { width: number; sidePad: number; chamfer: number }> = {
    desktop: { width: 744, sidePad: 12, chamfer: 10 },
    // 280 fits GitHub's README column on a 360px phone.
    mobile: { width: 280, sidePad: 4, chamfer: 7 },
};

export interface Face {
    width: number;
    /** Card width inside the cell; defaults to the cell minus side padding. 0 = shrink to fit. */
    cardWidth?: number;
    className: string;
    html: string;
}

export interface Tile {
    id: string;
    alt: string;
    href?: string;
    desktop: Face;
    mobile: Face;
}

export interface Geometry {
    height: number;
    /** Space above and below the card inside the cell — the wires run here. */
    padTop: number;
    padBottom: number;
}

export interface Row {
    desktop: Geometry;
    mobile: Geometry;
    tiles: Tile[];
}

export interface Board {
    id: string;
    rows: Row[];
    /** Whether the trunk continues out of the bottom into the next board. */
    exit: boolean;
}

const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const icon = (name: keyof typeof icons, cls = 'icon') => `<span class="${cls}">${icons[name]}</span>`;

const host = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

const stars = (stats: UserStats, p: Project) => stats.repoStars[p.repo.toLowerCase()];

const starBadge = (n: number | undefined) =>
    n === undefined ? '' : `<span class="star">${icon('star')}${n}</span>`;

const chips = (tech: string[]) => `<div class="chips">${tech.map((t) => `<span>${esc(t)}</span>`).join('')}</div>`;

const media = (file: string) => `media/${file}`;

const shot = (p: Project, cls: string) =>
    `<div class="${cls}"><img src="${media(`projects/${p.image}`)}" style="object-position:${p.imagePosition ?? 'center top'}"></div>`;

/** Row geometry shared by every card row. */
const ROW = { padTop: 34, padBottom: 30 };
const M_ROW = { padTop: 22, padBottom: 16 };

const row = (desktopHeight: number, mobileHeight: number, tiles: Tile[]): Row => ({
    desktop: { height: desktopHeight, ...ROW },
    mobile: { height: mobileHeight, ...M_ROW },
    tiles,
});

/* ------------------------------------------------------------------ *
 * Cards
 * ------------------------------------------------------------------ */

function label(id: string, command: string, meta?: string): Row {
    const prompt = `<span class="prompt">❯</span><span class="cmd">${esc(command)}</span>`;
    return {
        desktop: { height: 76, padTop: 22, padBottom: 20 },
        mobile: { height: 54, padTop: 12, padBottom: 12 },
        tiles: [{
            id: `label-${id}`,
            alt: meta ? `${command} — ${meta}` : command,
            desktop: {
                width: LAYOUT.desktop.width,
                cardWidth: 0,
                className: 'label',
                html: prompt + (meta ? `<span class="meta">${esc(meta)}</span>` : ''),
            },
            mobile: { width: LAYOUT.mobile.width, cardWidth: 0, className: 'label m-label', html: prompt },
        }],
    };
}

function featuredCard(p: Project, i: number, stats: UserStats, mobileWidth: number): Tile {
    return {
        id: `project-${p.id}`,
        href: p.url,
        alt: `${p.title} — ${p.description}`,
        desktop: {
            width: 248,
            className: 'project',
            html: `
      <div class="head"><span class="idx">${String(i + 1).padStart(2, '0')}</span><span>${p.date ?? ''}</span></div>
      ${shot(p, 'shot')}
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.description)}</p>
      ${chips(p.tech)}
      <div class="foot"><span class="host">${esc(host(p.url))}${icon('arrow')}</span>${starBadge(stars(stats, p))}</div>`,
        },
        mobile: {
            width: mobileWidth,
            className: 'm-poster',
            html: `
      ${shot(p, 'm-shot')}
      <div class="m-body"><h3>${esc(p.title)}</h3><div class="m-meta">${esc(p.tech[0] ?? '').toLowerCase()}</div></div>
      <div class="m-foot">${starBadge(stars(stats, p))}<span class="go">${icon('arrow')}</span></div>`,
        },
    };
}

function notableCard(p: Project, stats: UserStats): Tile {
    return {
        id: `project-${p.id}`,
        href: p.url,
        alt: `${p.title} — ${p.description}`,
        desktop: {
            width: 372,
            className: 'notable',
            html: `
      <div class="thumb"><img src="${media(`projects/${p.image}`)}"></div>
      <div class="body">
        <div class="title-row"><h3>${esc(p.title)}</h3>${starBadge(stars(stats, p))}</div>
        <p>${esc(p.description)}</p>
        ${chips(p.tech)}
      </div>`,
        },
        mobile: {
            width: 140,
            className: 'm-poster m-wide',
            html: `
      ${shot(p, 'm-shot')}
      <div class="m-body"><div class="title-row"><h3>${esc(p.title)}</h3>${starBadge(stars(stats, p))}</div><p>${esc(p.description)}</p></div>`,
        },
    };
}

function compactCard(p: Project, stats: UserStats, mobileWidth: number): Tile {
    return {
        id: `project-${p.id}`,
        href: p.url,
        alt: `${p.title} — ${p.description}`,
        desktop: {
            width: 248,
            className: 'compact',
            html: `
      <div class="title-row"><h3>${esc(p.title)}</h3>${starBadge(stars(stats, p))}</div>
      <p>${esc(p.description)}</p>
      <div class="foot">${p.tech.map(esc).join(' · ')}</div>`,
        },
        mobile: {
            width: mobileWidth,
            className: 'm-compact',
            html: `<h3>${esc(p.title)}</h3><div class="m-foot"><span>${esc(p.tech[0] ?? '').toLowerCase()}</span>${starBadge(stars(stats, p))}</div>`,
        },
    };
}

function indexCard(mobileWidth: number): Tile {
    return {
        id: 'project-index',
        href: `${site.url}/projects`,
        alt: `All ${PROJECT_COUNT} projects — open the index on ${host(site.url)}`,
        desktop: {
            width: 248,
            className: 'index',
            html: `
      <div class="cmdline"><span class="prompt">❯</span> ls ~/projects | wc -l</div>
      <div class="big"><span class="n">${PROJECT_COUNT}</span><span class="go">open index ${icon('arrow')}</span></div>`,
        },
        mobile: {
            width: mobileWidth,
            className: 'm-index',
            html: `<div class="cmdline"><span class="prompt">❯</span> wc -l</div><div class="big"><span class="n">${PROJECT_COUNT}</span><span class="go">all ${icon('arrow')}</span></div>`,
        },
    };
}

const level = (n: number) => (n === 0 ? 0 : n < 3 ? 1 : n < 7 ? 2 : n < 15 ? 3 : 4);

function heatmapHtml(weeks: UserStats['weeks']) {
    let lastMonth = -1;
    const months = weeks.map((w) => {
        const m = new Date(w[0]!.date + 'T00:00:00Z').getUTCMonth();
        if (m === lastMonth) return '<span></span>';
        lastMonth = m;
        return `<span>${new Date(Date.UTC(2000, m, 1)).toLocaleString('en', { month: 'short', timeZone: 'UTC' }).toLowerCase()}</span>`;
    });
    // The first column is usually a partial month; its label would collide.
    months[0] = '<span></span>';
    const grid = weeks
        .map((w) => `<div class="wk">${w.map((d) => `<i class="l${level(d.count)}"></i>`).join('')}</div>`)
        .join('');
    return `<div class="months" style="grid-template-columns:repeat(${weeks.length}, var(--pitch))">${months.join('')}</div><div class="grid">${grid}</div>`;
}

/** Weeks of the heatmap that fit the phone card. */
const MOBILE_WEEKS = 20;

function heatmapCard(stats: UserStats): Tile {
    const recent = stats.weeks.slice(-MOBILE_WEEKS);
    const recentCount = recent.flat().reduce((sum, d) => sum + d.count, 0);
    return {
        id: 'tele-heatmap',
        href: `https://github.com/${site.handle}`,
        alt: `${stats.contributions} contributions in the last year`,
        desktop: {
            width: 496,
            cardWidth: 476,
            className: 'heatmap',
            html: `
      <div class="head"><span><b>${stats.contributions.toLocaleString('en')}</b> contributions · last 12 months</span><span class="legend">less <i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i> more</span></div>
      ${heatmapHtml(stats.weeks.slice(-53))}`,
        },
        mobile: {
            width: 187,
            cardWidth: 181,
            className: 'heatmap m-heatmap',
            html: `<div class="head"><span><b>${recentCount.toLocaleString('en')}</b> in ${MOBILE_WEEKS} wks</span><span>${stats.contributions.toLocaleString('en')}/yr</span></div>${heatmapHtml(recent)}`,
        },
    };
}

function streakCard(stats: UserStats): Tile {
    const best = new Date(stats.best.date + 'T00:00:00Z').toLocaleDateString('en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' }).toLowerCase();
    return {
        id: 'tele-streak',
        href: `https://github.com/${site.handle}`,
        alt: `Current streak ${stats.streaks.current} days, longest ${stats.streaks.longest} days`,
        desktop: {
            width: 248,
            className: 'streak',
            html: `
      <div class="k">current streak</div>
      <div class="big">${icon('flame', 'flame')}<span class="n">${stats.streaks.current}</span><span class="u">days</span></div>
      <div class="rows">
        <div><span>longest</span><b>${stats.streaks.longest} days</b></div>
        <div><span>best day</span><b>${stats.best.count} · ${best}</b></div>
      </div>`,
        },
        mobile: {
            width: 93,
            className: 'm-streak',
            html: `<div class="k">streak</div><div class="big">${icon('flame', 'flame')}<span class="n">${stats.streaks.current}</span></div><div class="m-foot"><span>days</span><span>max ${stats.streaks.longest}</span></div>`,
        },
    };
}

function numbersCard(stats: UserStats): Tile {
    const rows: [string, string, number][] = [
        ['stars earned', 'stars', stats.totalStars],
        ['pull requests', 'PRs', stats.totalPRs],
        ['issues', 'issues', stats.totalIssues],
        ['public repos', 'repos', stats.publicRepos],
        ['followers', 'followers', stats.followers],
    ];
    const kv = (k: string, v: number, leader: string) => `<div class="kv"><span>${k}</span>${leader}<b>${v.toLocaleString('en')}</b></div>`;
    return {
        id: 'tele-numbers',
        href: `https://github.com/${site.handle}?tab=repositories`,
        alt: rows.map(([k, , v]) => `${k}: ${v}`).join(', '),
        desktop: {
            width: 248,
            className: 'numbers',
            html: `<div class="k">$ gh stats</div>${rows.map(([k, , v]) => kv(k, v, '<i></i>')).join('')}`,
        },
        mobile: {
            width: 86,
            className: 'm-list',
            html: `<div class="k">gh stats</div>${rows.map(([, k, v]) => kv(k, v, '')).join('')}`,
        },
    };
}

function languagesCard(stats: UserStats): Tile {
    const langs = stats.topLanguages;
    const bar = `<div class="bar">${langs.map((l) => `<i style="flex:${l.percentage};background:${l.color}"></i>`).join('')}</div>`;
    const kv = (l: (typeof langs)[number], digits: number) =>
        `<div class="kv"><span><i class="dot" style="background:${l.color}"></i>${esc(l.name)}</span><b>${l.percentage.toFixed(digits)}%</b></div>`;
    return {
        id: 'tele-languages',
        href: `https://github.com/${site.handle}?tab=repositories`,
        alt: 'Top languages: ' + langs.map((l) => `${l.name} ${l.percentage.toFixed(1)}%`).join(', '),
        desktop: {
            width: 248,
            className: 'languages',
            html: `<div class="k">languages · by bytes</div>${bar}${langs.map((l) => kv(l, 1)).join('')}`,
        },
        mobile: {
            width: 108,
            className: 'languages m-list',
            html: `<div class="k">languages</div>${bar}${langs.slice(0, 4).map((l) => kv(l, 0)).join('')}`,
        },
    };
}

function nowCard(): Tile {
    const logo = `<img class="logo" src="${media('logos/belzabar-color.png')}">`;
    return {
        id: 'tele-now',
        href: site.employer.url,
        alt: `Now: Software Engineer at ${site.employer.name}.`,
        desktop: {
            width: 248,
            className: 'now',
            html: `
      <div class="k">now</div>
      <div class="who">${logo}<div><b>Software Engineer</b><span>@ ${esc(site.employer.name)}</span></div></div>
      <p>Large-scale backend systems and a multi-agent AI orchestrator.</p>`,
        },
        mobile: {
            width: 86,
            className: 'now m-now',
            html: `<div class="k">now</div>${logo}<b>Software Engineer</b><span>@ ${esc(site.employer.name.split(' ')[0]!.toLowerCase())}</span>`,
        },
    };
}

/** Logos drawn white on transparency; inverted on the light theme or they vanish. */
const WHITE_MARKS = new Set(['codemate']);

function gitLogCard(): Tile {
    const logo = (name: string) => `<img class="logo${WHITE_MARKS.has(name) ? ' mono-light' : ''}" src="${media(`logos/${name}-color.png`)}">`;
    const refs = (i: number, category: string) =>
        i === 0 ? '<span class="ref head">HEAD → main</span>' :
            category === 'award' ? '<span class="ref tag">tag: sih-24</span>' : '';
    const lane = (category: string) => (category === 'project' ? 'lane1' : 'lane0');

    const desktop = timeline.map((e, i) => {
        const subject = e.company ? `${esc(e.title)} <span class="at">@ ${esc(e.company)}</span>` : esc(e.title);
        return `
      <div class="commit ${lane(e.category)}">
        <span class="node"></span>
        <span class="hash">${shortHash(e.id)}</span>
        ${logo(e.logo)}
        <span class="type">${COMMIT_TYPE[e.category]}:</span>
        <span class="subject">${subject}${refs(i, e.category)}<span class="note">${esc(e.note)}</span></span>
        <span class="date">${e.date.toLowerCase()}</span>
      </div>`;
    });
    const mobile = timeline.map((e, i) => {
        const subject = e.company ? `${esc(e.title)} <span class="at">@ ${esc(e.company)}</span>` : esc(e.title);
        return `
      <div class="commit ${lane(e.category)}">
        <span class="node"></span>
        <div class="line1"><span class="hash">${shortHash(e.id)}</span>${logo(e.logo)}${refs(i, e.category)}<span class="date">${e.date.toLowerCase()}</span></div>
        <div class="subject">${subject}</div>
      </div>`;
    });
    return {
        id: 'career-log',
        href: `${site.url}/timeline`,
        alt: 'Career as a git log: ' + timeline.map((e) => `${e.date} ${e.title}${e.company ? ' @ ' + e.company : ''}`).join('; '),
        desktop: { width: LAYOUT.desktop.width, className: 'gitlog', html: `<svg class="graph"></svg>${desktop.join('')}` },
        mobile: { width: LAYOUT.mobile.width, cardWidth: 272, className: 'gitlog m-gitlog', html: `<svg class="graph"></svg>${mobile.join('')}` },
    };
}

/** Mobile widths for the six social tiles; they sum to the mobile width. */
const SOCIAL_M = [46, 47, 47, 47, 47, 46];

function socialCard(s: (typeof socials)[number], i: number): Tile {
    const glyph = icon(s.icon as keyof typeof icons, 'glyph');
    return {
        id: `social-${s.id}`,
        href: s.url,
        alt: s.label,
        desktop: { width: 124, className: 'social', html: `${glyph}<span>${esc(s.label)}</span>` },
        mobile: { width: SOCIAL_M[i]!, className: 'social m-social', html: glyph },
    };
}

function eofCard(): Tile {
    const mascot = `<img class="mascot" src="${media('mascots/sleeping-soundly.svg')}">`;
    return {
        id: 'eof',
        alt: 'EOF — thanks for scrolling',
        desktop: {
            width: LAYOUT.desktop.width,
            cardWidth: 340,
            className: 'eof',
            html: `${mascot}<div><b>EOF</b><span>thanks for scrolling · ${esc(host(site.url))}</span></div>`,
        },
        mobile: {
            width: LAYOUT.mobile.width,
            cardWidth: 200,
            className: 'eof m-eof',
            html: `${mascot}<div><b>EOF</b><span>thanks for scrolling</span></div>`,
        },
    };
}

/* ------------------------------------------------------------------ *
 * Boards
 * ------------------------------------------------------------------ */

export function buildBoards(stats: UserStats, syncedAt: string): Board[] {
    return [
        {
            id: 'work',
            exit: true,
            rows: [
                label('work', 'ls ~/projects --featured', `${PROJECT_COUNT} projects · ${stats.totalStars} ★`),
                row(412, 172, featured.map((p, i) => featuredCard(p, i, stats, [93, 94, 93][i]!))),
                row(176, 160, notable.map((p) => notableCard(p, stats))),
                row(158, 98, [...more.map((p, i) => compactCard(p, stats, [93, 94][i]!)), indexCard(93)]),
            ],
        },
        {
            id: 'telemetry',
            exit: true,
            rows: [
                label('telemetry', `gh api users/${site.handle}`, `synced ${syncedAt}`),
                row(204, 140, [heatmapCard(stats), streakCard(stats)]),
                row(222, 146, [numbersCard(stats), languagesCard(stats), nowCard()]),
            ],
        },
        {
            id: 'career',
            exit: true,
            rows: [
                label('career', 'git log --graph career', `${timeline.length} commits since 2022`),
                row(344, 306, [gitLogCard()]),
            ],
        },
        {
            id: 'contact',
            exit: false,
            rows: [
                label('contact', 'ping parth'),
                row(142, 80, socials.map(socialCard)),
                {
                    desktop: { height: 132, padTop: 34, padBottom: 18 },
                    mobile: { height: 96, padTop: 22, padBottom: 12 },
                    tiles: [eofCard()],
                },
            ],
        },
    ];
}

/** Every row must fill its layout exactly, or the tiles will not meet. */
export function checkBoards(boards: Board[]) {
    for (const board of boards)
        for (const r of board.rows)
            for (const layout of ['desktop', 'mobile'] as const) {
                const width = r.tiles.reduce((sum, t) => sum + t[layout].width, 0);
                if (width !== LAYOUT[layout].width)
                    throw new Error(`${board.id} (${layout}): a row is ${width}px wide, not ${LAYOUT[layout].width}px`);
            }
}

export function boardHtml(board: Board, layout: Layout): string {
    const { sidePad } = LAYOUT[layout];
    const rows = board.rows
        .map((r) => {
            const g = r[layout];
            const cells = r.tiles
                .map((t) => {
                    const f = t[layout];
                    const cardW = f.cardWidth ?? f.width - sidePad * 2;
                    const style = cardW
                        ? `left:${(f.width - cardW) / 2}px;width:${cardW}px;`
                        : 'left:50%;transform:translateX(-50%);';
                    return `<div class="cell" data-tile="${t.id}" style="width:${f.width}px;height:${g.height}px">
            <div class="card ${f.className}" style="${style}top:${g.padTop}px;height:${g.height - g.padTop - g.padBottom}px">
              <div class="inner">${f.html}</div>
            </div>
          </div>`;
                })
                .join('');
            return `<div class="row">${cells}</div>`;
        })
        .join('');
    return `<section class="board" data-board="${board.id}" data-exit="${board.exit}"><svg class="wires"></svg>${rows}</section>`;
}
