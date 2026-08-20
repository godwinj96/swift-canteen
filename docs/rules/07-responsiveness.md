# Swift Canteen — Responsiveness Rules
**Section 7 of 13 · v1.0**

---

## 0. Mobile-First Storefront

Unlike an internal dashboard, the customer storefront (menu, cart, checkout,
order tracking) is used primarily on phones during a short break — design and
build mobile-first, verify desktop as an enhancement, not the other way
around. The admin console can lean slightly more desktop-oriented (staff at a
till/back-office screen) but must still not break on a tablet.

---

## 1. Breakpoints

Tailwind CSS 4 defaults, used consistently across the app:

| Prefix | Min width | Usage |
|---|---|---|
| (none) | 0 | Base mobile layout |
| `sm` | 640px | Minor spacing adjustments |
| `md` | 768px | Two-column layouts begin |
| `lg` | 1024px | Full desktop density (admin tables, hero two-column) |
| `xl` | 1280px | Wider content cap for large screens |

Test at minimum: 375, 640, 768, 1024, 1440, 1920px for any layout change.
Passive whitespace (a flat max-width with no wider breakpoint tier) reads as
unfinished on large screens — prefer a wider cap or intentionally structured
margins at `xl:` over letting a fixed `max-w-6xl` float in empty space.

---

## 2. Touch & Pointer

- Minimum tap target ~44×44px on touch surfaces (cart quantity buttons, admin
  action buttons, nav links)
- Hover-only affordances are not acceptable on the storefront — assume touch
  as the primary input; hover states are a `lg:hover:` enhancement, never the
  only way to discover an action
- `cursor-pointer` on clickable non-native elements

---

## 3. Typography

- Existing pairing: Fraunces (display) + Inter (body) — don't introduce a
  third typeface without a documented reason
- Use Tailwind's scale (`text-sm`, `text-base`, `text-lg`, ...) — avoid
  arbitrary px values unless matching a specific design spec
- Establish real hierarchy: a screen with only 2 type-scale steps (heading +
  body) reads as flat — use eyebrows/labels and stat emphasis where it earns
  its place, per the existing token palette (no new colors)

---

## 4. Modals & Overlays on Small Screens

- Confirmation dialogs must not require horizontal scrolling on a 375px
  viewport
- Ensure on-screen keyboard doesn't obscure a focused input — scroll the
  input into view on focus if needed
- `overscroll-behavior: contain` on any scrollable sheet/drawer body

---

## 5. Admin Action Buttons — Look Like Buttons

Admin table row actions (confirm order, cancel order, edit item, delete item)
must render as actual buttons with a visible surface, not bare text links.
Minimum bar:

- A distinguishable background/border so the action reads as interactive
  before the user reads the label
- Explicit hover, focus-visible, and active states (not just a color-change
  hover — an actual state change: elevation, background shift, or both)
- Destructive actions (delete, cancel) visually distinct from neutral/positive
  ones (confirm, edit) — don't rely on label text alone to convey severity
- Real `<button>` elements per rule 05 §6, not `<a>`/`<Link>` styled to look
  like buttons for anything that isn't a navigation

---

## 6. Tables & Data Grids

- Horizontal scroll wrapper (`overflow-x-auto`) on narrow viewports rather
  than letting a wide table blow out the layout
- Hide non-critical columns below `md:` rather than shrinking every column to
  illegibility

---

## 7. Related

- `docs/rules/05-component-architecture.md` — accessibility baseline
- `READMES/design/` if/when a design-token reference doc is added
