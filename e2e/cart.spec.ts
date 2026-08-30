import AxeBuilder from '@axe-core/playwright'
import { devices, expect, test, type Page } from '@playwright/test'

import {
  expectNoHorizontalPageOverflow,
  monitorBrowserProblems,
} from './browserProblems'

const catalogEndpoint =
  /^https:\/\/prueba-tecnica-api-tienda-moviles\.onrender\.com\/products(?:\?.*)?$/
const detailEndpoint =
  /^https:\/\/prueba-tecnica-api-tienda-moviles\.onrender\.com\/products\/galaxy-s24-ultra$/
const cartStorageKey = 'mbst-cart'

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

const mobileSafariProject = 'mobile-safari-iphone-15'
const mobileSafariProfile = devices['iPhone 15']
const mobileSafariContextOptions = {
  deviceScaleFactor: mobileSafariProfile.deviceScaleFactor,
  hasTouch: mobileSafariProfile.hasTouch,
  isMobile: mobileSafariProfile.isMobile,
  screen: mobileSafariProfile.screen,
  userAgent: mobileSafariProfile.userAgent,
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

const mockStableProductApi = async (page: Page) => {
  await mockProductImage(page)
  await page.route(catalogEndpoint, (route) =>
    route.fulfill({
      json: [
        {
          id: productDetails.id,
          brand: productDetails.brand,
          name: productDetails.name,
          basePrice: productDetails.basePrice,
          imageUrl: productDetails.colorOptions[0].imageUrl,
        },
      ],
      status: 200,
    }),
  )
  await page.route(detailEndpoint, (route) =>
    route.fulfill({ json: productDetails, status: 200 }),
  )
}

const selectColor = async (page: Page, colorName: string) => {
  await page
    .getByRole('group', { name: 'Color' })
    .locator('label')
    .filter({ hasText: colorName })
    .click()
}

const readRuntimeDeviceProfile = (page: Page) =>
  page.evaluate(() => ({
    devicePixelRatio: window.devicePixelRatio,
    screen: { height: window.screen.height, width: window.screen.width },
    userAgent: navigator.userAgent,
  }))

test('configured Product persists into the responsive Cart without refetching or repricing @critical', async ({
  browser,
  page,
}, testInfo) => {
  const browserProblems = monitorBrowserProblems(page)
  let detailRequestCount = 0

  await mockProductImage(page)
  await page.route(catalogEndpoint, (route) =>
    route.fulfill({
      json: [
        {
          id: productDetails.id,
          brand: productDetails.brand,
          name: productDetails.name,
          basePrice: productDetails.basePrice,
          imageUrl: productDetails.colorOptions[1].imageUrl,
        },
      ],
      status: 200,
    }),
  )
  await page.route(detailEndpoint, (route) => {
    detailRequestCount += 1
    const detailPrice = detailRequestCount === 1 ? 1199 : 1299

    return route.fulfill({
      json: {
        ...productDetails,
        storageOptions: productDetails.storageOptions.map((storage) =>
          storage.capacity === '512 GB'
            ? { ...storage, price: detailPrice }
            : storage,
        ),
      },
      status: 200,
    })
  })

  await page.goto('/products/galaxy-s24-ultra')

  const addToCart = page.getByRole('button', { name: 'Add to cart' })
  await expect(addToCart).toBeDisabled()
  await page.getByText('512 GB', { exact: true }).click()
  await expect(addToCart).toBeDisabled()
  await selectColor(page, 'Blue titanium')
  await expect(addToCart).toBeEnabled()
  await addToCart.focus()
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(/\/cart$/)
  const cartHeading = page.getByRole('heading', {
    level: 1,
    name: 'Cart (1)',
  })
  await expect(cartHeading).toBeVisible()
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
  const cartActions = page.getByRole('group', { name: 'Cart actions' })
  const cartTotalPrice = cartActions.getByText('1199 EUR')
  await expect(cartTotalPrice).toHaveCSS('white-space', 'nowrap')
  await expectNoHorizontalPageOverflow(page)

  const pay = page.getByRole('button', { name: 'Pay' })
  await expect(pay).toBeEnabled()

  const lineBox = await cartLine.boundingBox()
  const footerBox = await cartActions.boundingBox()
  const viewportWidth = page.viewportSize()?.width
  const viewportHeight = page.viewportSize()?.height

  if (viewportWidth === 393) {
    expect(lineBox).toMatchObject({ width: 361, x: 16 })
    expect(lineBox?.y).toBeCloseTo(152.8, 1)
    expect(lineBox?.height).toBeCloseTo(197.863, 1)
    expect(footerBox).toMatchObject({ height: 129, width: 393, x: 0 })
    expect((footerBox?.y ?? 0) + (footerBox?.height ?? 0)).toBe(viewportHeight)
    expect(await pay.boundingBox()).toMatchObject({ height: 48, width: 174.5 })
  } else if (viewportWidth === 834) {
    expect(lineBox).toMatchObject({ height: 324, width: 754, x: 40 })
    expect(lineBox?.y).toBeCloseTo(196.8, 1)
    expect(footerBox).toMatchObject({ height: 112, width: 834, x: 0, y: 1082 })
    await expect(cartActions).toHaveCSS('column-gap', '56px')
    expect(await pay.boundingBox()).toMatchObject({ height: 48, width: 260 })
  } else if (viewportWidth === 1920) {
    expect(lineBox).toMatchObject({ height: 324, width: 548, x: 100 })
    expect(lineBox?.y).toBeCloseTo(221, 0)
    expect(footerBox).toMatchObject({ height: 136, width: 1920, x: 0, y: 944 })
    expect(await pay.boundingBox()).toMatchObject({ height: 56, width: 260 })
  } else if (viewportWidth === 768) {
    await expect(cartActions).toHaveCSS('column-gap', '32px')
    expect(lineBox?.height).toBeGreaterThan(190)
    expect(lineBox?.width).toBeGreaterThan(350)
    expect(footerBox?.y).toBeGreaterThan(650)
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

  await page.getByRole('link', { name: 'Continue shopping' }).click()
  await expect(page).toHaveURL(/\/$/)
  await page
    .getByRole('link', { name: 'Open Samsung Galaxy S24 Ultra' })
    .click()
  await expect(page).toHaveURL(/\/products\/galaxy-s24-ultra$/)
  await page.getByText('512 GB', { exact: true }).click()
  await selectColor(page, 'Blue titanium')
  await expect(page.getByText('1299 EUR', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Add to cart' }).click()

  await expect(
    page.getByRole('heading', { level: 1, name: 'Cart (2)' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Cart, 2 items' })).toBeVisible()
  await expect(page.getByText('QTY: 2')).toBeVisible()
  await expect(page.getByText('1199 EUR')).toBeVisible()
  await expect(page.getByText('2398 EUR')).toBeVisible()
  await expect(page.getByRole('status')).toHaveText(
    'Galaxy S24 Ultra, Blue titanium, 512 GB added to Cart.',
  )

  await page.reload()

  await expect(
    page.getByRole('heading', { level: 1, name: 'Cart (2)' }),
  ).toBeVisible()
  await expect(page.getByText('512 GB | Blue titanium')).toBeVisible()
  await expect(page.getByText('QTY: 2')).toBeVisible()
  await expect(page.getByText('1199 EUR')).toBeVisible()
  await expect(page.getByText('2398 EUR')).toBeVisible()
  expect(detailRequestCount).toBe(2)

  const restartedContext = await browser.newContext({
    baseURL: 'http://127.0.0.1:4173',
    ...(testInfo.project.name === mobileSafariProject
      ? mobileSafariContextOptions
      : {}),
    storageState: await page.context().storageState(),
    viewport: page.viewportSize() ?? { height: 852, width: 393 },
  })
  const restartedPage = await restartedContext.newPage()
  const restartedBrowserProblems = monitorBrowserProblems(restartedPage)
  await mockProductImage(restartedPage)
  await restartedPage.goto('/cart')
  await expect(
    restartedPage.getByRole('heading', { level: 1, name: 'Cart (2)' }),
  ).toBeVisible()
  await expect(restartedPage.getByText('512 GB | Blue titanium')).toBeVisible()
  await expect(restartedPage.getByText('QTY: 2')).toBeVisible()
  await expect(restartedPage.getByText('1199 EUR')).toBeVisible()
  await expect(restartedPage.getByText('2398 EUR')).toBeVisible()
  expect(restartedBrowserProblems, restartedBrowserProblems.join('\n')).toEqual(
    [],
  )
  await restartedContext.close()
  expect(detailRequestCount).toBe(2)

  const removeOne = page.getByRole('button', {
    name: 'Remove one Galaxy S24 Ultra from Cart',
  })
  await removeOne.click()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Cart (1)' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Cart, 1 item' })).toBeVisible()
  await expect(page.getByText('QTY: 1')).toBeVisible()
  await expect(page.getByText('1199 EUR')).toHaveCount(2)
  await expect(page.getByRole('status')).toHaveText(
    'Removed one Galaxy S24 Ultra from Cart. 1 unit remains.',
  )

  await removeOne.click()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Cart (0)' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Cart, 0 items' })).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Pay' })).toHaveCount(0)
  await expect(page.getByRole('status')).toHaveText(
    'Removed Galaxy S24 Ultra from Cart. Cart is empty.',
  )

  const emptyFooterBox = await page
    .getByRole('group', { name: 'Cart actions' })
    .boundingBox()
  const continueShopping = page.getByRole('link', {
    name: 'Continue shopping',
  })
  const continueShoppingBox = await continueShopping.boundingBox()
  if (viewportWidth === 393) {
    expect(emptyFooterBox).toMatchObject({ height: 96, width: 393 })
    expect((emptyFooterBox?.y ?? 0) + (emptyFooterBox?.height ?? 0)).toBe(
      viewportHeight,
    )
    expect(continueShoppingBox).toMatchObject({
      height: 48,
      width: 361,
      x: 16,
    })
  } else if (viewportWidth === 768) {
    expect(emptyFooterBox).toMatchObject({ height: 112, width: 768, y: 912 })
    expect(continueShoppingBox).toMatchObject({
      height: 48,
      width: 200,
      x: 40,
    })
  } else if (viewportWidth === 834) {
    expect(emptyFooterBox).toMatchObject({ height: 112, width: 834, y: 1082 })
    expect(continueShoppingBox).toMatchObject({
      height: 48,
      width: 200,
      x: 40,
    })
  } else if (viewportWidth === 1280) {
    expect(emptyFooterBox).toMatchObject({ height: 136, width: 1280, y: 664 })
    expect(continueShoppingBox).toMatchObject({
      height: 56,
      width: 260,
      x: 100,
    })
  } else if (viewportWidth === 1920) {
    expect(emptyFooterBox).toMatchObject({ height: 136, width: 1920, y: 944 })
    expect(continueShoppingBox).toMatchObject({
      height: 56,
      width: 260,
      x: 100,
    })
  }

  await continueShopping.click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: 'Catalog' })).toBeVisible()
  expect(browserProblems, browserProblems.join('\n')).toEqual([])
})

