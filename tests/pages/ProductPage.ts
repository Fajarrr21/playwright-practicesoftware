import { expect, type Page } from '@playwright/test';
import { money } from '../support/data';

export class ProductPage {
  readonly name;
  readonly unitPrice;
  readonly quantity;
  readonly addToCartButton;
  readonly cartQuantity;

  constructor(private readonly page: Page) {
    this.name = page.getByTestId('product-name');
    this.unitPrice = page.getByTestId('unit-price');
    this.quantity = page.getByTestId('quantity');
    this.addToCartButton = page.getByTestId('add-to-cart');
    this.cartQuantity = page.getByTestId('cart-quantity');
  }

  async goto(productId: string) {
    await this.page.goto(`/product/${productId}`);
    await expect(this.addToCartButton).toBeVisible();
  }

  async price() {
    return money(await this.unitPrice.innerText());
  }

  async addToCart(qty = 1) {
    await this.quantity.fill(String(qty));
    await this.addToCartButton.click();
    await expect(this.page.getByRole('alert')).toContainText(/added to shopping cart/i);
  }

  async openCart() {
    await this.page.getByTestId('nav-cart').click();
    await expect(this.page).toHaveURL(/\/checkout/);
    await expect(this.page.getByTestId('product-title').first()).toBeVisible();
  }
}
