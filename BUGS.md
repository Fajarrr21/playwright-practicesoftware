# Bug Report

Defects found while building this suite against https://practicesoftwaretesting.com (v2.5, Angular 20.0.5), on 2026-11-11.
Each one is covered by a test, so the suite will flag it when it's fixed.

| ID | Severity | Area | Title | Covered by |
|----|----------|------|-------|------------|
| BUG-01 | Major | API `/users/register` | Malformed email addresses are accepted | `tests/api/users.spec.ts` (`test.fail`) |
| A11Y-01 | Critical (axe) | Login, Register | Password show/hide button has no accessible name | `tests/a11y/a11y.spec.ts` (baseline) |
| A11Y-02 | Serious (axe) | Every page | Language button's accessible name doesn't include its visible text | `tests/a11y/a11y.spec.ts` (baseline) |
| A11Y-03 | Serious (axe) | Home filters, Register | `<ul>` has children that aren't `<li>` | `tests/a11y/a11y.spec.ts` (baseline) |

---

## BUG-01: API accepts malformed email addresses on registration

**Severity:** Major. Bad data can enter the user table, and any client that skips UI validation (mobile app, script, integration) can create accounts no email can ever reach.

**Steps**
```bash
curl -X POST https://api.practicesoftwaretesting.com/users/register \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Play","last_name":"Wright","address":{"street":"Jl Test 1","city":"Bandung","state":"Jawa Barat","country":"ID","postal_code":"40111"},"phone":"081234567890","dob":"1995-01-01","password":"Str0ng!Pass#2026","email":"a@b"}'
```

**Expected:** `422` with `{"email": ["The email field must be a valid email address."]}`
**Actual:** `201 Created`. Same result for `not-an-email` and `x@@example.com`.

**Notes:** The login form does validate the format ("Email format is invalid"), so validation exists only on the client.

---

## A11Y-01: Password visibility toggle has no accessible name

**Severity:** Critical (axe `button-name`, WCAG 4.1.2).
**Where:** `/auth/login`, `/auth/register`, element `button.btn-outline-secondary` (the eye icon next to the password field).
**Impact:** Screen readers announce only "button", so users can't tell what it does.
**Fix:** add `aria-label="Show password"` and toggle it to "Hide password", or add `aria-pressed`.

## A11Y-02: Language selector name doesn't match its visible label

**Severity:** Serious (axe `label-content-name-mismatch`, WCAG 2.5.3).
**Where:** every page, `#language` (shows "EN", `aria-label="Select language"`).
**Impact:** Voice-control users who say "click EN" get no match.
**Fix:** include the visible text in the name, e.g. `aria-label="EN - Select language"`.

## A11Y-03: Lists contain non-`<li>` children

**Severity:** Serious (axe `list`, WCAG 1.3.1).
**Where:** home page category filters (`.checkbox > ul`) and the register page password hint (`#passwordHelp > ul`).
**Impact:** Screen readers announce the wrong number of items, or don't treat the group as a list at all.
**Fix:** wrap each child in `<li>`, or use `role="group"` instead of a list.
