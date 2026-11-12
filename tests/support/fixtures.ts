import { test as base, expect, request, type APIRequestContext, type Page } from '@playwright/test';
import { API_URL } from './env';
import { newUser, type NewUser } from './data';
import { HomePage } from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';
import { LoginPage } from '../pages/LoginPage';
import { CheckoutPage } from '../pages/CheckoutPage';

type User = NewUser & { id: string; token: string };

type Fixtures = {
  api: APIRequestContext;
  user: User;
  /** Page already logged in as `user` (token injected, no UI login). */
  authedPage: Page;
  home: HomePage;
  product: ProductPage;
  login: LoginPage;
  checkout: CheckoutPage;
};

export const test = base.extend<Fixtures>({
  api: async ({}, use) => {
    const ctx = await request.newContext({ baseURL: API_URL });
    await use(ctx);
    await ctx.dispose();
  },

  user: async ({ api }, use) => {
    const data = newUser();
    const reg = await api.post('/users/register', { data });
    expect(reg.status(), await reg.text()).toBe(201);
    const login = await api.post('/users/login', { data: { email: data.email, password: data.password } });
    expect(login.status(), await login.text()).toBe(200);
    // Not cleaned up: deleting users needs an admin token, and the demo DB resets on its own.
    await use({ ...data, id: (await reg.json()).id, token: (await login.json()).access_token });
  },

  authedPage: async ({ page, user }, use) => {
    // Seed the token once per tab; re-seeding on every navigation would undo a logout.
    await page.addInitScript((token) => {
      if (sessionStorage.getItem('seeded')) return;
      localStorage.setItem('auth-token', token);
      sessionStorage.setItem('seeded', '1');
    }, user.token);
    await use(page);
  },

  home: async ({ page }, use) => use(new HomePage(page)),
  product: async ({ page }, use) => use(new ProductPage(page)),
  login: async ({ page }, use) => use(new LoginPage(page)),
  checkout: async ({ page }, use) => use(new CheckoutPage(page)),
});

export { expect };
