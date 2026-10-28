# Changelog

All notable changes to this project will be documented in this file.

## [v1.11.4] - 2026-10-27

- Various optimization (#97) by @zigikralj

## [v1.11.3] - 2026-10-26

- refactor: optimize data fetching and query caching across components … (#95) by @zigikralj

## [v1.11.2] - 2026-10-25

- Lazy load optimization (#93) by @zigikralj

## [v1.11.1] - 2026-10-24

- ci: run CodeQL only on pull requests and schedule (#91) by @zigikralj

## [v1.11.0] - 2026-10-23

- feat: add GitHub Actions workflow for CodeQL security analysis (#89) by @zigikralj

## [v1.10.2] - 2026-10-23

- Delta compression (#87) by @zigikralj

## [Unreleased]

- refactor: complete client architectural overhaul to **1 Route -> 1 Page** structure with dedicated lazy chunks across Project Tracker (7 pages) and Data Management (12 pages).
- refactor: modularize monolithic `types.ts` into domain type files (`src/types/`) and remove legacy `types.ts` shim.
- refactor: modularize monolithic 2,300-line `src/queries/index.ts` into 12 domain query modules (`src/queries/`) with barrel re-exports.
- feat: introduce `useTablePreferences(tableKey)` hook in `preferences.queries.ts` for reactive per-table preferences without prop-drilling.
- feat: introduce `ProjectModalContext` (`useProjectModal()`) decoupling project view, edit, new, and diff modal orchestration from `App.tsx`.
- refactor: extract dialog modals into domain component folders (`components/client/`, `components/user/`, `components/service/`, `components/providedService/`, `components/permit/`, `components/reminder/`, `components/company/`, `components/waste/`) and delete legacy `components/dialogs/` directory.
- refactor: completely remove legacy `src/pages/management/` and `src/pages/tracker/` backward-compatibility adapter directories.
- refactor: extract inline modals from pages into dedicated domain component folders (`ClientModal`, `UserModal`, `ServiceModal`, `ProvidedServiceModal`).
- refactor: reorganize components by domain (`project/`, `invoice/`, `permit/`, `reminder/`, `service/`, `providedService/`, `user/`, `role/`, `company/`, `statistics/`, `common/dialogs/`).
- refactor: extract centralized route declarations into `src/routes/AppRoutes.tsx` and slim down `src/App.tsx` from 366 lines to ~65 lines.
- docs: comprehensive documentation overhaul across `client/docs/AI_CONTEXT.md`, `client/docs/ARCHITECTURE.md`, `client/README.md`, and `CHANGELOG.md`.

## [v1.10.1] - 2026-10-20

- perf: increase polling and flush intervals to 60 seconds to reduce ne… (#84) by @zigikralj

## [v1.10.0] - 2026-10-19

- feat: enhance RichTextEditor with autosave, multi-mode view, and form… (#82) by @zigikralj

## [v1.9.0] - 2026-10-18

- feat: add comprehensive activity analytics page with charts, insights… (#80) by @zigikralj

## [v1.8.4] - 2026-10-16

- Activity log improvement (#78) by @zigikralj

## [v1.8.3] - 2026-10-11

- refactor: redesign permits and reminders modals with improved layout … (#76) by @zigikralj

## [v1.8.2] - 2026-10-11

- ci: skip security and playwright workflows for release branches and p… (#74) by @zigikralj

## [v1.8.1] - 2026-10-10

- ci: remove push trigger and restrict pull request branches to main in… (#72) by @zigikralj

## [v1.8.0] - 2026-10-10

- feat: add GitHub Actions workflow for running Playwright E2E tests (#70) by @zigikralj

## [v1.7.3] - 2026-10-10

- Testing (#68) by @zigikralj

## [v1.7.2] - 2026-10-07

- refactor: update permits filtering layout and add table header filter… (#66) by @zigikralj

## [v1.7.1] - 2026-10-07

- Roles bugfixing (#64) by @zigikralj

## [v1.7.0] - 2026-10-07

- feat: add activity logs page and tracking functionality (#62) by @zigikralj

## [v1.6.0] - 2026-10-01

- feat: add utilities for detecting and extracting waste weights in cus… (#60) by @zigikralj

## [v1.5.0] - 2026-10-01

- feat: add waste catalog autocomplete and linked list filtering suppor… (#58) by @zigikralj

## [v1.4.0] - 2026-09-30

- feat: add restriction support for viewing and editing own reminders (#56) by @zigikralj

## [v1.3.8] - 2026-09-22

- refactor: centralize admin check in hasPermission to simplify permiss… (#54) by @zigikralj

## [v1.3.7] - 2026-09-22

- refactor: replace coarse-grained permission checks with granular crea… (#52) by @zigikralj

## [v1.3.6] - 2026-09-22

- refactor: update confirm dialogs to use specific delete titles and la… (#50) by @zigikralj

## [v1.3.5] - 2026-09-22

- refactor: update authentication context, role modal, and sidebar comp… (#48) by @zigikralj

## [v1.3.4] - 2026-09-20

- Dynamic roles (#46) by @zigikralj

## [v1.3.3] - 2026-09-19

- Dynamic roles (#44) by @zigikralj

## [v1.3.2] - 2026-09-19

- Dynamic roles (#42) by @zigikralj

## [v1.3.1] - 2026-09-16

- fix: harden client-permit resolution and synchronization across manag… (#40) by @zigikralj

## [v1.3.0] - 2026-09-16

- feat: support multiple permit selection for clients and add related v… (#38) by @zigikralj

## [v1.2.0] - 2026-09-15

- feat: add permit types support with filtering, sorting, and localization (#36) by @zigikralj

## [v1.1.4] - 2026-09-15

- fix: correct case of GitHub Pages base path and routes to EGG_admin_c… (#34) by @zigikralj

## [v1.1.3] - 2026-09-15

- refactor: replace custom data hooks with React Query queries and muta… (#32) by @zigikralj

## [v1.1.2] - 2026-09-13

- refactor: update version bump workflow to create release pull requests (#30) by @zigikralj

## [v1.1.1] - 2026-09-13

- feat: react router

## [v1.1.0] - 2026-09-13

- feat: layout changes

## [v1.0.4] - 2026-09-09

- refactor: update version resolution logic and enhance automated PR br… (#27) by @zigikralj

## [v1.0.3] - 2026-09-08

- Permits (#25) by @zigikralj

## [v1.0.2] - 2026-09-02

- waste management (#24) by @zigikralj

## [v1.0.1] - 2026-09-02

- Versioning (#23) by @zigikralj

## [v1.0.0] - 2026-09-02

- Initial baseline release with automatic version detection, update prompt, and PR-driven release workflows.
