export const PASSWORD = 'Str0ng!Pass#2026';

// Shared demo accounts get locked by other users, so every test registers its own user.
export function newUser() {
  const id = `${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
  return {
    first_name: 'Play',
    last_name: 'Wright',
    address: { street: 'Jl Test 1', city: 'Bandung', state: 'Jawa Barat', country: 'ID', postal_code: '40111' },
    phone: '081234567890',
    dob: '1995-01-01',
    password: PASSWORD,
    email: `pw.${id}@example.com`,
  };
}

export type NewUser = ReturnType<typeof newUser>;

/** "$12.50" -> 12.5 */
export const money = (text: string) => Number(text.replace(/[^0-9.]/g, ''));
