/**
 * The README is a stack of boards. A board is rows of cells; each cell
 * holds one card and becomes one linked image. Cells in a row share a
 * height and the widths of a row sum to BOARD_W, so the sliced images sit
 * edge to edge on GitHub and the circuit drawn across them reconnects.
 */
import icons from './icons.json';
import {
    COMMIT_TYPE, PROJECT_COUNT, featured, more, notable, shortHash, site, socials, timeline,
    type Project,
} from './data';
import type { UserStats } from './types';

export const BOARD_W = 744;

export interface Tile {
    id: string;
    width: number;
    alt: string;
    href?: string;
    /** Card width inside the cell; defaults to the cell minus side padding. */
    cardWidth?: number;
    className: string;
    html: string;
}

export interface Row {
    height: number;
    /** Space above and below the card inside the cell — the wires run here. */
    padTop: number;
    padBottom: number;
    tiles: Tile[];
}

export interface Board {
    id: string;
    rows: Row[];
    /** Whether the trunk continues out of the bottom into the next board. */
    exit: boolean;
}

const SIDE_PAD = 12;

const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const icon = (name: keyof typeof icons, cls = 'icon') => `<span class="${cls}">${icons[name]}</span>`;

const host = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

const stars = (stats: UserStats, p: Project) => stats.repoStars[p.repo.toLowerCase()];

const starBadge = (n: number | undefined) =>
    n === undefined ? '' : `<span class="star">${icon('star')}${n}</span>`;

const chips = (tech: string[]) => `<div class="chips">${tech.map((t) => `<span>${esc(t)}</span>`).join('')}</div>`;

const media = (file: string) => `media/${file}`;

/* ------------------------------------------------------------------ *
 * Cards
 * ------------------------------------------------------------------ */

function label(id: string, command: string, meta?: string): Row {
    return {
        height: 76,
        padTop: 22,
        padBottom: 20,
        tiles: [{
            id: `label-${id}`,
            width: BOARD_W,
            cardWidth: 0,
            alt: meta ? `${command} — ${meta}` : command,
            className: 'label',
            html: `<span class="prompt">❯</span><span class="cmd">${esc(command)}</span>${meta ? `<span class="meta">${esc(meta)}</span>` : ''}`,
        }],
    };
}

function featuredCard(p: Project, i: number, stats: UserStats): Tile {
    return {
        id: `project-${p.id}`,
        width: 248,
        href: p.url,
        alt: `${p.title} — ${p.description}`,
        className: 'project',
        html: `
      <div class="head"><span class="idx">${String(i + 1).padStart(2, '0')}</span><span>${p.date ?? ''}</span></div>
      <div class="shot"><img src="${media(`projects/${p.image}`)}" style="object-position:${p.imagePosition ?? 'center top'}"></div>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.description)}</p>
      ${chips(p.tech)}
      <div class="foot"><span class="host">${esc(host(p.url))}${icon('arrow')}</span>${starBadge(stars(stats, p))}</div>`,
    };
}

function notableCard(p: Project, stats: UserStats): Tile {
    return {
        id: `project-${p.id}`,
        width: 372,
        href: p.url,
        alt: `${p.title} — ${p.description}`,
        className: 'notable',
        html: `
      <div class="thumb"><img src="${media(`projects/${p.image}`)}"></div>
      <div class="body">
        <div class="title-row"><h3>${esc(p.title)}</h3>${starBadge(stars(stats, p))}</div>
        <p>${esc(p.description)}</p>
        ${chips(p.tech)}
      </div>`,
    };
}

function compactCard(p: Project, stats: UserStats): Tile {
    return {
        id: `project-${p.id}`,
        width: 248,
        href: p.url,
        alt: `${p.title} — ${p.description}`,
        className: 'compact',
        html: `
      <div class="title-row"><h3>${esc(p.title)}</h3>${starBadge(stars(stats, p))}</div>
      <p>${esc(p.description)}</p>
      <div class="foot">${p.tech.map(esc).join(' · ')}</div>`,
    };
}

function indexCard(): Tile {
    return {
        id: 'project-index',
        width: 248,
        href: `${site.url}/projects`,
        alt: `All ${PROJECT_COUNT} projects — open the index on ${host(site.url)}`,
        className: 'index',
        html: `
      <div class="cmdline"><span class="prompt">❯</span> ls ~/projects | wc -l</div>
      <div class="big"><span class="n">${PROJECT_COUNT}</span><span class="go">open index ${icon('arrow')}</span></div>`,
    };
}

