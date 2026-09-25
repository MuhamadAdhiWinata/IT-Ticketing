# Development & Architecture Rules (AGENTS.md)

## Architectural Guidelines (Separation of Concerns in Nuxt 3)

1. **Routing & Pages (`pages/`)**:
   - Files in `pages/` must only contain page entry points and high-level route compositions.
   - Pages must delegate UI layout and feature logic to layouts and components.

2. **Layouts (`layouts/`)**:
   - `layouts/flat.vue`: Layout without navbar/sidebar (for authentication, standalone tracking pages).
   - `layouts/dashboard.vue` / `layouts/default.vue`: Layout with Top Navbar & Left Sidebar.

3. **Global UI Components (`components/global/`)**:
   - Reusable structural layout elements must live in `components/global/`:
     - `components/global/Navbar.vue`
     - `components/global/Sidebar.vue`
     - `components/global/Footer.vue`

4. **Feature-based Components (`components/features/`)**:
   - Component UI for specific domains must be organized by feature:
     - `components/features/IT-Dashboard/table-dashboard.vue`
     - `components/features/IT-Dashboard/kanban-dashboard.vue`
     - `components/features/Tracking/tracking-card.vue`
     - `components/features/MyWork/my-work-list.vue`

5. **Modals & Reusable Dialogs (`components/modals/` & `components/common/`)**:
   - Shared modals and micro-components belong in `components/modals/` and `components/common/`.

6. **State Management (Pinia Store in `stores/`)**:
   - Business state (tickets, users, dark mode, active filters) must be managed cleanly using Pinia stores in `stores/`.
   - Direct localStorage calls inside components are prohibited; use services/stores instead.

7. **Services & Utilities (`services/` & `utils/`)**:
   - Storage/API interaction logic stays in `services/`.
   - Business calculations (SLA countdown, export logic) stay in `utils/`.

8. **Types (`types/`)**:
   - All TypeScript interfaces & types must be defined strictly in `types/index.ts`.

## UI/UX Rules
- **No AI Slop / Over-Gradients**: Avoid heavy neon gradients (`bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500`). Use clean, professional, enterprise-grade solid colors and subtle slate/blue accents (`#026bb1`).

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, load the antislop skill for the task:
- Core filter, always on: `antislop`
- UI / visual: `antislop-ui`
- Copy & text: `antislop-copywriting`
- People: `antislop-human`
- Mobile / responsive: `antislop-layoutmobile`
- Code comments: `antislop-code`
Before starting, ask the user when antislop applies: during the work, or after it is done.
To update antislop later: `npx antislop-ai --update`, or run `npx antislop-ai` and pick Overwrite them.
<!-- antislop:end -->
