import { test, expect } from '../support/fixtures';
import type { APIRequestContext } from '@playwright/test';

async function inStockProduct(api: APIRequestContext) {
  const { data } = await (await api.get('/products?page=1')).json();
  return data.find((p: { in_stock: boolean; is_rental: boolean }) => p.in_stock && !p.is_rental);
}

test.describe('Carts API', () => {
  test('create cart, add item, read it back', async ({ api }) => {
    const product = await inStockProduct(api);

    const created = await api.post('/carts');
    expect(created.status()).toBe(201);
    const { id } = await created.json();

    const add = await api.post(`/carts/${id}`, { data: { product_id: product.id, quantity: 2 } });
    expect(add.status()).toBe(200);

    const cart = await (await api.get(`/carts/${id}`)).json();
    expect(cart.cart_items).toHaveLength(1);
    expect(cart.cart_items[0]).toMatchObject({ product_id: product.id, quantity: 2 });
  });

  test('adding the same product twice increases quantity, not lines', async ({ api }) => {
    const product = await inStockProduct(api);
    const { id } = await (await api.post('/carts')).json();
    await api.post(`/carts/${id}`, { data: { product_id: product.id, quantity: 1 } });
    await api.post(`/carts/${id}`, { data: { product_id: product.id, quantity: 3 } });

    const cart = await (await api.get(`/carts/${id}`)).json();
    expect(cart.cart_items).toHaveLength(1);
    expect(cart.cart_items[0].quantity).toBe(4);
  });

  test('removing an item empties the cart', async ({ api }) => {
    const product = await inStockProduct(api);
    const { id } = await (await api.post('/carts')).json();
    await api.post(`/carts/${id}`, { data: { product_id: product.id, quantity: 1 } });

    const del = await api.delete(`/carts/${id}/product/${product.id}`);
    expect(del.status()).toBe(204);
    expect((await (await api.get(`/carts/${id}`)).json()).cart_items).toEqual([]);
  });

  test('unknown cart returns 404', async ({ api }) => {
    expect((await api.get('/carts/does-not-exist')).status()).toBe(404);
  });
});
