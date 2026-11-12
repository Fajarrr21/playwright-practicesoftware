import { expect, type Page } from '@playwright/test';
import { money } from '../support/data';

export type PaymentMethod = 'bank-transfer' | 'cash-on-delivery' | 'credit-card' | 'buy-now-pay-later' | 'gift-card';

export class CheckoutPage {
  readonly productTitles;
  readonly cartTotal;
  readonly paymentSuccess;

  constructor(private readonly page: Page) {
    this.productTitles = page.getByTestId('product-title');
    this.cartTotal = page.getByTestId('cart-total');
    this.paymentSuccess = page.getByTestId('payment-success-message');
  }

  async lines() {
    const rows = this.page.locator('tbody tr');
    const out: { title: string; qty: number; price: number; lineTotal: number }[] = [];
    for (const row of await rows.all()) {
      out.push({
        title: (await row.getByTestId('product-title').innerText()).trim(),
        qty: Number(await row.getByTestId('product-quantity').inputValue()),
        price: money(await row.getByTestId('product-price').innerText()),
        lineTotal: money(await row.getByTestId('line-price').innerText()),
      });
    }
    return out;
  }

  async total() {
    return money(await this.cartTotal.innerText());
  }

  /** Steps 1-4 for an already logged-in user. Returns the invoice number. */
  async placeOrder(method: PaymentMethod, details: Record<string, string> = {}) {
    await this.page.getByTestId('proceed-1').click();
    await this.page.getByTestId('proceed-2').click();
    // Registered address has no house number, which the billing step requires.
    const house = this.page.getByTestId('house_number');
    if (!(await house.inputValue())) await house.fill('10');
    await this.page.getByTestId('proceed-3').click();

    await this.page.getByTestId('payment-method').selectOption(method);
    for (const [field, value] of Object.entries(details)) await this.page.getByTestId(field).fill(value);
    await this.page.getByTestId('finish').click();
    await expect(this.paymentSuccess).toHaveText(/Payment was successful/);
    await this.page.getByTestId('finish').click();

    const confirmation = this.page.getByText(/Your invoice number is/);
    await expect(confirmation).toBeVisible();
    return (await confirmation.innerText()).match(/INV-\d+/)![0];
  }
}
