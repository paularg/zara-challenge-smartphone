import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { monitorBrowserProblems } from './browserProblems'

const catalogEndpoint =
  /^https:\/\/prueba-tecnica-api-tienda-moviles\.onrender\.com\/products(?:\?.*)?$/
const detailEndpoint =
  /^https:\/\/prueba-tecnica-api-tienda-moviles\.onrender\.com\/products\/galaxy-s24-ultra$/

const productDetails = {
  id: 'galaxy-s24-ultra',
  brand: 'Samsung',
  name: 'Galaxy S24 Ultra',
  description: 'A flagship Product.',
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
      imageUrl: 'https://images.test/galaxy-black.svg',
    },
    {
      name: 'Blue titanium',
      hexCode: '#4d4e5f',
      imageUrl: 'https://images.test/galaxy-blue.svg',
    },
  ],
  storageOptions: [
    { capacity: '256 GB', price: 1099 },
    { capacity: '512 GB', price: 1199 },
  ],
  similarProducts: [],
}

const mockProductImage = async (page: Page) => {
  await page.route('https://images.test/**', (route) =>
    route.fulfill({
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="262" height="324"><rect width="262" height="324" fill="#f3f2f2" /><rect x="80" y="24" width="102" height="276" rx="14" fill="#4d4e5f" /></svg>',
      contentType: 'image/svg+xml',
      status: 200,
    }),
  )
}

test('configured Product persists into the responsive Cart without refetching or repricing @critical', async ({
  browser,
  page,
}) => {
  const browserProblems = monitorBrowserProblems(page)
  let detailRequestCount = 0

  await mockProductImage(page)
  await page.route(catalogEndpoint, (route) =>
    route.fulfill({ json: [], status: 200 }),
  )
  await page.route(detailEndpoint, (route) => {
    detailRequestCount += 1
    return route.fulfill({ json: productDetails, status: 200 })
  })

  await page.goto('/products/galaxy-s24-ultra')

  const addToCart = page.getByRole('button', { name: 'Add to cart' })
  await expect(addToCart).toBeDisabled()
  await page.getByText('512 GB', { exact: true }).click()
  await expect(addToCart).toBeDisabled()
  await page.getByText('Blue titanium', { exact: true }).click()
  await expect(addToCart).toBeEnabled()
  await addToCart.focus()
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(/\/cart$/)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Cart (1)' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Cart, 1 item' })).toBeVisible()
  await expect(page.getByRole('status')).toHaveText(
    'Galaxy S24 Ultra, Blue titanium, 512 GB added to Cart.',
  )

  const cartLine = page.getByRole('listitem')
  await expect(cartLine.getByText('Galaxy S24 Ultra')).toBeVisible()
  await expect(cartLine.getByText('512 GB | Blue titanium')).toBeVisible()
  await expect(cartLine.getByText('1199 EUR')).toBeVisible()
  await expect(cartLine.getByText('QTY: 1')).toBeVisible()
  await expect(
    cartLine.getByRole('img', {
      name: 'Samsung Galaxy S24 Ultra in Blue titanium',
    }),
  ).toHaveAttribute('src', 'https://images.test/galaxy-blue.svg')
  await expect(page.getByText('1199 EUR')).toHaveCount(2)

  const pay = page.getByRole('button', { name: 'Pay' })
  await expect(pay).toBeDisabled()
  await expect(pay).toHaveAccessibleDescription(
    'Checkout is outside this exercise.',
  )

  const lineBox = await cartLine.boundingBox()
  const footerBox = await page.locator('footer').boundingBox()
  const viewportWidth = page.viewportSize()?.width

  if (viewportWidth === 393) {
    expect(lineBox).toMatchObject({ height: 197.859375, width: 361, x: 16 })
    expect(footerBox).toMatchObject({ height: 129, width: 393, x: 0, y: 723 })
    expect(await pay.boundingBox()).toMatchObject({ height: 48, width: 174.5 })
  } else if (viewportWidth === 834) {
    expect(lineBox).toMatchObject({ height: 324, width: 754, x: 40, y: 200 })
    expect(footerBox).toMatchObject({ height: 112, width: 834, x: 0, y: 1082 })
    expect(await pay.boundingBox()).toMatchObject({ height: 48, width: 260 })
  } else if (viewportWidth === 1920) {
    expect(lineBox).toMatchObject({ height: 324, width: 548, x: 100 })
    expect(lineBox?.y).toBeCloseTo(229, 0)
    expect(footerBox).toMatchObject({ height: 136, width: 1920, x: 0, y: 944 })
    expect(await pay.boundingBox()).toMatchObject({ height: 56, width: 260 })
  } else {
    expect(lineBox?.height).toBeGreaterThan(190)
    expect(lineBox?.width).toBeGreaterThan(350)
    expect(footerBox?.y).toBeGreaterThan(650)
  }

  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze()
  expect(
    accessibility.violations,
    JSON.stringify(accessibility.violations, null, 2),
  ).toEqual([])

  await page.reload()

  await expect(
    page.getByRole('heading', { level: 1, name: 'Cart (1)' }),
  ).toBeVisible()
  await expect(page.getByText('512 GB | Blue titanium')).toBeVisible()
  await expect(page.getByText('1199 EUR')).toHaveCount(2)
  expect(detailRequestCount).toBe(1)

  const restartedContext = await browser.newContext({
    baseURL: 'http://127.0.0.1:4173',
    storageState: await page.context().storageState(),
    viewport: page.viewportSize() ?? { height: 852, width: 393 },
  })
  const restartedPage = await restartedContext.newPage()
  const restartedBrowserProblems = monitorBrowserProblems(restartedPage)
  await mockProductImage(restartedPage)
  await restartedPage.goto('/cart')
  await expect(
    restartedPage.getByRole('heading', { level: 1, name: 'Cart (1)' }),
  ).toBeVisible()
  await expect(restartedPage.getByText('512 GB | Blue titanium')).toBeVisible()
  await expect(restartedPage.getByText('1199 EUR')).toHaveCount(2)
  expect(restartedBrowserProblems, restartedBrowserProblems.join('\n')).toEqual(
    [],
  )
  await restartedContext.close()
  expect(detailRequestCount).toBe(1)

  await page
    .getByRole('button', { name: 'Remove one Galaxy S24 Ultra from Cart' })
    .click()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Cart (0)' }),
  ).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Pay' })).toHaveCount(0)

  await page.getByRole('link', { name: 'Continue shopping' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: 'Catalog' })).toBeVisible()
  expect(browserProblems, browserProblems.join('\n')).toEqual([])
})
