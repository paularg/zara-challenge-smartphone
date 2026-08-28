import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { monitorBrowserProblems } from './browserProblems'

const catalogEndpoint =
  /^https:\/\/prueba-tecnica-api-tienda-moviles\.onrender\.com\/products(?:\?.*)?$/
const detailEndpoint =
  /^https:\/\/prueba-tecnica-api-tienda-moviles\.onrender\.com\/products\/[^/?]+$/

const productSummary = (
  id: string,
  brand: string,
  name: string,
  basePrice: number,
) => ({
  id,
  brand,
  name,
  basePrice,
  imageUrl: `https://images.test/${id}.svg`,
})

const productDetailsPayload = (
  id = 'galaxy-s24-ultra',
  overrides: Record<string, unknown> = {},
) => ({
  id,
  brand: 'Samsung',
  name: 'Galaxy S24 Ultra',
  description: 'A flagship Product built for demanding customers.',
  basePrice: 1099,
  specs: {
    screen: '6.8-inch AMOLED',
    resolution: '3120 x 1440 pixels',
    processor: 'Snapdragon 8 Gen 3',
    mainCamera: '200 MP',
    selfieCamera: '12 MP',
    battery: '5000 mAh',
    os: 'Android 14',
    screenRefreshRate: '120 Hz',
  },
  colorOptions: [
    {
      name: 'Black titanium',
      hexCode: '#62605f',
      imageUrl: `https://images.test/${id}-black.svg`,
    },
    {
      name: 'Blue titanium',
      hexCode: '#4d4e5f',
      imageUrl: `https://images.test/${id}-blue.svg`,
    },
  ],
  storageOptions: [
    { capacity: '256 GB', price: 1099 },
    { capacity: '512 GB', price: 1199 },
    { capacity: '1 TB', price: 1399 },
  ],
  similarProducts: [
    productSummary('iphone-15-pro', 'Apple', 'iPhone 15 Pro', 1219),
    productSummary('pixel-8a', 'Google', 'Pixel 8A', 549),
    productSummary('iphone-15', 'Apple', 'iPhone 15', 959),
    productSummary('galaxy-a25', 'Samsung', 'Galaxy A25 5G', 219),
    productSummary('redmi-note-13', 'MI', 'Redmi Note 13 Pro 5G', 249),
  ],
  ...overrides,
})

const mockProductImages = async (page: Page) => {
  await page.route('https://images.test/**', (route) =>
    route.fulfill({
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="260" height="320"><rect width="260" height="320" fill="#cccccc" /></svg>',
      contentType: 'image/svg+xml',
      status: 200,
    }),
  )
}

test('direct Product detail preserves the reference composition and accessible reading journey @critical', async ({
  page,
}) => {
  const browserProblems = monitorBrowserProblems(page)
  let requestApiKey: string | undefined
  let releaseProduct: (() => void) | undefined
  const productReleased = new Promise<void>((resolve) => {
    releaseProduct = resolve
  })

  await mockProductImages(page)
  await page.route(detailEndpoint, async (route) => {
    requestApiKey = route.request().headers()['x-api-key']
    await productReleased
    await route.fulfill({ json: productDetailsPayload(), status: 200 })
  })

  await page.goto('/products/galaxy-s24-ultra')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Loading Product' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Back' })).toBeVisible()

  releaseProduct?.()

  await expect(
    page.getByRole('heading', { level: 1, name: 'Galaxy S24 Ultra' }),
  ).toBeVisible()
  await expect(page.getByText('From 1099 EUR')).toBeVisible()
  await expect(
    page.getByText('A flagship Product built for demanding customers.'),
  ).toBeVisible()
  expect(requestApiKey).toBe('e2e-key')

  const image = page.getByRole('img', {
    name: 'Samsung Galaxy S24 Ultra in Black titanium',
  })
  const imageBox = await image.boundingBox()
  const viewportWidth = page.viewportSize()?.width

  if (viewportWidth === 393) {
    expect(imageBox).toMatchObject({ height: 273, width: 260, x: 16, y: 129 })
  } else if (viewportWidth === 834) {
    expect(imageBox).toMatchObject({ height: 416, width: 337, x: 40, y: 128 })
  } else if (viewportWidth === 1920) {
    expect(imageBox).toMatchObject({ height: 630, width: 510, x: 360, y: 234 })
  } else {
    expect(imageBox?.height).toBeGreaterThan(250)
    expect(imageBox?.width).toBeGreaterThan(250)
  }

  const similarProducts = page.getByRole('region', {
    name: 'Similar Products',
  })
  await expect(similarProducts.getByRole('listitem')).toHaveCount(5)
  await expect(
    similarProducts.getByRole('link', { name: 'Open Apple iPhone 15 Pro' }),
  ).toBeVisible()

  const carousel = page.getByRole('list', {
    name: 'Similar Products carousel',
  })
  await carousel.focus()
  await page.keyboard.press('ArrowRight')
  await expect
    .poll(() => carousel.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0)

  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze()
  expect(
    accessibility.violations,
    JSON.stringify(accessibility.violations, null, 2),
  ).toEqual([])
  expect(browserProblems, browserProblems.join('\n')).toEqual([])
})

