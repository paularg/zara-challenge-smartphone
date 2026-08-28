import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductDetailsPage } from './ProductDetailsPage'

const productDetailsPayload = (
  id = 'galaxy-s24-ultra',
  overrides: Record<string, unknown> = {},
) => ({
  id,
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
      imageUrl: 'http://images.example.com/black.png',
    },
    {
      name: 'Blue titanium',
      hexCode: '#4d4e5f',
      imageUrl: 'http://images.example.com/blue.png',
    },
  ],
  storageOptions: [
    { capacity: '256 GB', price: 1099 },
    { capacity: '512 GB', price: 1199 },
  ],
  similarProducts: [
    {
      id: 'iphone-15-pro',
      brand: 'Apple',
      name: 'iPhone 15 Pro',
      basePrice: 1219,
      imageUrl: 'http://images.example.com/iphone.png',
    },
  ],
  ...overrides,
})

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
    status,
  })

const renderProductDetails = (
  initialEntries = ['/products/galaxy-s24-ultra'],
) => {
  window.history.replaceState({ idx: initialEntries.length - 1 }, '')
  const router = createMemoryRouter(
    [
      { path: '/', element: <h1>Catalog</h1> },
      { path: '/products/:productId', element: <ProductDetailsPage /> },
    ],
    { initialEntries },
  )

  return {
    ...render(<RouterProvider router={router} />),
    router,
  }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('Product detail route', () => {
  it('loads and presents live Product reading content from a direct route', async () => {
    let resolveRequest: (response: Response) => void = () => undefined
    const request = new Promise<Response>((resolve) => {
      resolveRequest = resolve
    })
    vi.stubEnv('API_KEY', 'test-key')
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(request))

    renderProductDetails()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Loading Product' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()

    await act(async () => {
      resolveRequest(jsonResponse(productDetailsPayload()))
      await request
    })

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Galaxy S24 Ultra',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Samsung')).toBeInTheDocument()
    expect(screen.getByText('From 1099 EUR')).toBeInTheDocument()
    expect(
      screen.getByRole('img', {
        name: 'Samsung Galaxy S24 Ultra',
      }),
    ).toHaveAttribute('src', 'https://images.example.com/black.png')
    expect(screen.queryByText('Selected')).not.toBeInTheDocument()
    expect(screen.getByText('Black titanium')).toBeVisible()
    expect(screen.getByText('Blue titanium')).toBeVisible()

    const specifications = screen.getByRole('table', {
      name: 'Product specifications',
    })
    expect(
      within(specifications).getByText('A flagship Product.'),
    ).toBeVisible()
    expect(within(specifications).getByText('120 Hz')).toBeVisible()

    const similarProducts = screen.getByRole('region', {
      name: 'Similar Products',
    })
    expect(
      within(similarProducts).getByRole('link', {
        name: 'Open Apple iPhone 15 Pro',
      }),
    ).toHaveAttribute('href', '/products/iphone-15-pro')
  })

  it('begins with no selected options and uses storage as the final unit price', async () => {
    const user = userEvent.setup()
    vi.stubEnv('API_KEY', 'test-key')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(productDetailsPayload())),
    )

    renderProductDetails()

    await screen.findByRole('heading', {
      level: 1,
      name: 'Galaxy S24 Ultra',
    })

    const storageGroup = screen.getByRole('group', { name: 'Storage' })
    const colorGroup = screen.getByRole('group', { name: 'Color' })
    const storage = within(storageGroup).getByRole('radio', { name: '512 GB' })

    expect(within(storageGroup).getAllByRole('radio')).toHaveLength(2)
    expect(within(colorGroup).getAllByRole('radio')).toHaveLength(2)
    expect(storage).not.toBeChecked()
    expect(
      within(colorGroup).getByRole('radio', { name: 'Black titanium' }),
    ).not.toBeChecked()
    expect(screen.getByText('From 1099 EUR')).toBeVisible()

    await user.click(storage)

    expect(storage).toBeChecked()
    expect(screen.getByText('1199 EUR')).toBeVisible()
    expect(screen.queryByText('From 1099 EUR')).not.toBeInTheDocument()
    await user.click(
      within(colorGroup).getByRole('radio', { name: 'Blue titanium' }),
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'Product variant complete.',
    )
    expect(screen.getByText('1199 EUR')).toBeVisible()
    expect(
      screen.getByRole('img', {
        name: 'Samsung Galaxy S24 Ultra in Blue titanium',
      }),
    ).toHaveAttribute('src', 'https://images.example.com/blue.png')
    expect(
      screen.queryByRole('button', { name: 'Add to cart' }),
    ).not.toBeInTheDocument()
  })

  it('supports color-first selection and replaces image and price without stale data', async () => {
    const user = userEvent.setup()
    vi.stubEnv('API_KEY', 'test-key')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(productDetailsPayload())),
    )

    renderProductDetails()

    const colorGroup = await screen.findByRole('group', { name: 'Color' })
    const storageGroup = screen.getByRole('group', { name: 'Storage' })
    const black = within(colorGroup).getByRole('radio', {
      name: 'Black titanium',
    })
    const blue = within(colorGroup).getByRole('radio', {
      name: 'Blue titanium',
    })
    const storage256 = within(storageGroup).getByRole('radio', {
      name: '256 GB',
    })
    const storage512 = within(storageGroup).getByRole('radio', {
      name: '512 GB',
    })

    await user.click(blue)

    expect(blue).toBeChecked()
    expect(
      screen.getByRole('img', {
        name: 'Samsung Galaxy S24 Ultra in Blue titanium',
      }),
    ).toHaveAttribute('src', 'https://images.example.com/blue.png')
    expect(screen.getByText('From 1099 EUR')).toBeVisible()

    await user.click(storage256)
    await user.click(black)
    await user.click(storage512)

    expect(black).toBeChecked()
    expect(blue).not.toBeChecked()
    expect(storage512).toBeChecked()
    expect(storage256).not.toBeChecked()
    expect(
      screen.getByRole('img', {
        name: 'Samsung Galaxy S24 Ultra in Black titanium',
      }),
    ).toHaveAttribute('src', 'https://images.example.com/black.png')
    expect(screen.getByText('1199 EUR')).toBeVisible()
    expect(screen.queryByText('1099 EUR')).not.toBeInTheDocument()
  })

  it.each([
    {
      expected: 'The Product detail could not be authenticated.',
      payload: { message: 'Unauthorized' },
      status: 401,
      title: 'Product unavailable',
    },
    {
      expected: 'The Product detail response is invalid.',
      payload: { unexpected: true },
      status: 200,
      title: 'Product unavailable',
    },
    {
      expected: 'The requested Product was not found.',
      payload: { message: 'Not found' },
      status: 404,
      title: 'Product not found',
    },
  ])(
    'renders a usable recoverable state for $expected',
    async ({ expected, payload, status, title }) => {
      vi.stubEnv('API_KEY', 'test-key')
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(jsonResponse(payload, status)),
      )

      renderProductDetails()

      expect(await screen.findByRole('alert')).toHaveTextContent(expected)
      expect(
        screen.getByRole('heading', { level: 1, name: title }),
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Back to catalog' }),
      ).toBeInTheDocument()
    },
  )

  it('recovers from a network failure through retry', async () => {
    const user = userEvent.setup()
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(jsonResponse(productDetailsPayload()))
    vi.stubEnv('API_KEY', 'test-key')
    vi.stubGlobal('fetch', fetcher)

    renderProductDetails()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Check your connection and try loading the Product again.',
    )
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Galaxy S24 Ultra',
      }),
    ).toBeInTheDocument()
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('falls back to the catalog when BACK is used from a direct deep link', async () => {
    const user = userEvent.setup()
    vi.stubEnv('API_KEY', 'test-key')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(productDetailsPayload())),
    )
    const { router } = renderProductDetails()

    await screen.findByRole('heading', {
      level: 1,
      name: 'Galaxy S24 Ultra',
    })
    await user.click(screen.getByRole('button', { name: 'Back' }))

    expect(router.state.location.pathname).toBe('/')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Catalog' }),
    ).toBeInTheDocument()
  })

  it('uses available history when BACK follows catalog navigation', async () => {
    const user = userEvent.setup()
    vi.stubEnv('API_KEY', 'test-key')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(productDetailsPayload())),
    )
    const { router } = renderProductDetails(['/', '/products/galaxy-s24-ultra'])

    await screen.findByRole('heading', {
      level: 1,
      name: 'Galaxy S24 Ultra',
    })
    await user.click(screen.getByRole('button', { name: 'Back' }))

    expect(router.state.location.pathname).toBe('/')
    expect(router.state.historyAction).toBe('POP')
  })

  it('keeps Product information usable when the main image fails', async () => {
    vi.stubEnv('API_KEY', 'test-key')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(productDetailsPayload())),
    )
    renderProductDetails()

    const image = await screen.findByRole('img', {
      name: 'Samsung Galaxy S24 Ultra',
    })
    fireEvent.error(image)

    expect(
      screen.getByRole('img', {
        name: 'Samsung Galaxy S24 Ultra image unavailable',
      }),
    ).toHaveTextContent('Image unavailable')
    expect(screen.getByText('From 1099 EUR')).toBeInTheDocument()
  })

  it('omits the entire similar Products section when none are provided', async () => {
    vi.stubEnv('API_KEY', 'test-key')
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse(
            productDetailsPayload('product-1', { similarProducts: [] }),
          ),
        ),
    )
    renderProductDetails(['/products/product-1'])

    await screen.findByRole('heading', {
      level: 1,
      name: 'Galaxy S24 Ultra',
    })
    expect(
      screen.queryByRole('region', { name: 'Similar Products' }),
    ).not.toBeInTheDocument()
  })

  it('omits the storage selector when the API provides no capacities', async () => {
    vi.stubEnv('API_KEY', 'test-key')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          productDetailsPayload('galaxy-s24-ultra', {
            storageOptions: [],
          }),
        ),
      ),
    )
    renderProductDetails()

    await screen.findByRole('heading', {
      level: 1,
      name: 'Galaxy S24 Ultra',
    })
    expect(
      screen.queryByRole('list', { name: 'Available storage capacities' }),
    ).not.toBeInTheDocument()
  })

  it('opens a similar Product and moves focus and scroll to its beginning', async () => {
    const user = userEvent.setup()
    const scrollTo = vi.fn()
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(productDetailsPayload()))
      .mockResolvedValueOnce(
        jsonResponse(
          productDetailsPayload('iphone-15-pro', {
            brand: 'Apple',
            name: 'iPhone 15 Pro',
            similarProducts: [],
          }),
        ),
      )
    vi.stubEnv('API_KEY', 'test-key')
    vi.stubGlobal('fetch', fetcher)
    vi.stubGlobal('scrollTo', scrollTo)
    const { router } = renderProductDetails()

    await user.click(
      await screen.findByRole('link', { name: 'Open Apple iPhone 15 Pro' }),
    )

    const nextHeading = await screen.findByRole('heading', {
      level: 1,
      name: 'iPhone 15 Pro',
    })
    expect(router.state.location.pathname).toBe('/products/iphone-15-pro')
    expect(nextHeading).toHaveFocus()
    expect(scrollTo).toHaveBeenCalledWith({ top: 0 })
  })

  it('provides keyboard scrolling on the clipped similar Products carousel', async () => {
    vi.stubEnv('API_KEY', 'test-key')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(productDetailsPayload())),
    )
    renderProductDetails()

    const carousel = await screen.findByRole('list', {
      name: 'Similar Products carousel',
    })
    const scrollBy = vi.fn()
    carousel.scrollBy = scrollBy
    carousel.focus()
    fireEvent.keyDown(carousel, { key: 'ArrowRight' })

    expect(carousel).toHaveFocus()
    expect(scrollBy).toHaveBeenCalledWith({ behavior: 'smooth', left: 344 })
  })
})
