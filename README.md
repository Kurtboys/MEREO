# MEREO

**Brutalist Void Calendar for ADHD Night-Owl Entrepreneurs**

MEREO is a dark-first, anti-anxiety calendar app designed for people who are failed by traditional calendar apps. It rejects time-blocking anxiety in favor of sequential mission focus with Parkinson's Law time intelligence.

## Core Philosophy

- **Dark-first**: Not dark mode option—dark IS the product
- **Anti-grid**: Time flows, doesn't chunk into hourly slots
- **One-thing focus**: Current mission dominates, others hidden
- **Honest time**: Parkinson's Law visible, not hidden
- **Generous negative space**: The void IS the feature

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS (dark theme config)
- **State Management**: Zustand with persist middleware
- **Motion**: Framer Motion
- **Date handling**: date-fns
- **Icons**: Lucide React
- **Canvas (Whiteboard)**: @xyflow/react (React Flow)
- **Storage (V1)**: LocalStorage

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
/app            - Next.js pages and routing
/components     - Reusable UI components
/components/whiteboard - Whiteboard-specific components
/lib            - Utilities, types, and store
/styles         - Global styles (if needed)
```

## Design System

The MEREO design system uses a carefully curated dark color palette:

- **Void**: `#0A0A0A` - Primary background
- **Surface**: `#141414` - Cards and elevated elements
- **Accent**: `#3B82F6` - Primary actions (electric blue)
- **Status Warning**: `#F59E0B` - Time pressure (amber)
- **Status Success**: `#10B981` - Completion (green)
- **Status Bottleneck**: `#EF4444` - ONLY for bottleneck state (red)

Typography:
- **Primary**: Inter (clean, readable)
- **Monospace**: JetBrains Mono (timers, time displays)

## Development

Currently in development. Chunk 1 (Foundation) complete.
