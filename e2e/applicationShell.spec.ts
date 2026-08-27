import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { monitorBrowserProblems } from './browserProblems'

const publicRoutes = [
  { heading: 'Catalog', path: '/' },
  { heading: 'Product detail', path: '/products/shell-product' },
  { heading: 'Cart', path: '/cart' },
] as const

test('public routes and header navigation work cleanly @smoke', async ({
  page,
}) => {
  const browserProblems = monitorBrowserProblems(page)

  await page.route('**/products', (route) =>
    route.fulfill({ json: [], status: 200 }),
  )

  for (const route of publicRoutes) {
    await page.goto(route.path)
    await expect(
      page.getByRole('heading', { level: 1, name: route.heading }),
    ).toBeVisible()

    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    expect(
      accessibility.violations,
      JSON.stringify(accessibility.violations, null, 2),
    ).toEqual([])
  }

  await page.goto('/')
  await page.getByRole('link', { name: 'Cart, 0 items' }).click()
  await expect(page).toHaveURL(/\/cart$/)

  await page.getByRole('link', { name: 'MBST home' }).click()
  await expect(page).toHaveURL(/\/$/)

  await page.goto('/')
  await page.keyboard.press('Tab')
  const skipLink = page.getByRole('link', { name: 'Skip to content' })
  await expect(skipLink).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()

  expect(browserProblems, browserProblems.join('\n')).toEqual([])
})
