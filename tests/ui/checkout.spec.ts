import { test, expect } from '../support/fixtures';
import type { APIRequestContext } from '@playwright/test';

async function inStockProduct(api: APIRequestContext) {
  const { data } = await (await api.get('/products?page=1')).json();
  return data.find((p: { in_stock: boolean; is_rental: boolean }) => p.in_stock && !p.is_rental) as {
    id: string;
    name: string;
    price: number;
  };
}

test.describe('Cart & checkout', () => {
  test('product page shows the API name and price', async ({ api, product }) => {
    const p = await inStockProduct(api);
    await product.goto(p.id);
    await expect(product.name).toHaveText(p.name);
    expect(await product.price()).toBe(p.price);
  });

  test('cart totals are quantity times price', async ({ api, product, checkout }) => {
    const p = await inStockProduct(api);
    await product.goto(p.id);
    await product.addToCart(3);
    await expect(product.cartQuantity).toHaveText('3');

    await product.openCart();
    const [line] = await checkout.lines();
    expect(line).toMatchObject({ title: p.name, qty: 3, price: p.price });
    expect(line.lineTotal).toBeCloseTo(p.price * 3, 2);
    expect(await checkout.total()).toBeCloseTo(p.price * 3, 2);
  });

  // `authedPage` is requested only so the shared `page` starts logged in.
  test('logged-in user places an order and the invoice exists in the API', async ({ api, user, authedPage: _, product, checkout }) => {
    const p = await inStockProduct(api);
    await product.goto(p.id);
    await product.addToCart(2);
    await product.openCart();
    const uiTotal = await checkout.total();

    const invoiceNumber = await checkout.placeOrder('cash-on-delivery');

    // Cross-check the UI result against the backend.
    const res = await api.get('/invoices', { headers: { Authorization: `Bearer ${user.token}` } });
    const { data } = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({ invoice_number: invoiceNumber, status: 'AWAITING_FULFILLMENT' });
    expect(data[0].invoicelines).toEqual([expect.objectContaining({ product_id: p.id, quantity: 2, unit_price: p.price })]);
    expect(Number(data[0].total)).toBeCloseTo(uiTotal, 2);
  });
});
