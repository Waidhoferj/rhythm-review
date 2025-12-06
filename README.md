# Rhythm Review

A dance practice app that helps dancers track, organize, and practice their moves using spaced repetition learning.

## Overview

Rhythm Review is designed to help dancers improve their skills through structured practice sessions. The app allows you to catalog individual dance moves, combine them into patterns, and create practice sets that use the SM-2 spaced repetition algorithm to optimize your learning.

## Features

- **Dance Library**: Organize and search through your moves, patterns, and practice sets
- **Move Management**: Track individual dance moves with names, descriptions, and count durations
- **Pattern Creation**: Combine moves into sequential patterns
- **Practice Sets**: Group moves and patterns by concept, style, or difficulty with tags and icons
- **Practice Logs**: Review your training history with detailed statistics and personal notes
- **User Profiles**: Track overall progress and access your complete training history


## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (or Neon account)
- Stack Auth project

### Installation

1. Clone the repository:
```sh
git clone <repository-url>
cd rhythm-review
```

2. Install dependencies:
```sh
npm install
```

3. Set up environment variables:
```sh
cp .env.example .env
```

Edit `.env` and add your credentials:
- `DATABASE_URL`: Your PostgreSQL connection string
- Stack Auth configuration variables

4. Push the database schema:
```sh
npm run db:push
```

5. Start the development server:
```sh
npm run dev
```

The app will be available at `http://localhost:5173`

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run type checking
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier
- `npm run test` - Run unit tests
- `npm run test:unit` - Run unit tests in watch mode

### Database Commands

- `npm run db:push` - Push schema changes to database
- `npm run db:generate` - Generate migration files
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Open Drizzle Studio

## Database Schema

The app uses the following main tables:

- `moves` - Individual dance moves
- `patterns` - Sequences of moves
- `practice_sets` - Collections of moves and patterns
- `practice_sessions` - Training session records
- `practice_executions` - Individual move attempts during sessions
- `sm2_performance` - Spaced repetition algorithm data

## Deployment

The app is configured for deployment on Vercel:

```sh
npm run build
```

Ensure all environment variables are set in your Vercel project settings.