function heatmapCard(stats: UserStats): Tile {
    const levels = (n: number) => (n === 0 ? 0 : n < 3 ? 1 : n < 7 ? 2 : n < 15 ? 3 : 4);
    const weeks = stats.weeks.slice(-53);
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
        .map((w) => `<div class="wk">${w.map((d) => `<i class="l${levels(d.count)}"></i>`).join('')}</div>`)
        .join('');
    return {
        id: 'tele-heatmap',
        width: 496,
        cardWidth: 476,
        href: `https://github.com/${site.handle}`,
        alt: `${stats.contributions} contributions in the last year`,
        className: 'heatmap',
        html: `
      <div class="head"><span><b>${stats.contributions.toLocaleString('en')}</b> contributions · last 12 months</span><span class="legend">less <i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i> more</span></div>
      <div class="months">${months.join('')}</div>
      <div class="grid">${grid}</div>`,
    };
}

function streakCard(stats: UserStats): Tile {
    const best = new Date(stats.best.date + 'T00:00:00Z').toLocaleDateString('en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' }).toLowerCase();
    return {
        id: 'tele-streak',
        width: 248,
        href: `https://github.com/${site.handle}`,
        alt: `Current streak ${stats.streaks.current} days, longest ${stats.streaks.longest} days`,
        className: 'streak',
        html: `
      <div class="k">current streak</div>
      <div class="big">${icon('flame', 'flame')}<span class="n">${stats.streaks.current}</span><span class="u">days</span></div>
      <div class="rows">
        <div><span>longest</span><b>${stats.streaks.longest} days</b></div>
        <div><span>best day</span><b>${stats.best.count} · ${best}</b></div>
      </div>`,
    };
}

function numbersCard(stats: UserStats): Tile {
    const rows: [string, number][] = [
        ['stars earned', stats.totalStars],
        ['pull requests', stats.totalPRs],
        ['issues', stats.totalIssues],
        ['public repos', stats.publicRepos],
        ['followers', stats.followers],
    ];
    return {
        id: 'tele-numbers',
        width: 248,
        href: `https://github.com/${site.handle}?tab=repositories`,
        alt: rows.map(([k, v]) => `${k}: ${v}`).join(', '),
        className: 'numbers',
        html: `<div class="k">$ gh stats</div>${rows
            .map(([k, v]) => `<div class="kv"><span>${k}</span><i></i><b>${v.toLocaleString('en')}</b></div>`)
            .join('')}`,
    };
}

function languagesCard(stats: UserStats): Tile {
    const langs = stats.topLanguages;
    return {
        id: 'tele-languages',
        width: 248,
        href: `https://github.com/${site.handle}?tab=repositories`,
        alt: 'Top languages: ' + langs.map((l) => `${l.name} ${l.percentage.toFixed(1)}%`).join(', '),
        className: 'languages',
        html: `
      <div class="k">languages · by bytes</div>
      <div class="bar">${langs.map((l) => `<i style="flex:${l.percentage};background:${l.color}"></i>`).join('')}</div>
      ${langs
            .map((l) => `<div class="kv"><span><i class="dot" style="background:${l.color}"></i>${esc(l.name)}</span><b>${l.percentage.toFixed(1)}%</b></div>`)
            .join('')}`,
    };
}

function nowCard(): Tile {
    return {
        id: 'tele-now',
        width: 248,
        href: site.employer.url,
        alt: `Now: Software Engineer at ${site.employer.name}.`,
        className: 'now',
        html: `
      <div class="k">now</div>
      <div class="who"><img class="logo" src="${media('logos/belzabar-color.png')}"><div><b>Software Engineer</b><span>@ ${esc(site.employer.name)}</span></div></div>
      <p>Large-scale backend systems and a multi-agent AI orchestrator.</p>`,
    };
}

/** Logos drawn white on transparency; inverted on the light theme or they vanish. */
const WHITE_MARKS = new Set(['codemate']);

