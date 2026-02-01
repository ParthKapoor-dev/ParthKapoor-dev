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
    contributionGraph: {
        totalContributions: number;
        weeks: {
            contributionDays: {
                color: string;
                contributionCount: number;
                date: string;
            }[];
        }[];
    };
    streaks: {
        current: number;
        longest: number;
    };
}
