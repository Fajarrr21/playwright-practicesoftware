import { test, expect } from '../support/fixtures';

test.describe('Catalog: search & sort', () => {
  test.beforeEach(async ({ home }) => home.goto());

  test('search shows only matching products', async ({ home }) => {
    await home.search('pliers');
    await expect(home.searchTerm).toHaveText('pliers');
    const names = await home.names();
    expect(names.length).toBeGreaterThan(0);
    for (const n of names) expect(n.toLowerCase()).toContain('pliers');
  });

  test('search with no match shows an empty state', async ({ home }) => {
    await home.search('zzz-no-such-tool');
    await expect(home.noResults).toHaveText('There are no products found.');
    await expect(home.productNames).toHaveCount(0);
  });

  test('sort by price low to high', async ({ home }) => {
    await home.sortBy('price,asc');
    const prices = await home.prices();
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('sort by price high to low', async ({ home }) => {
    await home.sortBy('price,desc');
    const prices = await home.prices();
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  test('sort by name Z to A', async ({ home }) => {
    await home.sortBy('name,desc');
    const names = await home.names();
    expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)));
  });

  test('UI search matches the API result', async ({ home, api }) => {
    const { data } = await (await api.get('/products/search?q=hammer')).json();
    await home.search('hammer');
    expect((await home.names()).sort()).toEqual(data.map((p: { name: string }) => p.name).slice(0, 9).sort());
  });
});
