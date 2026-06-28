# TotalTidy — Roadmap

## Philosophy

Ship iteratively. Each phase is a usable product — not a stepping stone to the "real" one. V1 solves the capture problem. V2 solves the monetization problem. V3 solves the network problem.

---

## Phase 1: MVP — "Snap-Snap-Done" (Weeks 1–8)

**Goal:** A working capture-to-catalog loop that feels like magic.

### Milestone 1.1 — Foundation (Weeks 1–2)

- Project scaffolding: React app, tRPC API, Drizzle + Postgres schema, auth (email magic link or OAuth)
- Core data model: Users, Items, Locations, Capture Sessions
- Cloudinary integration: upload pipeline, background removal webhook handler
- Basic camera UI: full-screen, single-tap capture, photo stored to Cloudinary

### Milestone 1.2 — Capture Flow (Weeks 3–4)

- Rapid-fire camera: zero-lag shutter, thumbnail tray (last 3–4 captures), camera stays live
- Location Strip: hardcoded 3–5 quick-tap bubbles above shutter
- One-tap assignment: snap → tap location → filed (target: 1.5s)
- Unsorted Inbox: items without location assignment land here
- Batch assign: "N items are homeless — all going to [last location]?" prompt

### Milestone 1.3 — The Vanish Studio (Weeks 5–6)

- Async background removal via Cloudinary AI
- Processed image replaces original in gallery (dirty → clean transition)
- Smart Labels: AI item identification via Cloudinary auto-tagging or a vision API call
- Clean gallery view: studio-white grid, grouped by location

### Milestone 1.4 — Polish & Reward Loop (Weeks 7–8)

- Location prediction: reorder bubbles by frequency + recency + time-of-day
- Last-Location Memory: default to most recent for consecutive captures
- Session Summary (Joy-Roll): triggered after 60s inactivity — items cleared, locations used, "floor space reclaimed"
- Scandi-minimalist visual pass: palette, typography, rounded corners, bouncy micro-animations
- Haptic feedback + subtle sound on categorization
- Unsorted Inbox badge with nudge copy

### V1 Exit Criteria

- [ ] Open app → capture first photo in < 2 seconds
- [ ] Capture 10 items in < 30 seconds (rapid-fire mode)
- [ ] Background removal completes async — no spinner ever shown
- [ ] Gallery displays clean, white-background item grid
- [ ] Session summary fires reliably after capture sessions

---

## Phase 2: Monetization — "The Lifecycle Economy" (Weeks 9–16)

**Goal:** The app pays for itself. Turn cataloged items into revenue.

### Milestone 2.1 — Tinder-Style Sorting (Weeks 9–10)

- Swipe cards: Keep / Donate / Sell
- AI-suggested tags: #Outgrown, #Keepsake, #MissingParts, #SeasonalStore
- Bulk sort mode for inbox backlog

### Milestone 2.2 — Auto-Listing Engine (Weeks 11–13)

- One-tap listing generation: AI writes SEO-optimized title + description from item photo + label
- Cross-post to eBay / Vinted / Facebook Marketplace (start with one, expand)
- Resale Heatmap: "Items like this sell for £20 — list at £18 for a quick sale"
- Revenue: small convenience fee per listing or affiliate on shipping labels

### Milestone 2.3 — Inventory Intelligence (Weeks 14–15)

- Size/age tagging on clothing items
- Outgrown Alerts: "Your child turns 5 next month — move the 4T box to Sell?"
- Category volume meters on dashboard: "42 t-shirts in Size 4T"
- Gratitude Archive: sentimental items folder

### Milestone 2.4 — Premium Tier (Week 16)

- Free tier: up to 100 items, 3 locations
- Pro tier ($3.99–5.99/mo): unlimited items, unlimited locations, auto-listing, insurance export
- Insurance Vault: one-tap PDF manifest of all items (one-time IAP alternative)
- Bin Label Generator: printable labels with photos of cupboard contents

### V2 Exit Criteria

- [ ] User can go from captured item → live marketplace listing in < 60 seconds
- [ ] Outgrown alerts trigger accurately based on child age + item size
- [ ] Premium conversion rate ≥ 3% of active users
- [ ] At least one marketplace integration fully functional

---

## Phase 3: Network — "The Hand-Me-Down Economy" (Weeks 17–24)

**Goal:** Turn single-player utility into a multiplayer network.

### Milestone 3.1 — Community Swap (Weeks 17–19)

- Private groups: "Park School Parents," "The Smith Family"
- Members see each other's Donate piles
- Zero-Waste Gifting: gift items to friends within the circle
- Sustainability Score: "This group saved 40kg from landfill this month"

### Milestone 3.2 — Professional Organizer Marketplace (Weeks 20–22)

- Remote consultation: share digital inventory with a pro organizer
- Organizer creates a "Reorganization Plan" using the app's location data
- Marketplace commission on bookings

### Milestone 3.3 — Visual Search & AR (Weeks 23–24)

- Visual search: photograph a "gap" (missing LEGO piece) → search inventory for match
- AR X-Ray Vision (experimental): point phone at closed cupboard → see digital overlay of contents

### V3 Exit Criteria

- [ ] ≥ 10 active community circles with ≥ 5 members each
- [ ] At least one item "gifted" per active circle per week
- [ ] Professional organizer marketplace live with ≥ 5 listed organizers

---

## Long-Tail Opportunities

These are not scheduled but inform architectural decisions:

- **Replacement Suggestions** via affiliate links ("You sold 10 toddler books — here are top-rated age-5 books")
- **Donation Map** showing nearest charity shops accepting specific categories
- **Multi-home support** (e.g., split custody households, grandparents' house)
- **Seasonal rotation reminders** (winter coats → storage in April)
- **Integration with smart home** (NFC tags on physical bins → tap to see digital contents)
