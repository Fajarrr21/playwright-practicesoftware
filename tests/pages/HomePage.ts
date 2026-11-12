import { expect, type Page } from '@playwright/test';
import { money } from '../support/data';

export class HomePage {
  readonly productCards;
  readonly productNames;
  readonly productPrices;
  readonly searchTerm;
  readonly noResults;
  readonly cartQuantity;

  constructor(private readonly page: Page) {
    this.productCards = page.locator('a.card');
    this.productNames = page.getByTestId('product-name');
    this.productPrices = page.getByTestId('product-price');
    this.searchTerm = page.getByTestId('search-term');
    this.noResults = page.getByTestId('no-results');
    this.cartQuantity = page.getByTestId('cart-quantity');
  }

  async goto() {
    await this.page.goto('/');
    await expect(this.productNames.first()).toBeVisible();
  }

  /**
   * The grid re-renders after the API answers, so wait for that response instead of a timeout.
   * The app sends filters with the HTTP `QUERY` method, so the value can be in the URL or the body.
   */
  private productsResponse(mustContain: string) {
    return this.page.waitForResponse((r) => {
      const req = decodeURIComponent(r.url() + (r.request().postData() ?? ''));
      return r.url().includes('/products') && req.includes(mustContain) && r.ok();
    });
  }

  async search(term: string) {
    await this.page.getByTestId('search-query').fill(term);
    await Promise.all([this.productsResponse(term), this.page.getByTestId('search-submit').click()]);
    await expect(this.page.getByTestId('search_completed')).toBeAttached();
  }

  async sortBy(value: 'name,asc' | 'name,desc' | 'price,asc' | 'price,desc') {
    await Promise.all([this.productsResponse(value), this.page.getByTestId('sort').selectOption(value)]);
    await expect(this.productNames.first()).toBeVisible();
  }

  async names() {
    return (await this.productNames.allTextContents()).map((n) => n.trim());
  }

  async prices() {
    return (await this.productPrices.allTextContents()).map(money);
  }

  async openProduct(name: string) {
    await this.productNames.filter({ hasText: name }).first().click();
  }
}
