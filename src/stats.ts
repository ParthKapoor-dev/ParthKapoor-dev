import { gql, GraphQLClient } from 'graphql-request';
import type { UserStats } from './types';

const GITHUB_ENDPOINT = 'https://api.github.com/graphql';

export async function fetchUserStats(username: string, token: string): Promise<UserStats> {
  const client = new GraphQLClient(GITHUB_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const query = gql`
    query UserStats($login: String!) {
      user(login: $login) {
        name
        login
        avatarUrl
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                color
                contributionCount
                date
              }
            }
          }
        }
        repositories(first: 100, ownerAffiliations: OWNER, orderBy: {field: STARGAZERS, direction: DESC}) {
          totalCount
          nodes {
            stargazers {
              totalCount
            }
            languages(first: 1, orderBy: {field: SIZE, direction: DESC}) {
              nodes {
                name
                color
              }
            }
          }
        }
        pullRequests(first: 1) {
          totalCount
        }
        issues(first: 1) {
          totalCount
        }
        repositoriesContributedTo(first: 1, contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]) {
          totalCount
        }
      }
    }
  `;

  const data: any = await client.request(query, { login: username });
  const user = data.user;

  // Calculate total stars
  const totalStars = user.repositories.nodes.reduce((acc: number, repo: any) => {
    return acc + repo.stargazers.totalCount;
  }, 0);

  // Calculate language stats
  const languageMap = new Map<string, { count: number; color: string }>();
  let totalReposWithLang = 0;

  user.repositories.nodes.forEach((repo: any) => {
    if (repo.languages.nodes.length > 0) {
      const lang = repo.languages.nodes[0];
      const current = languageMap.get(lang.name) || { count: 0, color: lang.color };
      languageMap.set(lang.name, { count: current.count + 1, color: lang.color });
      totalReposWithLang++;
    }
  });

  const topLanguages = Array.from(languageMap.entries())
    .map(([name, { count, color }]) => ({
      name,
      color,
      percentage: (count / totalReposWithLang) * 100,
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  // Approximate total commits (this is hard to get exactly via API quickly, so we use contributions)
  // Or we can just show "Contributions" which is more accurate.
  // The user asked for "total repositories" etc.

  // Calculate Streaks
  const weeks = user.contributionsCollection.contributionCalendar.weeks;
  const days: { date: string; count: number }[] = [];

  weeks.forEach((week: any) => {
    week.contributionDays.forEach((day: any) => {
      days.push({ date: day.date, count: day.contributionCount });
    });
  });

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Flattened list is sorted by date ascending.
  // Check streaks.
  // We need to iterate carefully.

  // Longest Streak
  days.forEach(day => {
    if (day.count > 0) {
      tempStreak++;
    } else {
      if (tempStreak > longestStreak) longestStreak = tempStreak;
      tempStreak = 0;
    }
  });
  if (tempStreak > longestStreak) longestStreak = tempStreak;

  // Current Streak (working backwards from today)
  // Ensure we handle timezones loosely by checking the last few days
  const today = new Date().toISOString().split('T')[0];
  const reversedDays = [...days].reverse();

  let foundStart = false;
  // If today has 0, but yesterday has > 0, current streak is alive.
  // If today has > 0, streak is alive.

  for (let i = 0; i < reversedDays.length; i++) {
    const day = reversedDays[i];
    if (day.count > 0) {
      currentStreak++;
      foundStart = true;
    } else {
      // If we haven't found the start of the streak yet (i.e. we are looking at future days or today is 0)
      // Actually, graph goes up to today.
      if (i === 0 && day.count === 0) {
        // Today is 0, check yesterday
        continue;
      }
      // Break if we hit a 0 after starting a streak
      if (foundStart) break;
      // If we haven't found start and hit 0 (like today was 0, yesterday 0), then streak is 0.
      if (i > 0) break;
    }
  }

  return {
    username: user.login,
    name: user.name || user.login,
    totalStars,
    totalCommits: user.contributionsCollection.contributionCalendar.totalContributions,
    totalPRs: user.pullRequests.totalCount,
    totalIssues: user.issues.totalCount,
    contributions: user.contributionsCollection.contributionCalendar.totalContributions,
    avatarUrl: user.avatarUrl,
    topLanguages,
    contributionGraph: user.contributionsCollection.contributionCalendar,
    streaks: {
      current: currentStreak,
      longest: longestStreak
    }
  };
}
