/**
 * The HTML document Puppeteer renders: fonts, the card stylesheet, and a
 * layout pass that runs in the page after fonts and images settle. The
 * layout pass is what needs real geometry — card outlines, the circuit
 * between cards, the git graph — so it lives here rather than in Node.
 */
import path from 'path';
import { LAYOUT, type Layout } from './boards';
import { cssVars, themes, type ThemeName } from './theme';

const FOLIO = path.join(import.meta.dir, '..', 'folio');
const font = (file: string) => `url("file://${path.join(FOLIO, 'fonts', file)}")`;

const css = (theme: ThemeName, layout: Layout) => `
@font-face { font-family: "Commit Mono"; src: ${font('CommitMono-VF.woff2')} format("woff2"); font-weight: 200 700; }
@font-face { font-family: "Geist"; src: ${font('Geist-Regular.woff2')} format("woff2"); font-weight: 400; }
@font-face { font-family: "Geist"; src: ${font('Geist-Medium.woff2')} format("woff2"); font-weight: 500; }
@font-face { font-family: "Barlow Semi Condensed"; src: ${font('BarlowSemiCondensed-SemiBold.ttf')} format("truetype"); font-weight: 600; }

:root { ${cssVars(themes[theme])} }
* { box-sizing: border-box; }
html, body { margin: 0; background: transparent; }
body { width: ${LAYOUT[layout].width}px; font-family: "Geist", sans-serif; color: var(--ink); -webkit-font-smoothing: antialiased; }
.mono, .rows, .label, .head, .foot, .chips, .k, .kv, .gitlog, .social span, .eof span, .cmdline, .go, .star, .months, .legend {
  font-family: "Commit Mono", monospace; font-feature-settings: "ss01";
}
h3, .big .n, .eof b, .who b {
  font-family: "Barlow Semi Condensed", sans-serif; font-weight: 600; text-transform: uppercase; letter-spacing: 0.01em;
}
.board { position: relative; }
.row { display: flex; }
.cell { position: relative; flex: none; }
.wires { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; z-index: 0; shape-rendering: crispEdges; }
.wires .wire { fill: none; stroke: var(--wire); stroke-width: 1; }
.wires .signal { fill: none; stroke: var(--accent); stroke-width: 1; }
.wires .port { fill: var(--ink-3); }
.wires .joint { fill: var(--wire); }

.card { position: absolute; z-index: 1; }
.card .shape { position: absolute; inset: 0; overflow: visible; filter: drop-shadow(0 6px 9px var(--shadow)); }
.card .shape polygon { fill: var(--surface); stroke: var(--rule-card); stroke-width: 1; }
.inner { position: relative; height: 100%; padding: 14px; }
.icon svg { width: 1em; height: 1em; vertical-align: -0.14em; }
p { margin: 0; }
h3 { margin: 0; line-height: 0.95; }

/* label ------------------------------------------------------------- */
.label { height: 34px; }
.label .inner { display: flex; align-items: center; gap: 9px; padding: 0 16px; font-size: 12px; white-space: nowrap; }
.label .prompt { color: var(--accent); }
.label .cmd { color: var(--ink); }
.label .meta { color: var(--ink-3); border-left: 1px solid var(--rule); padding-left: 10px; margin-left: 3px; font-size: 11px; }

/* project ------------------------------------------------------------ */
.project .head { display: flex; justify-content: space-between; font-size: 10px; color: var(--ink-3); letter-spacing: 0.04em; }
.project .idx { color: var(--accent); }
.project .shot { margin: 11px -13px 13px; height: 128px; border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule); overflow: hidden; background: var(--sunk); }
.project .shot img { width: 100%; height: 100%; object-fit: cover; display: block; }
.project h3 { font-size: 26px; margin-bottom: 7px; }
.project p { font-size: 12px; line-height: 1.5; color: var(--ink-2); margin-bottom: 11px; }
.chips { display: flex; flex-wrap: wrap; gap: 4px; }
.chips span { font-size: 9.5px; color: var(--ink-2); border: 1px solid var(--rule); padding: 2px 6px 3px; border-radius: 2px; }
.foot { position: absolute; left: 14px; right: 14px; bottom: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: var(--ink-3); }
.host { display: inline-flex; align-items: center; gap: 3px; }
.host .icon { color: var(--accent); }
.star { display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px; color: var(--ink-2); }
.star .icon { color: var(--hash); }

/* notable ------------------------------------------------------------ */
.notable .inner { display: flex; gap: 14px; padding: 12px; }
.notable .thumb { flex: none; width: 128px; height: 100%; border: 1px solid var(--rule); overflow: hidden; background: var(--sunk); }
.notable .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.notable .body { flex: 1; min-width: 0; padding-top: 3px; }
.title-row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.notable h3 { font-size: 22px; margin-bottom: 7px; }
.notable p { font-size: 11.5px; line-height: 1.5; color: var(--ink-2); margin-bottom: 9px; }

/* compact ------------------------------------------------------------ */
.compact h3 { font-size: 21px; margin-bottom: 6px; }
.compact p { font-size: 11.5px; line-height: 1.45; color: var(--ink-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.compact .foot { font-size: 9.5px; }

/* index -------------------------------------------------------------- */
.index .cmdline { font-size: 10.5px; color: var(--ink-3); }
.index .cmdline .prompt { color: var(--accent); }
.index .big { position: absolute; left: 14px; right: 14px; bottom: 8px; display: flex; justify-content: space-between; align-items: baseline; }
.index .big .n { font-size: 54px; line-height: 1; color: var(--ink); }
.index .go { font-size: 10.5px; color: var(--accent); }

/* heatmap ------------------------------------------------------------ */
.heatmap .inner { padding: 13px 12px; }
.heatmap .head { display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; color: var(--ink-3); margin-bottom: 12px; }
.heatmap .head b { color: var(--ink); font-weight: 600; }
.legend { display: inline-flex; align-items: center; gap: 3px; font-size: 9.5px; }
.legend i { width: 7px; height: 7px; display: inline-block; }
.heatmap { --pitch: 8.5px; }
.months { display: grid; font-size: 8.5px; color: var(--ink-3); height: 13px; }
.months span { white-space: nowrap; }
.grid { display: flex; gap: 1.5px; }
.wk { display: flex; flex-direction: column; gap: 1.5px; }
.wk:first-child { justify-content: flex-end; }
.grid i { display: block; width: 7px; height: 7px; border-radius: 1px; }
.l0 { background: var(--heat-0); } .l1 { background: var(--heat-1); } .l2 { background: var(--heat-2); }
.l3 { background: var(--heat-3); } .l4 { background: var(--heat-4); }

/* streak / numbers / languages / now --------------------------------- */
.k { font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.09em; color: var(--ink-3); }
.streak .big { display: flex; align-items: baseline; gap: 8px; margin: 6px 0 10px; }
.streak .flame svg { width: 24px; height: 24px; color: var(--hash); transform: translateY(2px); }
.streak .big .n { font-size: 58px; line-height: 0.9; }
.streak .big .u { font-family: "Commit Mono", monospace; font-size: 11px; color: var(--ink-3); }
.streak .rows > div, .kv { display: flex; justify-content: space-between; align-items: baseline; font-size: 10.5px; color: var(--ink-2); line-height: 1.95; }
.streak .rows b, .kv b { color: var(--ink); font-weight: 600; }
.numbers .k { margin-bottom: 6px; }
.numbers .kv { line-height: 2.05; }
.numbers .kv i { flex: 1; border-bottom: 1px dotted var(--rule); margin: 0 8px; transform: translateY(-3px); }
.languages .bar { display: flex; gap: 2px; height: 6px; margin: 11px 0 9px; }
.languages .bar i { display: block; min-width: 3px; }
.languages .kv { line-height: 1.85; }
.dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 7px; }
.now .who { display: flex; align-items: center; gap: 10px; margin: 11px 0 10px; }
.now .logo { width: 34px; height: 34px; padding: 5px; object-fit: contain; border: 1px solid var(--rule); background: #fff; border-radius: 2px; }
.now .who b { display: block; font-size: 18px; line-height: 1; }
.now .who span { font-family: "Commit Mono", monospace; font-size: 10px; color: var(--ink-3); }
.now p { font-size: 11.5px; line-height: 1.5; color: var(--ink-2); }

/* gitlog ------------------------------------------------------------- */
.gitlog .inner { padding: 12px 18px 12px 0; }
.gitlog .graph { position: absolute; left: 0; top: 0; width: 48px; height: 100%; overflow: visible; }
.gitlog .graph path { fill: none; stroke: var(--rule); stroke-width: 1.5; }
.gitlog .graph .main { stroke: var(--accent); stroke-opacity: 0.55; }
.commit { position: relative; display: grid; grid-template-columns: 48px 62px 22px auto 1fr auto; align-items: start; height: 40px; font-size: 11px; }
.commit .node { width: 9px; height: 9px; border-radius: 50%; border: 1.5px solid var(--accent); background: var(--surface); margin-top: 3px; position: relative; z-index: 1; }
.commit.lane0 .node { margin-left: 15px; }
.commit.lane1 .node { margin-left: 30px; border-color: var(--ink-3); }
.commit:first-of-type .node { background: var(--accent); }
.commit .hash { color: var(--hash); }
.commit .logo { width: 14px; height: 14px; object-fit: contain; margin-top: 1px; }
.light-theme .commit .logo.mono-light { filter: invert(1); }
.commit .type { color: var(--ink-3); margin-right: 7px; }
.commit .subject { color: var(--ink); white-space: nowrap; overflow: hidden; }
.commit .at { color: var(--ink-2); }
.commit .note { display: block; font-size: 10px; color: var(--ink-3); margin-top: 3px; }
.ref { font-size: 9px; border: 1px solid currentColor; padding: 0 5px 1px; border-radius: 2px; margin-left: 8px; vertical-align: 1px; }
.ref.head { color: var(--accent); }
.ref.tag { color: var(--hash); }
.commit .date { color: var(--ink-3); font-size: 10.5px; padding-left: 12px; }

/* social / eof ------------------------------------------------------- */
.social .inner { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 9px; padding: 10px 4px; }
.social .glyph svg { width: 20px; height: 20px; color: var(--ink); display: block; }
.social span { font-size: 10px; color: var(--ink-2); }
.eof .inner { display: flex; align-items: center; gap: 14px; padding: 8px 16px; }
.eof .mascot { width: 84px; height: 84px; margin: -12px -6px -12px -10px; }
.eof span { white-space: nowrap; }

/* ==================================================================
   Mobile faces — the same rows at 280px, denser cards.
   ================================================================== */
.m-label .inner { font-size: 10.5px; padding: 0 12px; gap: 7px; }
.m-shot { height: 52px; margin: 1px 1px 0; border-bottom: 1px solid var(--rule); overflow: hidden; background: var(--sunk); }
.m-shot img { width: 100%; height: 100%; object-fit: cover; display: block; }
.m-poster .inner, .m-wide .inner { padding: 0; }
.m-body { padding: 8px 7px 0; }
.m-poster h3, .m-compact h3 { font-size: 14.5px; }
.m-meta { font-family: "Commit Mono", monospace; font-size: 8px; color: var(--ink-3); margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.m-foot { position: absolute; left: 7px; right: 7px; bottom: 7px; display: flex; justify-content: space-between; align-items: center; font-family: "Commit Mono", monospace; font-size: 8.5px; color: var(--ink-3); }
.m-foot .star, .m-wide .star { font-size: 8.5px; gap: 3px; }
.m-foot .go { color: var(--accent); }
.m-wide .m-shot { height: 50px; }
.m-wide .title-row h3 { font-size: 14.5px; }
.m-wide p { font-size: 9px; line-height: 1.4; color: var(--ink-2); margin-top: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.m-compact .inner, .m-index .inner { padding: 8px 7px; }
.m-index .cmdline { font-size: 8px; color: var(--ink-3); }
.m-index .cmdline .prompt { color: var(--accent); }
.m-index .big { position: absolute; left: 7px; right: 7px; bottom: 5px; display: flex; justify-content: space-between; align-items: baseline; }
.m-index .big .n { font-size: 28px; line-height: 1; }
.m-index .go { font-family: "Commit Mono", monospace; font-size: 8.5px; color: var(--accent); }
.m-heatmap { --pitch: 8px; }
.m-heatmap .inner { padding: 8px; }
.m-heatmap .head { font-size: 8.5px; margin-bottom: 7px; }
.m-heatmap .months { font-size: 7.5px; height: 11px; }
.m-heatmap .grid, .m-heatmap .wk { gap: 2px; }
.m-heatmap .grid i { width: 6px; height: 6px; }
.m-streak .inner, .m-list .inner { padding: 8px 7px; }
.m-list .k, .m-streak .k, .m-now .k { font-size: 7.5px; }
.m-streak .big { display: flex; align-items: baseline; gap: 5px; margin-top: 6px; }
.m-streak .flame svg { width: 13px; height: 13px; color: var(--hash); }
.m-streak .big .n { font-size: 32px; line-height: 0.9; }
.m-list .k { margin-bottom: 5px; }
.m-list .kv { font-size: 8.5px; line-height: 1.75; }
.m-list .kv span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.m-list .kv b { flex: none; padding-left: 4px; }
.m-list .bar { height: 4px; margin: 5px 0 6px; }
.m-list .dot { width: 5px; height: 5px; margin-right: 4px; vertical-align: 1px; }
.m-now .inner { padding: 8px 7px; }
.m-now .logo { display: block; width: 22px; height: 22px; padding: 3px; margin: 7px 0 7px; }
.m-now b { display: block; font-family: "Barlow Semi Condensed", sans-serif; font-weight: 600; text-transform: uppercase; font-size: 12.5px; line-height: 1; }
.m-now span { display: block; font-family: "Commit Mono", monospace; font-size: 8px; color: var(--ink-3); margin-top: 4px; }
.m-gitlog .inner { padding: 8px 10px 8px 0; }
.m-gitlog .commit { display: block; height: 37px; padding-left: 30px; font-size: 8.5px; }
.m-gitlog .commit .node { position: absolute; top: 1px; width: 7px; height: 7px; margin: 0; }
.m-gitlog .commit.lane0 .node { left: 10px; }
.m-gitlog .commit.lane1 .node { left: 20px; }
.m-gitlog .line1 { display: flex; align-items: center; gap: 5px; }
.m-gitlog .logo { width: 10px; height: 10px; margin: 0; }
.m-gitlog .ref { font-size: 7.5px; margin-left: 2px; padding: 0 4px; }
.m-gitlog .date { margin-left: auto; font-size: 8px; padding: 0; }
.m-gitlog .subject { font-family: "Geist", sans-serif; font-size: 10px; margin-top: 4px; text-overflow: ellipsis; }
.m-social .inner { padding: 0; }
.m-social .glyph svg { width: 15px; height: 15px; }
.m-eof .inner { gap: 8px; padding: 4px 12px; }
.m-eof .mascot { width: 56px; height: 56px; margin: -8px -4px -8px -8px; }
.m-eof b { font-size: 15px; }
.m-eof span { font-size: 8.5px; }
.eof b { display: block; font-size: 22px; line-height: 1; letter-spacing: 0.08em; }
.eof span { font-size: 10px; color: var(--ink-3); }
`;

