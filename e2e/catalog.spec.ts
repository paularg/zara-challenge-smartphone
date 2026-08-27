import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { monitorBrowserProblems } from './browserProblems'

const productsEndpoint = '**/products'

const productPayload = (id: number) => ({
  id: `product-${id}`,
  brand: `Brand ${id}`,
  name: `Product ${id}`,
  basePrice: id * 100,
  imageUrl: `http://images.test/product-${id}.svg`,
})

const uniqueProducts = Array.from({ length: 20 }, (_, index) =>
  productPayload(index + 1),
)

const mockProductImages = async (page: Page) => {
  await page.route('https://images.test/**', (route) =>
    route.fulfill({
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="240"><rect width="180" height="240" fill="#cccccc" /></svg>',
      contentType: 'image/svg+xml',
      status: 200,
    }),
  )
}

test('catalog loads 20 Products in the reference grid and opens matching details @critical', async ({
  page,
}) => {
  const browserProblems = monitorBrowserProblems(page)
  let requestApiKey: string | undefined
  let releaseProducts: (() => void) | undefined
  const productsReleased = new Promise<void>((resolve) => {
    releaseProducts = resolve
  })

  await mockProductImages(page)
  await page.route(productsEndpoint, async (route) => {
    requestApiKey = route.request().headers()['x-api-key']
    await productsReleased
    await route.fulfill({ json: uniqueProducts, status: 200 })
  })

  await page.goto('/')
  await expect(page.getByRole('status')).toHaveText('Loading Products')

  releaseProducts?.()

  await expect(page.getByText('20 Results')).toBeVisible()
  const cards = page.getByRole('listitem')
  await expect(cards).toHaveCount(20)
  await expect(
    cards.first().getByRole('img', { name: 'Brand 1 Product 1' }),
  ).toBeVisible()
  await expect(cards.first()).toContainText('100 EUR')
  expect(requestApiKey).toBe('e2e-key')

  const cardBoxes = await cards.evaluateAll((elements) =>
    elements.slice(0, 5).map((element) => {
      const box = element.getBoundingClientRect()
      return {
        height: Math.round(box.height),
        width: Math.round(box.width),
        x: Math.round(box.x),
      }
    }),
  )
  const viewportWidth = page.viewportSize()?.width

  if (viewportWidth === 393) {
    expect(cardBoxes[0]).toEqual({ height: 344, width: 361, x: 16 })
    expect(new Set(cardBoxes.map(({ x }) => x)).size).toBe(1)
  } else if (viewportWidth === 768) {
    expect(cardBoxes[0]).toEqual({ height: 344, width: 344, x: 40 })
    expect(new Set(cardBoxes.map(({ x }) => x)).size).toBe(2)
  } else if (viewportWidth === 834) {
    expect(cardBoxes[0]).toEqual({ height: 377, width: 377, x: 40 })
    expect(new Set(cardBoxes.map(({ x }) => x)).size).toBe(2)
  } else if (viewportWidth === 1280) {
    expect(cardBoxes[0]).toEqual({ height: 360, width: 360, x: 100 })
    expect(new Set(cardBoxes.map(({ x }) => x)).size).toBe(3)
  } else {
    expect(cardBoxes[0]).toEqual({ height: 344, width: 344, x: 100 })
    expect(new Set(cardBoxes.map(({ x }) => x)).size).toBe(5)
  }

  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze()
  expect(
    accessibility.violations,
    JSON.stringify(accessibility.violations, null, 2),
  ).toEqual([])

  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('link', { name: 'Skip to content' }),
  ).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'MBST home' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Cart, 0 items' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(
    cards.first().getByRole('link', { name: 'Open Brand 1 Product 1' }),
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/products\/product-1$/)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Product detail' }),
  ).toBeVisible()

  expect(browserProblems, browserProblems.join('\n')).toEqual([])
})

test('catalog recovers from an invalid payload through retry @critical', async ({
  page,
}) => {
  const browserProblems = monitorBrowserProblems(page)
  let requestCount = 0

  await mockProductImages(page)
  await page.route(productsEndpoint, (route) => {
    requestCount += 1
    return route.fulfill({
      json: requestCount === 1 ? { unexpected: true } : [productPayload(2)],
      status: 200,
    })
  })

  await page.goto('/')

  await expect(page.getByRole('alert')).toContainText(
    'The Product catalog response is invalid.',
  )
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Retry' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByText('Product 2')).toBeVisible()
  expect(requestCount).toBe(2)
  expect(browserProblems, browserProblems.join('\n')).toEqual([])
})
