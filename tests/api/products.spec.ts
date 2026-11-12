import { test, expect } from '../support/fixtures';

test.describe('Products API', () => {
  test('list is paginated with 9 items per page', async ({ api }) => {
    const res = await api.get('/products?page=1');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ current_page: 1, per_page: 9, from: 1 });
    expect(body.data).toHaveLength(9);
    expect(body.total).toBeGreaterThan(9);
    expect(body.last_page).toBe(Math.ceil(body.total / body.per_page));
  });

  test('every product matches the response contract', async ({ api }) => {
    const { data } = await (await api.get('/products?page=1')).json();
    for (const p of data) {
      expect(p, `product ${p.id}`).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          description: expect.any(String),
          price: expect.any(Number),
          is_rental: expect.any(Boolean),
          in_stock: expect.any(Boolean),
          category: expect.objectContaining({ id: expect.any(String), name: expect.any(String) }),
          brand: expect.objectContaining({ id: expect.any(String), name: expect.any(String) }),
        }),
      );
      expect(p.price).toBeGreaterThan(0);
    }
  });

  test('get by id returns the same product as the list', async ({ api }) => {
    const first = (await (await api.get('/products?page=1')).json()).data[0];
    const res = await api.get(`/products/${first.id}`);
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ id: first.id, name: first.name, price: first.price });
  });

  test('unknown product id returns 404', async ({ api }) => {
    const res = await api.get('/products/does-not-exist');
    expect(res.status()).toBe(404);
    expect(await res.json()).toEqual({ message: 'Requested item not found' });
  });

  test('search only returns products matching the query', async ({ api }) => {
    const { data } = await (await api.get('/products/search?q=pliers')).json();
    expect(data.length).toBeGreaterThan(0);
    for (const p of data) expect(p.name.toLowerCase()).toContain('pliers');
  });

  test('search with no match returns an empty page', async ({ api }) => {
    const body = await (await api.get('/products/search?q=zzz-no-such-tool')).json();
    expect(body.data).toEqual([]);
    expect(body.total).toBe(0);
  });

  for (const dir of ['asc', 'desc'] as const) {
    test(`sort by price ${dir}`, async ({ api }) => {
      const { data } = await (await api.get(`/products?sort=price,${dir}`)).json();
      const prices: number[] = data.map((p: { price: number }) => p.price);
      const sorted = [...prices].sort((a, b) => (dir === 'asc' ? a - b : b - a));
      expect(prices).toEqual(sorted);
    });
  }

  test('category tree has parents with sub-categories', async ({ api }) => {
    const tree = await (await api.get('/categories/tree')).json();
    const handTools = tree.find((c: { slug: string }) => c.slug === 'hand-tools');
    expect(handTools.parent_id).toBeNull();
    expect(handTools.sub_categories.map((c: { slug: string }) => c.slug)).toContain('hammer');
  });
});
