# TotalTidy — Product Vision

## One-Liner

A "snap-and-forget" home inventory app that turns chaotic rooms into clean digital catalogs — designed for one-handed, zero-friction use by busy parents.

## Problem

Every parent drowns in stuff. Toys, clothes, shoes, books — scattered across rooms, drawers, and mystery cupboards. Existing home inventory apps fail because they feel like data entry. Nobody wants to type "Red LEGO Truck" into a form while a toddler is screaming. The result: nothing gets tracked, nothing gets sold, nothing gets donated. The mess wins.

## Solution

TotalTidy is a capture-first inventory app. You point your phone at the mess, rapid-fire snap photos, and the app does the rest — background removal, item identification, location assignment, and catalog generation — all asynchronously, with zero spinners.

The core insight: **reduce the capture friction to near-zero, and handle the "organizing" in the background.** The user's job is to snap. The app's job is everything else.

## Core Principles

1. **Capture speed over perfection.** The camera stays live after every shot. No upload screens, no confirmation dialogs. Snap → toss → next.
2. **One-handed operation.** Every interaction is reachable with a thumb. Location assignment is a single tap on a bubble, not a dropdown.
3. **No visible processing.** Background removal, AI labeling, and image optimization happen asynchronously. The user sees the "clean" result only when they open the gallery.
4. **Low cognitive load.** The app predicts where items go (time-of-day, recency, frequency). Smart defaults mean most items need zero manual input.
5. **Dopamine by design.** Session summaries, shimmer animations, satisfying sounds, and gamified stats ("You cleared 24 items!") turn a chore into a reward loop.

## Target User

**Primary:** Parents with children aged 0–10, managing household clutter across toys, clothes, and everyday items. Likely one parent (often the mother) who is the "household ops manager." Smartphone-native, time-poor, aesthetically motivated.

**Secondary:** Anyone doing a significant declutter — moving house, downsizing, KonMari-style purge.

## User Experience Pillars

### The Magic Lens (Capture)

- Camera-first home screen — no dashboard to scroll past
- Zero-latency shutter with thumbnail tray showing last 3–4 captures
- Smart overlays that highlight recognizable items with soft halos (V2)
- Rapid-fire mode: snap 20 items without stopping

### The Sorting Station (Organize)

- **Location Strip:** 4–5 tap-target bubbles above the shutter — "Narnia Cupboard," "Toy Trunk," "Laundry Basket," custom locations
- **Prediction Engine:** Bubbles reorder by time-of-day, recency, and frequency
- **Last-Location Memory:** Default sticks to most recent location for batch captures
- **Unsorted Inbox:** Skip assigning entirely — items land in a triage inbox with a gentle nudge badge later
- **Tinder-style Sort:** Swipe cards — Keep / Donate / Sell — with AI-suggested tags (#Outgrown, #Keepsake, #MissingParts)

### The Vanish Studio (Processing)

- Background removal runs async (cloud via Cloudinary)
- Dirty floor photo → clean studio-white product shot
- AI auto-labels items ("Red LEGO Truck," "Denim Jacket, Size 4T")
- The "reveal" moment: open gallery → see a pristine, organized catalog

### The Zen Dashboard (Insight)

- Bird's-eye view of your "Digital Home"
- Category volume meters — "42 t-shirts in Size 4T"
- Gentle nudges when categories get overstuffed
- Gratitude Archive — sentimental items you've photographed before letting go

### The Joy-Roll (Reward)

- Session summary after 60 seconds of inactivity
- Stats: items cleared, locations filled, metaphorical "floor space reclaimed"
- Gamified feel — turns chores into a curated museum of your child's life

## Visual Identity — "Scandi-Minimalist"

- **Palette:** Sage greens, soft terracottas, paper whites, warm wood tones
- **Interface:** Rounded corners, bouncy animations, high-quality iconography
- **Feel:** Calming, not clinical. "Kidsy" but grown-up. Think IKEA catalog meets Marie Kondo

## MVP Scope (V1)

| Feature | What It Does |
|---|---|
| Rapid-Fire Camera | Zero-lag capture, thumbnail tray, camera stays live |
| Async Background Removal | Cloudinary-powered, no spinners, clean gallery |
| Quick-Tap Locations | 3–5 frequency/recency-sorted location bubbles |
| Unsorted Inbox | Capture now, assign later, badge nudge |
| Smart Labels | AI item identification (name, category) |
| Clean Gallery | Studio-white grid of all cataloged items |
| Batch Assign | "20 new items — all going to Narnia?" one-tap confirm |
| Session Summary | Joy-Roll card with stats after each capture session |

### Explicitly NOT in V1

- Marketplace integration (eBay, Vinted)
- Community / hand-me-down circles
- AR overlay on physical cupboards
- Insurance export PDF
- B2B / professional organizer features

## V2 Roadmap Themes

1. **Auto-Listing Engine** — One-tap cross-post to eBay/Vinted/FB Marketplace with AI-generated descriptions and smart pricing
2. **Community Swap** — Private "Hand-Me-Down Circles" for parent groups, sustainability scoring
3. **Inventory Intelligence** — Outgrown alerts by size/age, replacement suggestions via affiliate links, insurance vault PDF export
4. **Professional Organizer Marketplace** — B2B lead gen for real-world organizers using the digital inventory
5. **AR X-Ray Vision** — Point phone at closed cupboard → see digital overlay of contents

## Success Metrics (V1)

| Metric | Target |
|---|---|
| Time from app-open to first capture | < 2 seconds |
| Items captured per session (median) | ≥ 8 |
| Session completion (Joy-Roll shown) | ≥ 60% of sessions |
| D7 retention | ≥ 30% |
| Items with auto-assigned location | ≥ 50% |
