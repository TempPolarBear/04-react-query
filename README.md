# 04-react-query

GoIT movie search homework: Vite 8, React, TypeScript, Axios, TanStack Query, and React Paginate.

## Run locally

1. Run `npm ci`.
2. Copy `.env.example` to `.env` and use your existing TMDB read access token as `TMDB_TOKEN`.
3. Run `npm run dev`.

Vite exposes `TMDB_TOKEN` through the existing `envPrefix` configuration. The local environment file is ignored by Git.

## Behavior

- Search starts only after submitting a nonempty query.
- `useQuery` in `App` owns the response, loading/error state, caching, and cancellation.
- The query key is `['movies', query, page]`; new searches reset the page to 1.
- Axios sends both `query` and `page` to TMDB.
- React Paginate uses controlled `forcePage` and only appears for multiple pages.
- Pagination is capped at TMDB's supported maximum of 500 pages.
- The movie modal uses a portal, closes with its button, Escape, or backdrop, and restores body scrolling on cleanup.
- Empty input/results produce toast notifications; failed requests show an error message.

## Checks

```sh
npm run lint
npm run build
npm run format:check
git diff --check
npx playwright install chromium
npm run test:e2e
```

The browser tests run against the production build served by Vite preview. They cover initial/loading/success/empty/error states, pagination, caching, page reset, recovery after HTTP errors, and modal lifecycle. Set `LIVE_TMDB=1` to include real TMDB requests. Set `APP_URL` to test a deployed application instead of local preview.

## Vercel

Import this repository as a Vite project. Use `npm run build` and the `dist` output directory. Configure the existing `TMDB_TOKEN` for **Production** and **Preview**, then deploy. No build-time environment guard is required.

Repository: https://github.com/TempPolarBear/04-react-query
