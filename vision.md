# TotalTidy — Product Vision

## One-Liner

A "snap-and-forget" home inventory app that turns chaotic rooms into clean digital catalogs — designed for one-handed, zero-friction use by busy parents.

## Problem

Every parent drowns in stuff. Toys, clothes, shoes, books — scattered across rooms, drawers, and mystery cupboards. Existing home inventory apps fail because they feel like data entry. Nobody wants to type "Red LEGO Truck" into a form while a toddler is screaming. The result: nothing gets tracked, nothing gets sold, nothing gets donated. The mess wins.

## Solution

TotalTidy is a capture-first inventory app. You point your phone at the mess, rapid-fire snap photos, and the app does the rest — background removal, item identification, location assignment, and catalog generation — all asynchronously, with zero spinners.

The core insight: **reduce capture friction to near-zero, handle the organizing in the background.** The user's job is to snap. The app's job is everything else.

## Core Principles

1. **Capture speed over perfection.** The camera stays live after every shot. No upload screens, no confirmation dialogs.
2. **One-handed operation.** Every interaction is reachable with a thumb. Location assignment is a single tap on a bubble, not a dropdown.
3. **No visible processing.** Background removal, AI labeling, and image optimization happen asynchronously. The user sees the clean result only when they open the gallery.
4. **Low cognitive load.** The app predicts where items go (time-of-day, recency, frequency). Smart defaults mean most items need zero manual input.
5. **Dopamine by design.** Session summaries, shimmer animations, satisfying sounds, and gamified stats turn a chore into a reward loop.

## Target User

**Primary:** Parents with children aged 0–10, managing household clutter across toys, clothes, and everyday items. Smartphone-native, time-poor, aesthetically motivated.

**Secondary:** Anyone doing a significant declutter — moving house, downsizing, KonMari-style purge.

## User Experience Pillars

**The Magic Lens (Capture)** — Camera-first home screen, zero-latency shutter, thumbnail tray of last 3–4 captures. Rapid-fire mode: snap 20 items without stopping.

**The Sorting Station (Organize)** — 4–5 frequency/recency-sorted location bubbles above the shutter. Unsorted Inbox for "capture now, assign later." Tinder-style swipe cards — Keep / Donate / Sell — with AI-suggested tags (#Outgrown, #Keepsake, #MissingParts).

**The Vanish Studio (Processing)** — Cloudinary background removal runs async. Dirty floor photo → clean studio-white product shot. AI auto-labels items ("Red LEGO Truck," "Denim Jacket Size 4T"). The "reveal" moment: open gallery, see a pristine organized catalog.

**The Zen Dashboard (Insight)** — Bird's-eye view of the home. Category volume meters, gentle nudges when categories get overstuffed, Gratitude Archive for sentimental items.

**The Joy-Roll (Reward)** — Session summary after 60s inactivity. Stats: items cleared, locations filled, floor space reclaimed. Turns chores into a curated museum of your child's life.

## Visual Identity — Scandi-Minimalist

Palette: sage greens, soft terracottas, paper whites, warm wood tones. Feel: calming, not clinical. "Kidsy" but grown-up. Think IKEA catalog meets Marie Kondo.

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
| Session Joy-Roll | Summary card with stats after each capture session |

**Explicitly NOT in V1:** Marketplace integration, community circles, AR overlays, insurance export PDF, B2B features.

## V2+ Roadmap

1. **Auto-Listing Engine** — Cross-post to eBay/Vinted/FB Marketplace with AI descriptions and smart pricing
2. **Community Swap** — Private "Hand-Me-Down Circles" for parent groups, sustainability scoring
3. **Inventory Intelligence** — Outgrown alerts by size/age, replacement suggestions, insurance vault PDF
4. **Professional Organizer Marketplace** — B2B lead gen for real-world organizers
5. **AR X-Ray Vision** — Point phone at closed cupboard → see digital overlay of contents

## Success Metrics (V1)

| Metric | Target |
|---|---|
| Time from app-open to first capture | < 2 seconds |
| Items captured per session (median) | ≥ 8 |
| Session completion (Joy-Roll shown) | ≥ 60% of sessions |
| D7 retention | ≥ 30% |
| Items with auto-assigned location | ≥ 50% |
