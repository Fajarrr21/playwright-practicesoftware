import { test, expect } from '../support/fixtures';
import { newUser } from '../support/data';

test.describe('Users API', () => {
  test('register returns 201 and never echoes the password', async ({ api }) => {
    const data = newUser();
    const res = await api.post('/users/register', { data });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({ email: data.email, first_name: data.first_name, id: expect.any(String) });
    expect(body).not.toHaveProperty('password');
  });

  test('register with an existing email returns 409', async ({ api, user }) => {
    const res = await api.post('/users/register', { data: { ...newUser(), email: user.email } });
    expect(res.status()).toBe(409);
    expect((await res.json()).email[0]).toMatch(/already exists/);
  });

  test('register with missing fields returns 422 with field errors', async ({ api }) => {
    const res = await api.post('/users/register', { data: {} });
    expect(res.status()).toBe(422);
    const body = await res.json();
    for (const field of ['first_name', 'last_name', 'email', 'password']) expect(body, field).toHaveProperty(field);
  });

  for (const email of ['not-an-email', 'a@b', 'x@@example.com']) {
    test(`register rejects invalid email "${email}"`, async ({ api }) => {
      test.fail(true, 'BUG-01: API accepts malformed emails (201). Only the UI validates the format.');
      test.info().annotations.push({ type: 'bug', description: 'BUG-01, see BUGS.md' });
      // Unique prefix so a 409 "already exists" can never mask the real result.
      const res = await api.post('/users/register', { data: { ...newUser(), email: `${Date.now()}${email}` } });
      expect(res.status()).toBe(422);
    });
  }

  test('login returns a bearer JWT', async ({ api, user }) => {
    const res = await api.post('/users/login', { data: { email: user.email, password: user.password } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.token_type).toBe('bearer');
    expect(body.access_token.split('.')).toHaveLength(3);
  });

  test('login with wrong password returns 401', async ({ api, user }) => {
    const res = await api.post('/users/login', { data: { email: user.email, password: 'wrong-password' } });
    expect(res.status()).toBe(401);
  });

  test('/users/me requires a token', async ({ api }) => {
    expect((await api.get('/users/me')).status()).toBe(401);
  });

  test('/users/me returns the logged-in user', async ({ api, user }) => {
    const res = await api.get('/users/me', { headers: { Authorization: `Bearer ${user.token}` } });
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ id: user.id, email: user.email });
  });

  test('a new user has no invoices', async ({ api, user }) => {
    const res = await api.get('/invoices', { headers: { Authorization: `Bearer ${user.token}` } });
    expect(res.status()).toBe(200);
    expect((await res.json()).total).toBe(0);
  });
});
