import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function search(page: Page, query: string) {
  await page.getByRole('textbox').fill(query);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
}

test('search, pagination, reset, cache, empty results and modal lifecycle', async ({ page }) => {
  const requests: string[] = [];
  const consoleIssues: string[] = [];
  page.on('pageerror', (error) => consoleIssues.push(error.message));
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) consoleIssues.push(message.text());
  });
  await page.route('https://api.themoviedb.org/3/search/movie**', async (route) => {
    const url = new URL(route.request().url());
    const query = url.searchParams.get('query');
    const currentPage = Number(url.searchParams.get('page'));
    requests.push(query + ':' + currentPage);
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.fulfill({
      json: {
        page: currentPage,
        total_pages: query === 'nothing' ? 0 : query === 'single' ? 1 : 7,
        total_results: query === 'nothing' ? 0 : 140,
        results:
          query === 'nothing'
            ? []
            : [
                {
                  id: currentPage,
                  title: query + ' page ' + currentPage,
                  overview: 'Movie overview',
                  poster_path: null,
                  backdrop_path: null,
                  release_date: '2026-01-01',
                  vote_average: 8,
                },
              ],
      },
    });
  });
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveCount(0);
  expect(requests).toEqual([]);
  await search(page, '   ');
  await expect(page.getByText('Please enter your search query.')).toBeVisible();
  expect(requests).toEqual([]);

  await search(page, 'Batman');
  await expect(page.getByText('Loading movies, please wait...')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Batman page 1' })).toBeVisible();
  await page.getByRole('button', { name: 'Page 2', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Batman page 2' })).toBeVisible();
  await page.getByRole('button', { name: 'Page 3', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Batman page 3' })).toBeVisible();
  await page.getByRole('button', { name: 'Page 1', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Batman page 1' })).toBeVisible();
  expect(requests).toEqual(['Batman:1', 'Batman:2', 'Batman:3']);
  await page.getByRole('button', { name: 'Page 3', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Batman page 3' })).toBeVisible();
  await search(page, 'Spider-Man');
  await expect(page.getByRole('heading', { name: 'Spider-Man page 1' })).toBeVisible();
  await expect(page.locator('[aria-current="page"]')).toHaveText('1');
  expect(requests.at(-1)).toBe('Spider-Man:1');

  for (const method of ['button', 'escape', 'backdrop']) {
    await page.getByRole('button', { name: 'Show details for Spider-Man page 1' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate((element) => element.parentElement === document.body)).toBe(true);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    await dialog.getByRole('heading').click();
    await expect(dialog).toBeVisible();
    if (method === 'button') await page.getByRole('button', { name: 'Close modal' }).click();
    if (method === 'escape') await page.keyboard.press('Escape');
    if (method === 'backdrop') await dialog.click({ position: { x: 5, y: 5 } });
    await expect(dialog).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  }
  await search(page, 'nothing');
  await expect(page.getByText('No movies found for your request.')).toBeVisible();
  await expect(page.locator('[aria-current="page"]')).toHaveCount(0);
  await expect(page.getByRole('heading')).toHaveCount(0);
  await search(page, 'single');
  await expect(page.getByRole('heading', { name: 'single page 1' })).toBeVisible();
  await expect(page.locator('[aria-current="page"]')).toHaveCount(0);
  expect(consoleIssues).toEqual([]);
});

test('HTTP error renders ErrorMessage and the next search recovers', async ({ page }) => {
  await page.route('https://api.themoviedb.org/3/search/movie**', async (route) => {
    const query = new URL(route.request().url()).searchParams.get('query');
    if (query === 'failure') {
      await route.fulfill({ status: 500, json: { status_message: 'Test failure' } });
    } else {
      await route.fulfill({
        json: {
          page: 1,
          total_pages: 1,
          total_results: 1,
          results: [
            {
              id: 1,
              title: 'Recovered',
              overview: '',
              poster_path: null,
              backdrop_path: null,
              release_date: '',
              vote_average: 0,
            },
          ],
        },
      });
    }
  });
  await page.goto('/');
  await search(page, 'failure');
  await expect(page.getByRole('alert')).toHaveText('There was an error, please try again...');
  await expect(page.getByText('Loading movies, please wait...')).toHaveCount(0);
  await expect(page.getByRole('heading')).toHaveCount(0);
  await search(page, 'recovery');
  await expect(page.getByRole('heading', { name: 'Recovered' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('real TMDB search and page navigation', async ({ page }) => {
  test.skip(!process.env.LIVE_TMDB, 'Enable explicitly to test the real API.');
  const issues: string[] = [];
  page.on('pageerror', (error) => issues.push(error.message));
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) issues.push(message.text());
  });
  await page.goto('/');
  for (const query of ['Batman', 'Spider-Man']) {
    const response = page.waitForResponse(
      (res) => res.url().includes('/search/movie') && res.url().includes('page=1'),
    );
    await search(page, query);
    expect((await response).status()).toBe(200);
    await expect(page.getByRole('heading').first()).toBeVisible();
    for (const number of [2, 3, 1]) {
      await page.getByRole('button', { name: 'Page ' + number, exact: true }).click();
      await expect(page.locator('[aria-current="page"]')).toHaveText(String(number));
      await expect(page.getByRole('heading').first()).toBeVisible();
    }
    await page.getByRole('button', { name: 'Page 2', exact: true }).click();
    await expect(page.locator('[aria-current="page"]')).toHaveText('2');
  }
  await page
    .getByRole('button', { name: /^Show details for/ })
    .first()
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(issues).toEqual([]);
});
