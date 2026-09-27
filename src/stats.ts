import { gql, GraphQLClient } from 'graphql-request';
import type { Day, UserStats } from './types';

const GITHUB_ENDPOINT = 'https://api.github.com/graphql';

const QUERY = gql`
  query UserStats($login: String!) {
    user(login: $login) {
      name
      login
      followers { totalCount }
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks { contributionDays { contributionCount date } }
        }
      }
      repositories(first: 100, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC, orderBy: {field: STARGAZERS, direction: DESC}) {
        totalCount
        nodes {
          nameWithOwner
          stargazerCount
          languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
            edges { size node { name color } }
          }
        }
      }
      pullRequests { totalCount }
      issues { totalCount }
    }
  }
`;

/** Languages that are markup or build glue, not something anyone writes a project in. */
const IGNORED_LANGUAGES = new Set(['HTML', 'CSS', 'SCSS', 'Dockerfile', 'Makefile', 'Shell', 'Jupyter Notebook']);

export async function fetchUserStats(username: string, token: string): Promise<UserStats> {
  const client = new GraphQLClient(GITHUB_ENDPOINT, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const { user }: any = await client.request(QUERY, { login: username });

  const repoStars: Record<string, number> = {};
  let totalStars = 0;
  const bytes = new Map<string, { size: number; color: string }>();

  for (const repo of user.repositories.nodes) {
    repoStars[repo.nameWithOwner.toLowerCase()] = repo.stargazerCount;
    totalStars += repo.stargazerCount;
    for (const { size, node } of repo.languages.edges) {
      if (IGNORED_LANGUAGES.has(node.name)) continue;
      const current = bytes.get(node.name) ?? { size: 0, color: node.color ?? '#888888' };
      current.size += size;
      bytes.set(node.name, current);
    }
  }

  const totalBytes = [...bytes.values()].reduce((sum, l) => sum + l.size, 0) || 1;
  const topLanguages = [...bytes.entries()]
    .map(([name, { size, color }]) => ({ name, color, percentage: (size / totalBytes) * 100 }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  const calendar = user.contributionsCollection.contributionCalendar;
  const weeks: Day[][] = calendar.weeks.map((w: any) =>
    w.contributionDays.map((d: any) => ({ date: d.date, count: d.contributionCount })),
  );

  return {
    username: user.login,
    name: user.name || user.login,
    followers: user.followers.totalCount,
    publicRepos: user.repositories.totalCount,
    totalStars,
    totalPRs: user.pullRequests.totalCount,
    totalIssues: user.issues.totalCount,
    contributions: calendar.totalContributions,
    repoStars,
    topLanguages,
    weeks,
    ...streaks(weeks.flat()),
  };
}

/**
 * Longest run of days with contributions, and the run that is still alive.
 * Today not having a contribution yet does not break the current streak —
 * the day is not over.
 */
function streaks(days: Day[]): { streaks: UserStats['streaks']; best: Day } {
  let longest = 0;
  let run = 0;
  let best = days[0]!;
  for (const day of days) {
    run = day.count > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
    if (day.count > best.count) best = day;
  }

  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i]!.count > 0) current++;
    else if (i === days.length - 1) continue;
    else break;
  }

  return { streaks: { current, longest }, best };
}
