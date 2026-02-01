# AGENT.md

## Project Overview
This project is a **GitHub Profile README Generator**. It dynamically fetches a user's GitHub statistics and renders them into a visually appealing "Terminal-themed Bento Grid" GIF and social badges.

## Tech Stack
- **Runtime**: Bun
- **Language**: TypeScript
- **Rendering**: Puppeteer (Headless Chrome) + `gifencoder`
- **API**: GitHub GraphQL API (`graphql-request`)
- **Automation**: GitHub Actions

## Architecture

### 1. Data Fetching (`src/stats.ts`)
- Fetches user data using the GitHub GraphQL API.
- **Key Metrics**:
    - Total Stars (aggregated from repositories)
    - Total Commits (from Contribution Calendar)
    - Total PRs & Issues
    - Top Languages (by repository count, top 5)
    - Contribution History (Last ~5 months/20 weeks)
    - Current & Longest Streaks (calculated from daily contribution data)

### 2. Template (`src/template.html`)
- **Theme**: "Terminal" / "Hacker" aesthetic (Dark mode, neon accents, JetBrains Mono font).
- **Layout**: CSS Grid "Bento Box" layout.
- **Components**:
    - **Header**: Terminal window controls and "root@user" prompt.
    - **Profile Card**: Avatar, Name, and key stats (Stars, PRs, Commits).
    - **Graph Card**: Visual heatmap of contributions (last 20 weeks).
    - **Streak Card**: Current streak counter with flame icon.
    - **Languages Card**: List of top languages.
- **Animations**: CSS scanline effect, cursor blink, and pulse effects.

### 3. Rendering (`src/renderer.ts`)
- **Process**:
    1. Reads `src/template.html`.
    2. Injects fetched data into Handlebars-style placeholders (e.g., `{{totalStars}}`).
    3. Launches Puppeteer.
    4. Sets viewport to `800x450`.
    5. Captures multiple frames to create an animated GIF (`stats.gif`).
    6. Generates static badges (`twitter.png`, `linkedin.png`) using disjoint HTML templates.
- **Output**: Saves artifacts to the `assets/` directory.

### 4. Entry Point (`index.ts`)
- Orchestrates the flow:
    1. Checks for `GH_TOKEN`.
    2. Fetches stats.
    3. Ensures `assets/` directory exists.
    4. Calls renderer to generate GIF and badges.

## Automation (`.github/workflows/update-stats.yml`)
- **Schedule**: Runs every 12 hours + on push to `main`.
- **Steps**:
    1. Checkout code.
    2. Setup Bun.
    3. Install dependencies (`bun install`).
    4. Run generation script (`bun run index.ts`).
    5. Commit and push changes to `README.md` and `assets/` (if any).

## Development
- **Setup**:
    ```bash
    bun install
    cp .env.example .env # Add GH_TOKEN
    ```
- **Run Locally**:
    ```bash
    bun run index.ts
    ```
    *Note: verification typically requires a generated token.*

## Key Files
- `index.ts`: Main script.
- `src/stats.ts`: GraphQL logic and data processing.
- `src/renderer.ts`: Puppeteer and GIF encoding logic.
- `src/template.html`: The visual design source.
- `assets/`: Directory where generated images are stored.
