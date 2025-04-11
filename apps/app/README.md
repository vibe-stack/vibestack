# VibeStack Game Engine

A browser-based game development environment with virtual filesystem and version control.

## Features

- Create, edit, and manage game projects directly in the browser
- Monaco editor integration for code editing
- Git-like version control with commits and history
- Database-backed virtual filesystem
- Support for multiple file types and syntax highlighting

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database

### Installation

1. Clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/vibestack.git
cd vibestack
pnpm install
```

2. Set up your environment variables:

Create a `.env.development.local` file in the apps/app directory with the following content:

```
DATABASE_URL=postgres://username:password@localhost:5432/vibestack
```

Replace `username` and `password` with your PostgreSQL credentials.

3. Set up the database:

```bash
cd apps/app
pnpm db:generate # Generate migration files
pnpm db:push # Apply migrations to your database
```

4. Start the development server:

```bash
pnpm dev
```

5. Visit `http://localhost:3000` to see the application.

## Architecture

The application uses:

- Next.js for the frontend and API
- Drizzle ORM for database interactions
- Vercel Postgres for data storage
- Monaco Editor for code editing

### Database Schema

The database is structured around these main entities:

- Games - Projects containing multiple files
- Files - Individual game files (code, assets, etc.)
- FileVersions - Historical versions of each file
- Commits - Collection of file changes
- CommitFiles - Many-to-many relationship between commits and file versions

This structure provides git-like version control for all game files.

## Usage

1. Create a new game from the home page
2. Add files to your game (JavaScript, HTML, CSS, etc.)
3. Edit files in the Monaco editor
4. Changes are automatically saved when you click Save
5. View file history to see previous versions
6. Create commits to group related changes

## API Endpoints

The application provides these main API endpoints:

- `/api/games` - List and create games
- `/api/games/[id]` - Get a specific game
- `/api/games/[id]/files` - Manage files for a game
- `/api/files/[id]` - Get and update file content
- `/api/files/[id]/history` - View file version history
- `/api/games/[id]/commits` - Create and list commits

## License

[MIT](LICENSE)
