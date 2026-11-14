import { test, expect } from '../support/fixtures';

test.describe('Authentication', () => {
  test('user can log in and sees their account', async ({ page, login, user }) => {
    await login.goto();
    await login.login(user.email, user.password);
    await expect(page.getByTestId('page-title')).toHaveText('My account');
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByTestId('nav-menu')).toContainText(`${user.first_name} ${user.last_name}`);
  });

  test('wrong password shows a generic error', async ({ page, login, user }) => {
    await login.goto();
    await login.login(user.email, 'wrong-password');
    await expect(login.loginError).toHaveText('Invalid email or password');
    await expect(page).toHaveURL(/\/auth\/login$/);
  });

  test('client-side validation blocks bad input', async ({ login }) => {
    await login.goto();
    await login.login('not-an-email', '');
    await expect(login.emailError).toHaveText('Email format is invalid');
    await expect(login.passwordError).toHaveText('Password is required');
  });

  test('API token injection skips the login form', async ({ authedPage, user }) => {
    await authedPage.goto('/account');
    await expect(authedPage.getByTestId('nav-menu')).toContainText(user.first_name);
  });

  test('sign out returns to the login page', async ({ authedPage }) => {
    await authedPage.goto('/account');
    await authedPage.getByTestId('nav-menu').click();
    await authedPage.getByTestId('nav-sign-out').click();
    // Wait on an element first: URL assertions don't trigger the bot-check handler in fixtures.ts.
    await expect(authedPage.getByTestId('login-submit')).toBeVisible();
    await expect(authedPage).toHaveURL(/\/auth\/login$/);
  });
});
