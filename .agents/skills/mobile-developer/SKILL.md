---
name: mobile-developer
description: "Build and maintain production-quality React Native mobile features with Expo and TypeScript for this social media project. Use when creating or modifying Expo screens, Expo Router navigation, Expo UI components, React Query data flows, React Hook Form forms, JWT authentication, localization, themes, loading states, error states, accessibility, or responsive mobile UI."
---

# Mobile Developer

## Mission

Implement clear, maintainable, production-quality mobile experiences for the social media application described in `PROJECT_SPEC.md`. Use React Native, Expo, TypeScript, Expo Router, Expo UI, TanStack React Query, React Hook Form, and JWT authentication. Keep the implementation modular, accessible, responsive, localized, theme-aware, and consistent with the existing repository.

## Start Here

1. Read `PROJECT_SPEC.md` and identify the relevant MVP or future-phase requirement.
2. Inspect the current repository before editing. Locate the mobile app directory, routing structure, providers, API client, auth state, theme system, localization setup, shared UI, and test configuration. The repository may not contain a mobile app yet; do not assume a directory name or copy the web architecture blindly.
3. Inspect nearby screens and components before adding new abstractions. Reuse established patterns, naming, tokens, and API contracts.
4. State a short implementation hypothesis and one focused validation check before the first edit.
5. Make the smallest complete change that satisfies the requirement, then run the narrowest relevant validation immediately.

## Architecture Rules

- Use TypeScript with strict, explicit domain types. Avoid `any`, unsafe assertions, duplicated API models, and business logic embedded in presentation components.
- Keep screens responsible for composition and navigation; keep reusable UI in components; keep server state in React Query hooks; keep API calls in the existing client/service layer; keep validation schemas near their forms or in the established validation location.
- Prefer small components with one responsibility. Extract a component when it has independent behavior, repeated markup, or a meaningful domain concept.
- Preserve public APIs and existing conventions unless the requirement requires a migration.
- Use Expo Router file-based routes and the existing route groups, layouts, protected-route logic, and modal or sheet patterns.
- Use Expo UI or the repository's established native component pattern for platform-appropriate controls. Do not add a web-only UI dependency to mobile code.
- Do not introduce a new state-management library when React Query, auth context, route state, or local component state already covers the behavior.

## Data and Authentication

- Use TanStack React Query for all server state: queries for reads, mutations for writes, query keys owned by the relevant feature, and invalidation or direct cache updates after successful mutations.
- Represent loading, empty, error, refreshing, submitting, and retry states explicitly. Avoid blocking the whole screen when only a child request is pending.
- Reuse the existing API client and backend `/api/v1/` contract. Confirm request and response types from the backend before writing mobile code.
- Store JWT credentials only through the repository's secure storage approach. Never log tokens, passwords, or sensitive response data.
- Centralize authenticated request behavior, token expiry handling, logout cleanup, and unauthorized redirects in the existing auth/API boundary.
- Treat mutations as potentially retried or repeated: disable duplicate submission, show progress, and make cache updates consistent with server truth.
- Handle network failures and offline or slow connections gracefully with retry actions and useful, localized messages.

## Forms and Validation

- Use React Hook Form for non-trivial forms and the project's established resolver/schema library for validation.
- Match backend constraints, including registration credentials, post text length, comment length, profile fields, and upload limits from `PROJECT_SPEC.md` and backend validators.
- Show field-level errors near their controls, preserve entered values where safe, focus the first invalid field when supported, and expose submission errors without losing context.
- Use native keyboard, input, focus, keyboard avoidance, and submit behavior appropriate to each platform.

## Navigation and Interaction

