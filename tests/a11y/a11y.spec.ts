import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../support/fixtures';

const pages = [
  { name: 'home', path: '/' },
  { name: 'login', path: '/auth/login' },
  { name: 'register', path: '/auth/register' },
  { name: 'contact', path: '/contact' },
];

/**
 * Known, already-reported violations (see BUGS.md). Matched on rule AND element,
 * so the same rule failing on a new element still fails the test.
 */
const KNOWN: { rule: string; target: RegExp; bug: string }[] = [
  { rule: 'button-name', target: /^\.btn-outline-secondary$/, bug: 'A11Y-01' },
  { rule: 'label-content-name-mismatch', target: /^#language$/, bug: 'A11Y-02' },
  { rule: 'list', target: /^(\.checkbox:nth-child\(\d+\) > ul|#passwordHelp > ul)$/, bug: 'A11Y-03' },
];

for (const { name, path } of pages) {
  test(`${name} page has no new critical/serious WCAG 2.1 AA violations`, async ({ page }, testInfo) => {
    await page.goto(path);
    await expect(page.locator('app-root form, [data-test="product-name"]').first()).toBeVisible();

    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    await testInfo.attach('axe-violations.json', {
      body: JSON.stringify(violations, null, 2),
      contentType: 'application/json',
    });

    const found = violations
      .filter((v) => v.impact === 'critical' || v.impact === 'serious')
      .flatMap((v) => v.nodes.map((n) => ({ rule: v.id, impact: v.impact, target: n.target.join(' ') })));

    for (const f of found) {
      const known = KNOWN.find((k) => k.rule === f.rule && k.target.test(f.target));
      if (known) testInfo.annotations.push({ type: 'known a11y bug', description: `${known.bug}: ${f.rule} on ${f.target}` });
    }
    const unknown = found.filter((f) => !KNOWN.some((k) => k.rule === f.rule && k.target.test(f.target)));
    expect(unknown, 'new accessibility violations').toEqual([]);
  });
}
