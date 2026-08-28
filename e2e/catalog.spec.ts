import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { monitorBrowserProblems } from './browserProblems'

const productsEndpoint = /\/products(?:\?.*)?$/

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

const productDetail = {
  ...productPayload(1),
  description: 'Product 1 description',
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
      imageUrl: 'http://images.test/product-1.svg',
    },
  ],
  storageOptions: [{ capacity: '128 GB', price: 100 }],
  similarProducts: [],
}

const productDetailEndpoint =
  /^https:\/\/prueba-tecnica-api-tienda-moviles\.onrender\.com\/products\/product-1$/

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
  await page.route(productDetailEndpoint, (route) =>
    route.fulfill({ json: productDetail, status: 200 }),
  )
  await page.route(productsEndpoint, async (route) => {
    requestApiKey = route.request().headers()['x-api-key']
    await productsReleased
    await route.fulfill({ json: uniqueProducts, status: 200 })
  })

  await page.goto('/')
  await expect(page.getByRole('status', { name: 'Catalog status' })).toHaveText(
    'Loading Products',
  )

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
    page.getByRole('searchbox', { name: 'Search Products' }),
  ).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(
    cards.first().getByRole('link', { name: 'Open Brand 1 Product 1' }),
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/products\/product-1$/)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Product 1' }),
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
  await expect(
    page.getByRole('searchbox', { name: 'Search Products' }),
  ).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Retry' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByText('Product 2')).toBeVisible()
  expect(requestCount).toBe(2)
  expect(browserProblems, browserProblems.join('\n')).toEqual([])
})

test('search is shareable, refreshable, navigable, and clearable @critical', async ({
  page,
}) => {
  const browserProblems = monitorBrowserProblems(page)
  const apiRequests: URL[] = []
  const samsungProducts = [
    { ...productPayload(101), brand: 'Samsung', name: 'Galaxy S24 Ultra' },
    { ...productPayload(102), brand: 'Samsung', name: 'Galaxy A25 5G' },
  ]
  const appleProducts = [
    { ...productPayload(103), brand: 'Apple', name: 'iPhone 15' },
  ]

  await mockProductImages(page)
  await page.route(productsEndpoint, (route) => {
    const requestUrl = new URL(route.request().url())
    apiRequests.push(requestUrl)
    const search = requestUrl.searchParams.get('search')

    return route.fulfill({
      json:
        search === 'Samsung'
          ? samsungProducts
          : search === 'Apple'
            ? appleProducts
            : uniqueProducts,
      status: 200,
    })
  })

  await page.goto('/?search=Samsung')
  const searchInput = page.getByRole('searchbox', { name: 'Search Products' })

  await expect(searchInput).toHaveValue('Samsung')
  await expect(page.getByText('2 Results')).toBeVisible()
  await expect(page.getByText('Galaxy S24 Ultra')).toBeVisible()
  const clearSearchButton = page.getByRole('button', { name: 'Clear search' })
  expect(await clearSearchButton.boundingBox()).toMatchObject({
    height: 24,
    width: 24,
  })
  expect(await clearSearchButton.locator('img').boundingBox()).toMatchObject({
    height: 20,
    width: 20,
  })
  await searchInput.focus()
  await page.keyboard.press('Tab')
  await expect(clearSearchButton).toBeFocused()

  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze()
  expect(
    accessibility.violations,
    JSON.stringify(accessibility.violations, null, 2),
  ).toEqual([])

  await page.reload()
  await expect(searchInput).toHaveValue('Samsung')
  await expect(page.getByText('2 Results')).toBeVisible()

  await searchInput.fill('Apple')
  await expect(page).toHaveURL(/\?search=Apple$/)
  await expect(page.getByText('1 Result')).toBeVisible()
  await expect(page.getByText('iPhone 15')).toBeVisible()

  await page.goBack()
  await expect(page).toHaveURL(/\?search=Samsung$/)
  await expect(searchInput).toHaveValue('Samsung')
  await expect(page.getByText('2 Results')).toBeVisible()

  await page.goForward()
  await expect(page).toHaveURL(/\?search=Apple$/)
  await expect(searchInput).toHaveValue('Apple')
  await expect(page.getByText('1 Result')).toBeVisible()

  await page.getByRole('button', { name: 'Clear search' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(searchInput).toBeFocused()
  await expect(searchInput).toHaveValue('')
  await expect(page.getByText('20 Results')).toBeVisible()

  expect(
    apiRequests.every(
      (requestUrl) =>
        !requestUrl.searchParams.has('offset') &&
        (!requestUrl.searchParams.has('search') ||
          !requestUrl.searchParams.has('limit')),
    ),
  ).toBe(true)
  expect(
    apiRequests.map((requestUrl) => requestUrl.searchParams.get('search')),
  ).toEqual(['Samsung', 'Samsung', 'Apple', 'Samsung', 'Apple', null])
  expect(browserProblems, browserProblems.join('\n')).toEqual([])
})
