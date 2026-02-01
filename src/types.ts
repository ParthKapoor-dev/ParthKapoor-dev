export interface UserStats {
    username: string;
    name: string;
    totalStars: number;
    totalCommits: number;
    totalPRs: number;
    totalIssues: number;
    contributions: number;
    avatarUrl: string;
    topLanguages: { name: string; color: string; percentage: number }[];
}