- Keep route parameters typed and validate dynamic IDs before making requests.
- Protect authenticated routes at the routing boundary. Redirect unauthenticated users predictably and preserve a safe return destination when the existing architecture supports it.
- Use platform-appropriate back behavior, safe areas, headers, sheets, dialogs, and confirmation flows.
- Preserve scroll position and query state where the product workflow benefits from it.
- Use FlatList or an equivalent virtualized list for feeds, comments, profiles, and admin collections. Configure stable keys, pagination, refresh, and empty states deliberately.
- For destructive actions, require an accessible confirmation and invalidate affected queries after success.

## UI Quality

- Design a simple, polished commercial mobile interface with strong hierarchy through spacing, typography, color, alignment, and content grouping.
- Use the project's theme tokens for light and dark modes. Avoid hard-coded colors that become unreadable in either theme.
- Support English and Myanmar through the existing i18n system. Do not concatenate user-facing strings, and account for Myanmar text length and line wrapping.
- Prefer accessible labels, roles, hints, focus order, sufficient contrast, dynamic text sizing, touch targets, and screen-reader-friendly status updates.
- Use meaningful empty states, skeletons or restrained loading indicators, retry states, and success or failure feedback. Do not make loading or error states look like valid content.
- Keep layouts responsive across small phones, large phones, portrait, landscape where applicable, and keyboard-visible states. Use safe-area insets and avoid fixed dimensions that clip localized text.
- Use motion sparingly for hierarchy and feedback. Respect reduced-motion preferences where the existing stack supports them.
- Reuse existing icons, imagery, buttons, cards, spacing, and typography before introducing new visual primitives.

## Feature Workflow

1. Translate the requirement into a user flow and list its states: initial, loading, success, empty, validation failure, server failure, unauthorized, and retry.
2. Trace the nearest existing implementation for a similar screen or mutation.
3. Confirm the API contract, auth requirement, pagination model, and cache invalidation behavior.
4. Add or update types, API hooks, route screens, and reusable components in that ownership order.
5. Add localization keys and theme-aware styles as part of the feature, not as follow-up cleanup.
6. Add focused tests for important behavior: rendering states, validation, navigation guards, mutation success/error handling, and cache updates where practical.
7. Run the narrowest relevant test, typecheck, lint, or Expo validation. Then run the project-level check when the feature crosses module boundaries.
8. Review the final diff for accidental web-only imports, duplicated logic, untranslated strings, unsafe credential handling, accessibility regressions, and inconsistent loading/error behavior.

## Decision Points

- If the feature is server-backed, use React Query. Use local state only for transient UI state such as an open menu, draft text, or selected tab.
- If a screen is reachable without authentication, keep public content public and gate only the actions that require a session.
- If a request can be canceled or becomes stale during navigation, use the existing query cancellation and lifecycle behavior rather than manual promise flags.
- If a visual pattern already exists, extend it. Create a new component or token only when reuse would make the code less clear or the behavior genuinely differs.
- If the backend does not yet support a requested mobile action, do not fake success. Surface the limitation and identify the required API contract change.
- If the mobile project is absent, first establish the smallest Expo Router structure that matches this skill and `PROJECT_SPEC.md`, then implement the requested vertical slice with the existing backend.

## Completion Criteria

A mobile change is complete when:

- The requested user flow works through the real API contract.
- Types, route boundaries, auth behavior, localization, and theme behavior are consistent with the project.
- Loading, empty, validation, error, retry, and unauthorized states are handled intentionally.
- Forms prevent invalid or duplicate submissions and expose accessible feedback.
- Lists remain usable with pagination or refresh where required.
- Sensitive credentials are protected and never logged.
- Focused tests or checks pass, and any unavailable validation is reported clearly.
- The diff contains no unrelated refactors or generated artifacts.

## Example Requests

- "Add an Expo Router profile screen with paginated posts, light/dark themes, English/Myanmar strings, and React Query loading and empty states."
- "Implement the mobile login and registration flow with React Hook Form, JWT persistence, protected routes, and accessible validation errors."
- "Add pull-to-refresh and optimistic like toggling to the mobile feed while keeping cache data consistent after API errors."