/** Runs in the page. Serialized with Function#toString, so it must be self-contained. */
function arrange(chamfer: number) {
    const NS = 'http://www.w3.org/2000/svg';
    const el = (name: string, attrs: Record<string, string | number>) => {
        const node = document.createElementNS(NS, name);
        for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
        return node;
    };

    // Shrink-to-fit cards (labels): pin to whole pixels so the slice is crisp.
    for (const card of document.querySelectorAll<HTMLElement>('.card.label')) {
        const cell = card.parentElement!;
        const w = Math.ceil(card.offsetWidth / 2) * 2;
        card.style.width = `${w}px`;
        card.style.transform = 'none';
        card.style.left = `${(cell.clientWidth - w) / 2}px`;
    }

    for (const card of document.querySelectorAll<HTMLElement>('.card')) {
        const w = card.offsetWidth, h = card.offsetHeight, c = chamfer;
        const svg = el('svg', { class: 'shape', width: w, height: h });
        svg.append(el('polygon', { points: `0.5,0.5 ${w - 0.5},0.5 ${w - 0.5},${h - c} ${w - c},${h - 0.5} 0.5,${h - 0.5}` }));
        card.prepend(svg);
    }

    for (const board of document.querySelectorAll<HTMLElement>('.board')) {
        const box = board.getBoundingClientRect();
        const svg = board.querySelector('.wires')!;
        const mid = box.width / 2 + 0.5;
        const rows = [...board.querySelectorAll('.row')].map((row) =>
            [...row.querySelectorAll('.card')].map((card) => {
                const r = card.getBoundingClientRect();
                return { x: Math.round(r.left - box.left + r.width / 2) + 0.5, top: r.top - box.top, bottom: r.bottom - box.top };
            }),
        );

        const line = (d: string, cls = 'wire') => svg.append(el('path', { d, class: cls }));
        const port = (x: number, y: number) => svg.append(el('rect', { x: x - 8.5, y: y - 1.5, width: 16, height: 3, class: 'port' }));

        /** Sources drop to a shared bus, the bus feeds every target. */
        const connect = (from: { x: number; y: number }[], to: { x: number; y: number }[]) => {
            const bus = Math.round((Math.max(...from.map((p) => p.y)) + Math.min(...to.map((p) => p.y))) / 2) + 0.5;
            const xs = [...from, ...to].map((p) => p.x);
            const lo = Math.min(...xs), hi = Math.max(...xs);
            for (const p of from) line(`M${p.x},${p.y} V${bus}`);
            for (const p of to) line(`M${p.x},${bus} V${p.y}`);
            if (hi > lo) {
                line(`M${lo},${bus} H${hi}`);
                for (const x of new Set(xs)) if (x !== lo && x !== hi) svg.append(el('rect', { x: x - 2, y: bus - 2, width: 4, height: 4, class: 'joint' }));
            }
            // A lit segment on each drop into a card: the signal arriving.
            for (const p of to) if (p.y > bus + 10) line(`M${p.x},${p.y - 9} V${p.y - 1}`, 'signal');
        };

        let sources = [{ x: mid, y: 0 }];
        rows.forEach((cards, i) => {
            connect(sources, cards.map((c) => ({ x: c.x, y: c.top })));
            const last = i === rows.length - 1;
            for (const c of cards) {
                port(c.x, c.top);
                if (!last || board.dataset.exit === 'true') port(c.x, c.bottom);
            }
            sources = cards.map((c) => ({ x: c.x, y: c.bottom }));
        });
        if (board.dataset.exit === 'true') connect(sources, [{ x: mid, y: box.height }]);
    }

    // git log --graph: main is lane 0, builds branch off into lane 1.
    for (const log of document.querySelectorAll<HTMLElement>('.gitlog')) {
        const svg = log.querySelector('.graph')!;
        const base = svg.getBoundingClientRect();
        const nodes = [...log.querySelectorAll('.commit')].map((row) => {
            const r = row.querySelector('.node')!.getBoundingClientRect();
            return { lane: row.classList.contains('lane1') ? 1 : 0, x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2 };
        });
        const main = nodes.filter((n) => n.lane === 0);
        const first = main[0]!, last = main[main.length - 1]!;
        const x0 = first.x;
        svg.append(el('path', { d: `M${x0},${first.y} V${last.y}`, class: 'main' }));
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i]!.lane !== 1 || nodes[i - 1]?.lane === 1) continue;
            let j = i;
            while (nodes[j + 1]?.lane === 1) j++;
            const above = nodes[i - 1], below = nodes[j + 1], a = nodes[i]!, b = nodes[j]!;
            const x1 = a.x;
            let d = `M${x1},${a.y} V${b.y}`;
            if (above) d = `M${x0},${above.y + 8} C${x0},${above.y + 18} ${x1},${a.y - 14} ${x1},${a.y}` + ` V${b.y}`;
            if (below) d += ` C${x1},${b.y + 14} ${x0},${below.y - 18} ${x0},${below.y - 8}`;
            svg.append(el('path', { d }));
        }
    }

    (window as any).__laidOut = true;
}

export function pageHtml(boards: string, theme: ThemeName, layout: Layout): string {
    return `<!doctype html><html><head><meta charset="utf-8"><base href="file://${FOLIO}/">
<style>${css(theme, layout)}</style></head>
<body class="${layout} ${theme}-theme">${boards}
<script>
(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map((img) => img.decode().catch(() => {})));
  (${arrange.toString()})(${LAYOUT[layout].chamfer});
})();
</script></body></html>`;
}
