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

    return {
        username: user.login,
        name: user.name || user.login,
        totalStars,
        totalCommits: user.contributionsCollection.contributionCalendar.totalContributions, // Using contributions as proxy for "activity"
        totalPRs: user.pullRequests.totalCount,
        totalIssues: user.issues.totalCount,
        contributions: user.contributionsCollection.contributionCalendar.totalContributions,
        avatarUrl: user.avatarUrl,
        topLanguages,
    };
}
