# MEREO Calendar App

## What This Is
Brutalist void calendar for ADHD night-owl entrepreneurs. Luxury aesthetic — spacious, premium, confident. This is NOT a military app. Think Apple, Linear, high-end SaaS.

## Tech Stack
- Next.js 14+ (App Router)
- Tailwind CSS (dark theme)
- Zustand + localStorage persist
- Framer Motion for animations
- Deployed on Vercel (auto-deploys from GitHub)

---

## Design System

### Colors (use these exact values)
```
Background (void):   #0A0A0A
Surface (cards):     #141414
Hover state:         #1A1A1A
Border subtle:       #2A2A2A
Border focus:        #3B82F6
Text primary:        #E5E5E5
Text secondary:      #737373
Text disabled:       #525252
Accent blue:         #3B82F6
Accent hover:        #2563EB
Status success:      #10B981
Status warning:      #F59E0B
```

### Fonts (files in /public/)
| Font | Tailwind Class | Use For |
|------|----------------|---------|
| Satoshi Black (900) | font-black | Logo, headers, nav tabs, buttons, mission titles |
| Satoshi Medium (500) | font-medium | Body text, labels, inputs |
| JetBrains Mono Light (300) | font-mono font-light | Time displays, version indicator |

### Spacing Philosophy
GENEROUS. Nothing should feel cramped. When in doubt, add more space.

- Container padding: minimum 24px (p-6), prefer 32px (p-8)
- Gaps between elements: minimum 24px (gap-6)
- Header height: minimum 80px, should feel substantial
- Section spacing: 32-48px between major sections

### Motion
- All transitions: 200-300ms ease-out (NEVER 150ms)
- Hover lifts: translateY(-1px) with subtle shadow increase
- Use Framer Motion for complex animations

### Button Style (Login/Clock Out)
- Subtle glow effect on hover
- Underline animation
- No heavy borders or backgrounds
- Text should be Satoshi Black

---

## Key Files
```
/app/page.tsx              — Login page
/app/today/page.tsx        — Today View (main execution view)
/app/scheduler/page.tsx    — Scheduler View
/app/whiteboard/page.tsx   — Whiteboard View
/tailwind.config.js        — Design tokens and font config
/public/                   — Font files (Satoshi, JetBrains Mono)
```

---

## Commands
```bash
npm run dev        # Start dev server
npm run build      # Build for production (must pass before committing)
npm run typecheck  # Check TypeScript types
```

---

## Branch Configuration
**ALWAYS work on:** `claude/build-mereo-calendar-n8Y3I`

Before ANY work, run:
```bash
git checkout claude/build-mereo-calendar-n8Y3I
```

**NEVER create new branches.**

---

## Verification Checklist (Do After Every Change)
1. ✅ `npm run build` passes
2. ✅ Update version indicator (bottom-right corner) to new version
3. ✅ Push to branch
4. ✅ Ask yourself: Does this feel LUXURIOUS and SPACIOUS?

---

## Current State (January 2026)
- Login page: Complete (clock, "Punch That Time Card" button)
- Today View: Layout exists, needs UI polish
- Scheduler View: Skeleton only
- Whiteboard View: Skeleton only
- Version indicator: Working (bottom-right, shows current version)

---

## Anti-Patterns (NEVER DO THESE)
- ❌ Pure white (#FFFFFF) — always use #E5E5E5 or darker
- ❌ Red color except for error/bottleneck states
- ❌ Cramped spacing — when unsure, add MORE space
- ❌ Military-style formatting (no "0400 HRS", use "4:00 AM")
- ❌ Small, timid headers — make them substantial
- ❌ Creating new branches
- ❌ Guessing at design values — reference this file

---

## Design Philosophy
1. **Luxury over utility** — Every element should feel premium
2. **Breathing room** — Generous whitespace (darkspace) everywhere
3. **Confident choices** — Bold typography, clear hierarchy
4. **The Void** — Dark backgrounds make content float
5. **No time anxiety** — This app rejects calendar stress

---

## When Stuck
- Re-read this file
- Check if spacing is generous enough (probably not)
- Check if fonts are applied correctly
- Ask clarifying questions before implementing
- Reference existing patterns in the codebase