test('Product and Cart typography uses the binding design tokens', async ({
  page,
}) => {
  const browserProblems = monitorBrowserProblems(page)

  await mockStableProductApi(page)
  await page.goto('/products/galaxy-s24-ultra')

  await expect(
    page.getByRole('heading', { level: 1, name: 'Galaxy S24 Ultra' }),
  ).toHaveCSS('font-size', '24px')
  await expect(page.getByText('From 1099 EUR', { exact: true })).toHaveCSS(
    'font-size',
    '20px',
  )

  await page.getByText('256 GB', { exact: true }).click()
  await selectColor(page, 'Black titanium')
  await page.getByRole('button', { name: 'Add to cart' }).click()

  await expect(
    page.getByRole('heading', { level: 1, name: 'Cart (1)' }),
  ).toHaveCSS('font-size', '24px')
  await expect(page.getByRole('listitem').getByText('1099 EUR')).toHaveCSS(
    'font-size',
    '12px',
  )
  await expect(
    page.getByRole('group', { name: 'Cart actions' }).getByText('1099 EUR'),
  ).toHaveCSS('font-size', '14px')

  expect(browserProblems, browserProblems.join('\n')).toEqual([])
})

test('different variants of the same Product remain separate Cart lines @critical', async ({
  page,
}) => {
  const browserProblems = monitorBrowserProblems(page)

  await mockStableProductApi(page)

  await page.goto('/products/galaxy-s24-ultra')
  await page.getByText('256 GB', { exact: true }).click()
  await selectColor(page, 'Black titanium')
  await page.getByRole('button', { name: 'Add to cart' }).click()

  await page.getByRole('link', { name: 'Continue shopping' }).click()
  await page
    .getByRole('link', { name: 'Open Samsung Galaxy S24 Ultra' })
    .click()
  await page.getByText('512 GB', { exact: true }).click()
  await selectColor(page, 'Blue titanium')
  await page.getByRole('button', { name: 'Add to cart' }).click()

  await expect(
    page.getByRole('heading', { level: 1, name: 'Cart (2)' }),
  ).toBeVisible()
  const cartLines = page.getByRole('listitem')
  await expect(cartLines).toHaveCount(2)
  await expect(cartLines.nth(0)).toContainText('256 GB | Black titanium')
  await expect(cartLines.nth(0)).toContainText('1099 EUR')
  await expect(cartLines.nth(0)).toContainText('QTY: 1')
  await expect(cartLines.nth(1)).toContainText('512 GB | Blue titanium')
  await expect(cartLines.nth(1)).toContainText('1199 EUR')
  await expect(cartLines.nth(1)).toContainText('QTY: 1')
  await expect(
    page.getByRole('group', { name: 'Cart actions' }).getByText('2298 EUR'),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Cart, 2 items' })).toBeVisible()
  await expectNoHorizontalPageOverflow(page)

  expect(browserProblems, browserProblems.join('\n')).toEqual([])
})

test('failed Cart imagery preserves the Product controls and responsive composition @critical', async ({
  page,
}) => {
  const imageUrl = 'https://images.test/unavailable.svg'
  const browserProblems = monitorBrowserProblems(page, {
    expectedConsoleMessages: [/Failed to load resource: net::ERR_FAILED/],
    expectedFailedRequestUrls: [imageUrl],
  })
  const line = {
    id: JSON.stringify([productDetails.id, 'Blue titanium', '256 GB']),
    productId: productDetails.id,
    brand: productDetails.brand,
    name: productDetails.name,
    imageUrl,
    color: 'Blue titanium',
    storage: '256 GB',
    unitPrice: 1099,
    quantity: 1,
  }

  await page.addInitScript(
    ({ key, value }) => window.localStorage.setItem(key, value),
    {
      key: cartStorageKey,
      value: JSON.stringify({ state: { lines: [line] }, version: 1 }),
    },
  )
  await page.route(imageUrl, (route) => route.abort('failed'))
  await page.goto('/cart')

  const fallback = page.getByRole('img', {
    name: 'Samsung Galaxy S24 Ultra in Blue titanium image unavailable',
  })
  await expect(page.getByText('256 GB | Blue titanium')).toBeVisible()
  await expect(
    page.getByRole('button', {
      name: 'Remove one Galaxy S24 Ultra from Cart',
    }),
  ).toBeVisible()
  await expectNoHorizontalPageOverflow(page)

  const fallbackBox = await fallback.boundingBox()
  expect(fallbackBox?.height).toBeGreaterThan(190)
  expect(fallbackBox?.width).toBeGreaterThanOrEqual(160)

  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze()
  expect(
    accessibility.violations,
    JSON.stringify(accessibility.violations, null, 2),
  ).toEqual([])
  expect(browserProblems, browserProblems.join('\n')).toEqual([])
})

test('malformed persisted Cart JSON recovers on first boot without browser problems @critical', async ({
  page,
}) => {
  const browserProblems = monitorBrowserProblems(page)
  await page.addInitScript(
    ({ key, value }) => window.localStorage.setItem(key, value),
    { key: cartStorageKey, value: '{not-json' },
  )

  await page.goto('/cart')

  await expect(
    page.getByRole('heading', { level: 1, name: 'Cart (0)' }),
  ).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveCount(0)
  await expect(
    page.getByRole('link', { name: 'Continue shopping' }),
  ).toBeVisible()

  expect(browserProblems, browserProblems.join('\n')).toEqual([])
})

test('Mobile Safari contexts use the complete iPhone 15 profile @critical', async ({
  browser,
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== mobileSafariProject,
    'This profile contract belongs to the Mobile Safari project.',
  )

  expect(mobileSafariProfile).toMatchObject({
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true,
    screen: { height: 852, width: 393 },
    viewport: { height: 659, width: 393 },
    userAgent: expect.stringContaining('iPhone'),
  })
  expect(page.viewportSize()).toEqual(mobileSafariProfile.viewport)
  expect((await readRuntimeDeviceProfile(page)).userAgent).toContain('iPhone')

  const restartedContext = await browser.newContext({
    ...mobileSafariContextOptions,
    viewport: mobileSafariProfile.viewport,
  })
  const restartedPage = await restartedContext.newPage()

  expect(restartedPage.viewportSize()).toEqual(mobileSafariProfile.viewport)
  expect(await readRuntimeDeviceProfile(restartedPage)).toMatchObject({
    screen: mobileSafariProfile.screen,
    userAgent: expect.stringContaining('iPhone'),
  })

  await restartedContext.close()
})
