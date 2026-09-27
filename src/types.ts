export interface Day {
    date: string;
    count: number;
}

export interface UserStats {
    username: string;
    name: string;
    followers: number;
    publicRepos: number;
    totalStars: number;
    totalPRs: number;
    totalIssues: number;
    /** Contributions in the last year, from the contribution calendar. */
    contributions: number;
    /** Stars per `owner/name`, for the project cards. */
    repoStars: Record<string, number>;
    /** Share of bytes across owned, non-fork repositories. */
    topLanguages: { name: string; color: string; percentage: number }[];
    /** Week columns, oldest first, each Sunday → Saturday. */
    weeks: Day[][];
    streaks: { current: number; longest: number };
    /** Busiest single day in the calendar. */
    best: Day;
}
