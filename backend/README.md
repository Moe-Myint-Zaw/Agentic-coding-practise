# Yaycha Backend

Independent backend application scaffolded from the backend-starter skill for the social media MVP described in the workspace specification.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run test`
- `npm run prisma:generate`
- `npm run prisma:migrate`

## API base

`/api/v1`

## Authentication rate limiting

Authentication requests are limited to 5 attempts per 15 minutes in production. Development and test environments allow 100 attempts by default. Override these values with `AUTH_RATE_LIMIT_MAX` and `AUTH_RATE_LIMIT_WINDOW_MS` when needed.
