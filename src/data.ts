/**
 * Everything the profile says about Parth, in one place. Mirrors
 * devport's lib/site.ts, lib/projects.json and lib/timeline.ts — copied
 * rather than imported so the workflow can run from this repo alone.
 */

export const site = {
    name: 'Parth Kapoor',
    handle: 'parthkapoor-dev',
    url: 'https://parthkapoor.me',
    role: 'software engineer · backend & multi-agent AI',
    employer: { name: 'Belzabar Software', url: 'https://belzabar.com' },
    timezone: 'Asia/Kolkata',
} as const;

export interface Project {
    id: string;
    title: string;
    description: string;
    tech: string[];
    /** File in folio/media/projects, or none for a type-only card. */
    image?: string;
    /** CSS object-position for the screenshot crop. */
    imagePosition?: string;
    /** `owner/name` — the star count is fetched for it. */
    repo: string;
    url: string;
    date?: string;
}

const gh = (name: string) => `parthkapoor-dev/${name}`;

/** The three hero builds, top row of the work board. */
export const featured: Project[] = [
    {
        id: 'devx',
        title: 'DevX',
        description: 'Repl-as-a-Service. Isolated cloud dev environments in 5–10 seconds, with AI agents over MCP.',
        tech: ['Go', 'Kubernetes', 'MCP'],
        image: 'devx.webp',
        imagePosition: 'center 52%',
        repo: gh('devex'),
        url: 'https://devx.parthkapoor.me',
        date: 'Jun 2025',
    },
    {
        id: 'void-design',
        title: 'void.design',
        description: 'Design system for AI coding agents: Claude Code skills, Tailwind v4 tokens and an auditing CLI.',
        tech: ['Design System', 'CLI', 'Gen AI'],
        image: 'void-design.webp',
        imagePosition: 'center 45%',
        repo: gh('void.design'),
        url: 'https://void.parthkapoor.me',
        date: 'Sep 2026',
    },
    {
        id: 'zenith-ai',
        title: 'Zenith AI',
        description: 'AI recruiter that scores, retrieves and ranks candidates with RAG and vector search.',
        tech: ['LangChain', 'FastAPI', 'Next.js'],
        image: 'zenith-ai.webp',
        imagePosition: 'center 40%',
        repo: gh('zenith.ai'),
        url: 'https://zenith.parthkapoor.me',
        date: 'Mar 2025',
    },
];

/** Second row: two wide cards with a thumbnail. */
export const notable: Project[] = [
    {
        id: 'better-axios',
        title: 'Better Axios',
        description: 'A minimal, type-safe wrapper for predictable Axios usage.',
        tech: ['TypeScript', 'Open-Source'],
        image: 'better-axios.webp',
        repo: gh('better-axios'),
        url: 'https://better-axios.parthkapoor.me',
    },
    {
        id: 'lexa-ai',
        title: 'Lexa AI',
        description: 'BERT-style multilingual translation model, from scratch on PyTorch.',
        tech: ['PyTorch', 'NLP'],
        image: 'lexa-ai.webp',
        repo: gh('lexa.ai'),
        url: 'https://lexa.parthkapoor.me',
    },
];

/** Third row: type-only cards, then the link to the full index. */
export const more: Project[] = [
    {
        id: 'hopster',
        title: 'Hopster',
        description: 'Ride-sharing on Go + gRPC.',
        tech: ['Go', 'gRPC'],
        repo: gh('hopster'),
        url: 'https://github.com/parthkapoor-dev/hopster',
    },
    {
        id: 'tori-cli',
        title: 'Tori CLI',
        description: 'Route any connection through Tor.',
        tech: ['Node.js', 'CLI'],
        repo: gh('tori-cli'),
        url: 'https://github.com/parthkapoor-dev/tori-cli',
    },
];

export const PROJECT_COUNT = 12;

export type Category = 'work' | 'project' | 'award' | 'edu';

export interface Entry {
    id: string;
    category: Category;
    date: string;
    title: string;
    company?: string;
    logo: string;
    /** One line, shown dim after the subject. */
    note: string;
}

export const timeline: Entry[] = [
    { id: 'belzabar-2025', category: 'work', logo: 'belzabar', date: 'Nov 2025', title: 'Software Engineer', company: 'Belzabar Software', note: '150+ APIs · multi-agent orchestrator, −60% inference cost' },
    { id: 'devex-2025', category: 'project', logo: 'devex', date: 'Aug 2025', title: 'Devex — AI cloud IDE', note: '150+ developers · 200+ REPLs' },
    { id: 'zenith-2025', category: 'project', logo: 'zenith', date: 'Mar 2025', title: 'Zenith AI — hiring assistant', note: '78% ranking accuracy · −70% screening time' },
    { id: 'sih-2024', category: 'award', logo: 'sih', date: 'Dec 2024', title: "Smart India Hackathon '24 — national winner", note: '1st of 400+ teams' },
    { id: 'plex-2024', category: 'work', logo: 'plex', date: 'Aug 2024', title: 'Fullstack DevOps Engineer', company: 'PLEX', note: 'Go + gRPC · −60% latency · 10K users' },
    { id: 'codemate-2024', category: 'work', logo: 'codemate', date: 'Jun 2024', title: 'SDE Intern, AI Services', company: 'CodeMate.AI', note: 'Auto-Documentor agent · +70% doc coverage' },
    { id: 'thapar-2022', category: 'edu', logo: 'thapar', date: 'Sep 2022', title: 'B.Tech Computer Engineering', company: 'Thapar Institute', note: 'Conversational AI elective' },
];

export const COMMIT_TYPE: Record<Category, string> = {
    work: 'feat(work)',
    project: 'build',
    award: 'release',
    edu: 'init',
};

/** Same FNV-1a hash devport's timeline uses, so the hashes match the site. */
export function shortHash(id: string) {
    let h = 0x811c9dc5;
    for (let i = 0; i < id.length; i++) {
        h ^= id.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7);
}

export interface Social {
    id: string;
    icon: string;
    label: string;
    url: string;
}

export const socials: Social[] = [
    { id: 'web', icon: 'web', label: 'site', url: site.url },
    { id: 'x', icon: 'x', label: 'x', url: 'https://twitter.com/parthkapoor_te' },
    { id: 'linkedin', icon: 'linkedin', label: 'linkedin', url: 'https://linkedin.com/in/parthkapoor08' },
    { id: 'mail', icon: 'mail', label: 'email', url: 'mailto:parthkapoor.coder@gmail.com' },
    { id: 'cal', icon: 'cal', label: 'book a call', url: 'https://cal.com/parthkapoor' },
    { id: 'resume', icon: 'resume', label: 'resume', url: `${site.url}/resume` },
];