test('catalog navigation uses history while a direct deep link BACK falls back safely @critical', async ({
  page,
}) => {
  const browserProblems = monitorBrowserProblems(page)

  await mockProductImages(page)
  await page.route(catalogEndpoint, (route) =>
    route.fulfill({
      json: [
        productSummary('galaxy-s24-ultra', 'Samsung', 'Galaxy S24 Ultra', 1099),
      ],
      status: 200,
    }),
  )
  await page.route(detailEndpoint, (route) =>
    route.fulfill({ json: productDetailsPayload(), status: 200 }),
  )

  await page.goto('/')
  await page
    .getByRole('link', { name: 'Open Samsung Galaxy S24 Ultra' })
    .click()
  await expect(page).toHaveURL(/\/products\/galaxy-s24-ultra$/)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Galaxy S24 Ultra' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: 'Catalog' })).toBeVisible()
  expect(browserProblems, browserProblems.join('\n')).toEqual([])
})

test('BACK falls back to the catalog from a fresh Product deep link @critical', async ({
  page,
}) => {
  await mockProductImages(page)
  await page.route(catalogEndpoint, (route) =>
    route.fulfill({ json: [], status: 200 }),
  )
  await page.route(detailEndpoint, (route) =>
    route.fulfill({ json: productDetailsPayload(), status: 200 }),
  )

  await page.goto('/products/galaxy-s24-ultra')
  await page.getByRole('button', { name: 'Back' }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: 'Catalog' })).toBeVisible()
})

test('similar Product navigation reuses payload cards then starts the new Product at focus and scroll origin @critical', async ({
  page,
}) => {
  let detailRequestCount = 0

  await mockProductImages(page)
  await page.route(detailEndpoint, (route) => {
    detailRequestCount += 1
    const productId = new URL(route.request().url()).pathname.split('/').at(-1)
    return route.fulfill({
      json:
        productId === 'iphone-15-pro'
          ? productDetailsPayload('iphone-15-pro', {
              brand: 'Apple',
              name: 'iPhone 15 Pro',
              similarProducts: [],
            })
          : productDetailsPayload(),
      status: 200,
    })
  })

  await page.goto('/products/galaxy-s24-ultra')
  await expect(
    page.getByRole('link', { name: 'Open Apple iPhone 15 Pro' }),
  ).toBeVisible()
  expect(detailRequestCount).toBe(1)

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.getByRole('link', { name: 'Open Apple iPhone 15 Pro' }).click()

  const nextHeading = page.getByRole('heading', {
    level: 1,
    name: 'iPhone 15 Pro',
  })
  await expect(nextHeading).toBeFocused()
  await expect(page).toHaveURL(/\/products\/iphone-15-pro$/)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  await expect(
    page.getByRole('region', { name: 'Similar Products' }),
  ).toHaveCount(0)
  expect(detailRequestCount).toBe(2)
})

test('recoverable Product detail states keep navigation and retry available @critical', async ({
  page,
}) => {
  let networkAttempts = 0

  await mockProductImages(page)
  await page.route(detailEndpoint, (route) => {
    const productId = new URL(route.request().url()).pathname.split('/').at(-1)

    if (productId === 'authentication') {
      return route.fulfill({ json: { message: 'Unauthorized' }, status: 401 })
    }
    if (productId === 'invalid-payload') {
      return route.fulfill({ json: { unexpected: true }, status: 200 })
    }
    if (productId === 'not-found') {
      return route.fulfill({ json: { message: 'Not found' }, status: 404 })
    }
    if (productId === 'network') {
      networkAttempts += 1
      return networkAttempts === 1
        ? route.abort('failed')
        : route.fulfill({ json: productDetailsPayload('network'), status: 200 })
    }

    return route.fulfill({ json: productDetailsPayload(), status: 200 })
  })

  for (const recoverableState of [
    {
      id: 'authentication',
      message: 'The Product detail could not be authenticated.',
    },
    {
      id: 'invalid-payload',
      message: 'The Product detail response is invalid.',
    },
    { id: 'not-found', message: 'The requested Product was not found.' },
  ]) {
    await page.goto(`/products/${recoverableState.id}`)
    await expect(page.getByRole('alert')).toContainText(
      recoverableState.message,
    )
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Back to catalog' }),
    ).toBeVisible()
  }

  await page.goto('/products/network')
  await expect(page.getByRole('alert')).toContainText(
    'Check your connection and try loading the Product again.',
  )
  await page.getByRole('button', { name: 'Retry' }).click()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Galaxy S24 Ultra' }),
  ).toBeVisible()
  expect(networkAttempts).toBe(2)
})

test('failed Product imagery preserves geometry and information @critical', async ({
  page,
}) => {
  await page.route('https://images.test/**', (route) => route.abort('failed'))
  await page.route(detailEndpoint, (route) =>
    route.fulfill({ json: productDetailsPayload(), status: 200 }),
  )

  await page.goto('/products/galaxy-s24-ultra')

  const fallback = page.getByRole('img', {
    name: 'Samsung Galaxy S24 Ultra in Black titanium image unavailable',
  })
  await expect(fallback).toBeVisible()
  const fallbackBox = await fallback.boundingBox()
  expect(fallbackBox?.height).toBeGreaterThanOrEqual(273)
  await expect(page.getByText('From 1099 EUR')).toBeVisible()
})