function gitLogCard(): Tile {
    const rows = timeline.map((e, i) => {
        const refs =
            i === 0 ? '<span class="ref head">HEAD → main</span>' :
                e.category === 'award' ? '<span class="ref tag">tag: sih-24</span>' : '';
        const subject = e.company ? `${esc(e.title)} <span class="at">@ ${esc(e.company)}</span>` : esc(e.title);
        return `
      <div class="commit ${e.category === 'project' ? 'lane1' : 'lane0'}">
        <span class="node"></span>
        <span class="hash">${shortHash(e.id)}</span>
        <img class="logo${WHITE_MARKS.has(e.logo) ? ' mono-light' : ''}" src="${media(`logos/${e.logo}-color.png`)}">
        <span class="type">${COMMIT_TYPE[e.category]}:</span>
        <span class="subject">${subject}${refs}<span class="note">${esc(e.note)}</span></span>
        <span class="date">${e.date.toLowerCase()}</span>
      </div>`;
    });
    return {
        id: 'career-log',
        width: BOARD_W,
        href: `${site.url}/timeline`,
        alt: 'Career as a git log: ' + timeline.map((e) => `${e.date} ${e.title}${e.company ? ' @ ' + e.company : ''}`).join('; '),
        className: 'gitlog',
        html: `<svg class="graph"></svg>${rows.join('')}`,
    };
}

function socialCard(s: (typeof socials)[number]): Tile {
    return {
        id: `social-${s.id}`,
        width: 124,
        href: s.url,
        alt: s.label,
        className: 'social',
        html: `${icon(s.icon as keyof typeof icons, 'glyph')}<span>${esc(s.label)}</span>`,
    };
}

function eofCard(): Tile {
    return {
        id: 'eof',
        width: BOARD_W,
        cardWidth: 340,
        alt: 'EOF — thanks for scrolling',
        className: 'eof',
        html: `<img class="mascot" src="${media('mascots/sleeping-soundly.svg')}"><div><b>EOF</b><span>thanks for scrolling · ${esc(host(site.url))}</span></div>`,
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
                { height: 412, padTop: 34, padBottom: 30, tiles: featured.map((p, i) => featuredCard(p, i, stats)) },
                { height: 176, padTop: 34, padBottom: 30, tiles: notable.map((p) => notableCard(p, stats)) },
                { height: 158, padTop: 34, padBottom: 30, tiles: [...more.map((p) => compactCard(p, stats)), indexCard()] },
            ],
        },
        {
            id: 'telemetry',
            exit: true,
            rows: [
                label('telemetry', `gh api users/${site.handle}`, `synced ${syncedAt}`),
                { height: 204, padTop: 34, padBottom: 30, tiles: [heatmapCard(stats), streakCard(stats)] },
                { height: 222, padTop: 34, padBottom: 30, tiles: [numbersCard(stats), languagesCard(stats), nowCard()] },
            ],
        },
        {
            id: 'career',
            exit: true,
            rows: [
                label('career', 'git log --graph career', `${timeline.length} commits since 2022`),
                { height: 344, padTop: 34, padBottom: 30, tiles: [gitLogCard()] },
            ],
        },
        {
            id: 'contact',
            exit: false,
            rows: [
                label('contact', 'ping parth'),
                { height: 142, padTop: 34, padBottom: 30, tiles: socials.map(socialCard) },
                { height: 132, padTop: 34, padBottom: 18, tiles: [eofCard()] },
            ],
        },
    ];
}

export function boardHtml(board: Board): string {
    const rows = board.rows
        .map((row) => {
            const cells = row.tiles
                .map((t) => {
                    const cardW = t.cardWidth ?? t.width - SIDE_PAD * 2;
                    const style = cardW
                        ? `left:${(t.width - cardW) / 2}px;width:${cardW}px;`
                        : 'left:50%;transform:translateX(-50%);';
                    return `<div class="cell" data-tile="${t.id}" style="width:${t.width}px;height:${row.height}px">
            <div class="card ${t.className}" style="${style}top:${row.padTop}px;height:${row.height - row.padTop - row.padBottom}px">
              <div class="inner">${t.html}</div>
            </div>
          </div>`;
                })
                .join('');
            return `<div class="row">${cells}</div>`;
        })
        .join('');
    return `<section class="board" data-board="${board.id}" data-exit="${board.exit}"><svg class="wires"></svg>${rows}</section>`;
}
