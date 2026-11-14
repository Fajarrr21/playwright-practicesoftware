# playwright-practicesoftware

![Playwright Tests](https://github.com/Fajarrr21/playwright-practicesoftware/actions/workflows/playwright.yml/badge.svg)

Playwright + TypeScript tests for the [Practice Software Testing Toolshop](https://practicesoftwaretesting.com), a demo e-commerce app (Angular frontend, Laravel REST API) made for practicing test automation.

The suite has 42 tests: 24 against the API, 14 UI tests that run on Chromium, Firefox and WebKit, and 4 accessibility scans with axe-core. CI publishes the HTML report to GitHub Pages: https://fajarrr21.github.io/playwright-practicesoftware/

While writing the tests I found one API validation bug and three accessibility issues. They're written up in [BUGS.md](BUGS.md).

## Running

```bash
npm ci
npx playwright install
npm test              # all projects
npm run test:api
npm run test:ui       # chromium only
npm run test:a11y
npm run report
```

To point it at a local copy of the Toolshop:

```bash
BASE_URL=http://localhost:4200 API_URL=http://localhost:8091 npm test
```

## Layout

```
tests/
  api/       products, users, carts
  ui/        login, search/sort, cart and checkout
  a11y/      axe scan per page, with a list of known issues
  pages/     page objects
  support/   fixtures, test data, env
```

## Notes on how it works

**Each test gets its own user.** The `user` fixture registers a fresh account through the API. I started with the shared demo accounts, but other people lock them by failing logins, and then my tests failed for no reason.

**Login without the form.** `authedPage` puts the API token into `localStorage` before the app loads, so most UI tests skip the login screen. Only `auth.spec.ts` goes through the real form. The token is seeded once per tab, otherwise the sign-out test would log itself back in on the next navigation.

**Waiting on the network, not on timers.** There's no `waitForTimeout` anywhere. Search and sort wait for the products response. One catch: the app sends filters with the HTTP `QUERY` method and puts them in the request body, so `HomePage.productsResponse()` checks both the URL and the body.

**Checking the UI against the API.** The checkout test places an order in the browser, then calls `/invoices` and compares the invoice number, line items and total with what the UI showed.

**Known bugs stay in the suite.** BUG-01 is marked `test.fail()`, so the run stays green while the bug exists and goes red when someone fixes it. The accessibility tests ignore known issues only when both the axe rule and the element match, so a new violation still fails.

## Config choices

- The target is a public server other people use, so I keep it at 4 workers locally and 2 per shard in CI.
- Retries only run in CI (2), with a trace on the first retry. Flaky tests show up as flaky in the report.
- Video is off. On my laptop it slowed browser shutdown enough to cause timeouts, and the trace has a screencast anyway.
- On GitHub's runners, Cloudflare sometimes shows a "Verify you are human" page when a test opens `/account`. The auth tests detect that page and skip themselves, so the report shows them as skipped instead of failed. Locally they run normally.
- Test users are never deleted. That needs an admin token, and the demo database resets itself.
