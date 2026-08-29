import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import {
  expectNoHorizontalPageOverflow,
  monitorBrowserProblems,
  pressNextTabStop,
} from './browserProblems'

const publicRoutes = [
  { heading: 'Catalog', path: '/' },
  { heading: 'Shell Product', path: '/products/shell-product' },
  { heading: 'Cart (0)', path: '/cart' },
] as const

const productsEndpoint =
  /^https:\/\/prueba-tecnica-api-tienda-moviles\.onrender\.com\/products$/
const shellProductEndpoint =
  /^https:\/\/prueba-tecnica-api-tienda-moviles\.onrender\.com\/products\/shell-product$/

const shellProduct = {
  id: 'shell-product',
  brand: 'Shell Brand',
  name: 'Shell Product',
  description: 'Shell description',
  basePrice: 100,
  specs: {
    screen: 'Screen',
    resolution: 'Resolution',
    processor: 'Processor',
    mainCamera: 'Main camera',
    selfieCamera: 'Selfie camera',
    battery: 'Battery',
    os: 'OS',
    screenRefreshRate: 'Refresh rate',
  },
  colorOptions: [
    {
      name: 'Black',
      hexCode: '#000000',
      imageUrl: 'https://images.test/shell-product.svg',
    },
  ],
  storageOptions: [{ capacity: '128 GB', price: 100 }],
  similarProducts: [],
}

test('public routes and header navigation work cleanly @smoke', async ({
  page,
}) => {
  const browserProblems = monitorBrowserProblems(page)

  await page.route(productsEndpoint, (route) =>
    route.fulfill({ json: [], status: 200 }),
  )
  await page.route(shellProductEndpoint, (route) =>
    route.fulfill({ json: shellProduct, status: 200 }),
  )
  await page.route('https://images.test/**', (route) =>
    route.fulfill({
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="260" height="320" />',
      contentType: 'image/svg+xml',
      status: 200,
    }),
  )

  for (const route of publicRoutes) {
    await page.goto(route.path)
    await expect(
      page.getByRole('heading', { level: 1, name: route.heading }),
    ).toBeVisible()

    const homeLink = page.getByRole('link', { name: 'MBST home' })
    const wordmark = homeLink.locator('img')

    await expect(wordmark).toBeVisible()
    await expect(wordmark).toHaveAttribute('height', '24')
    await expect(wordmark).toHaveAttribute('width', '74')
    expect(await wordmark.boundingBox()).toMatchObject({
      height: 24,
      width: 74,
    })
    await expectNoHorizontalPageOverflow(page)

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
  await pressNextTabStop(page)
  const skipLink = page.getByRole('link', { name: 'Skip to content' })
  await expect(skipLink).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()

  expect(browserProblems, browserProblems.join('\n')).toEqual([])
})
