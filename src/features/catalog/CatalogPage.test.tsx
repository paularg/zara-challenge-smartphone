import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CatalogPage } from './CatalogPage'

const productPayload = (id: string) => ({
  id,
  brand: `Brand ${id}`,
  name: `Product ${id}`,
  basePrice: Number(id) * 100,
  imageUrl: `http://images.example.com/${id}.png`,
})

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
    status,
  })

const deferredResponse = () => {
  let resolve: (response: Response) => void = () => undefined
  const promise = new Promise<Response>((resolvePromise) => {
    resolve = resolvePromise
  })

  return { promise, resolve }
}

const installDebounceClock = () => {
  const debounceTimerId = 2_147_000_000
  const nativeSetTimeout = window.setTimeout.bind(window)
  const nativeClearTimeout = window.clearTimeout.bind(window)
  let callback: (() => void) | undefined
  let remaining = 300

  vi.spyOn(window, 'setTimeout').mockImplementation((handler, delay) => {
    if (delay === 300 && typeof handler === 'function') {
      callback = () => handler()
      remaining = 300
      return debounceTimerId
    }

    return nativeSetTimeout(handler, delay)
  })
  vi.spyOn(window, 'clearTimeout').mockImplementation((timerId) => {
    if (timerId === debounceTimerId) {
      callback = undefined
      return
    }

    nativeClearTimeout(timerId)
  })

  return {
    advanceBy: async (duration: number) => {
      remaining -= duration

      if (!callback || remaining > 0) {
        return
      }

      const dueCallback = callback
      callback = undefined
      await act(async () => dueCallback())
    },
  }
}

const renderCatalog = (initialEntry = '/', strictMode = false) => {
  const router = createMemoryRouter(
    [
      { path: '/', element: <CatalogPage /> },
      {
        path: '/products/:productId',
        element: <h1>Matching Product detail</h1>,
      },
    ],
    { initialEntries: [initialEntry] },
  )
  const application = <RouterProvider router={router} />

  return {
    ...render(
      strictMode ? <StrictMode>{application}</StrictMode> : application,
    ),
    router,
  }
}

afterEach(() => {
  cleanup()
  delete (document as unknown as { startViewTransition?: unknown })
    .startViewTransition
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('Product catalog', () => {
  it('confirms a search after 300 ms without blocking the current Products', async () => {
    const user = userEvent.setup()
    const debounceClock = installDebounceClock()
    vi.stubEnv('API_KEY', 'test-key')
    const pendingSearch = new Promise<Response>(() => undefined)
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([productPayload('1')]))
      .mockReturnValueOnce(pendingSearch)
    vi.stubGlobal('fetch', fetcher)

    const { router } = renderCatalog()
    await act(async () => undefined)

    expect(screen.getByText('Product 1')).toBeInTheDocument()
    const searchInput = screen.getByRole('searchbox', {
      name: 'Search Products',
    })
    await user.type(searchInput, 'Samsung')

    await debounceClock.advanceBy(299)
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(router.state.location.search).toBe('')

    await debounceClock.advanceBy(1)

    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(router.state.location.search).toBe('?search=Samsung')
    expect(screen.getByText('Product 1')).toBeInTheDocument()
    expect(
      screen.getByRole('status', { name: 'Search status' }),
    ).toHaveTextContent('Searching Products')
  })

  it('cancels an obsolete search and ignores its stale response', async () => {
    const user = userEvent.setup()
    const debounceClock = installDebounceClock()
    vi.stubEnv('API_KEY', 'test-key')
    const samsungSearch = deferredResponse()
    const appleSearch = deferredResponse()
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([productPayload('1')]))
      .mockReturnValueOnce(samsungSearch.promise)
      .mockReturnValueOnce(appleSearch.promise)
    vi.stubGlobal('fetch', fetcher)

    const { router } = renderCatalog()
    await act(async () => undefined)

    const searchInput = screen.getByRole('searchbox', {
      name: 'Search Products',
    })
    await user.type(searchInput, 'Samsung')
    await debounceClock.advanceBy(300)

    const samsungSignal = fetcher.mock.calls[1]?.[1]?.signal
    expect(samsungSignal?.aborted).toBe(false)

    await user.clear(searchInput)
    await user.type(searchInput, 'Apple')
    await debounceClock.advanceBy(300)

    expect(samsungSignal?.aborted).toBe(true)
    expect(fetcher).toHaveBeenCalledTimes(3)

    await act(async () => {
      appleSearch.resolve(jsonResponse([productPayload('3')]))
      await appleSearch.promise
    })
    expect(screen.getByText('Product 3')).toBeInTheDocument()

    await act(async () => {
      samsungSearch.resolve(jsonResponse([productPayload('2')]))
      await samsungSearch.promise
    })
    expect(screen.queryByText('Product 2')).not.toBeInTheDocument()
    expect(screen.getByText('Product 3')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?search=Apple')
  })

  it('restores a direct URL, announces its count, and avoids StrictMode duplicate requests', async () => {
    vi.stubEnv('API_KEY', 'test-key')
    const directSearch = deferredResponse()
    const fetcher = vi.fn().mockReturnValue(directSearch.promise)
    vi.stubGlobal('fetch', fetcher)

    renderCatalog('/?search=Samsung', true)

    expect(
      screen.getByRole('searchbox', { name: 'Search Products' }),
    ).toHaveValue('Samsung')
    const catalogStatus = screen.getByRole('status', {
      name: 'Catalog status',
    })
    expect(catalogStatus).toHaveTextContent('Loading Products')
    expect(fetcher).toHaveBeenCalledTimes(1)

    await act(async () => {
      directSearch.resolve(jsonResponse([productPayload('2')]))
      await directSearch.promise
    })

    expect(await screen.findByText('Product 2')).toBeInTheDocument()
    expect(catalogStatus).toHaveTextContent('1 Result')
    expect(screen.getByRole('status', { name: 'Catalog status' })).toBe(
      catalogStatus,
    )
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(String(fetcher.mock.calls[0]?.[0])).toContain('search=Samsung')
  })

  it('identifies an empty query and clears it back to the first 20 Products', async () => {
    const user = userEvent.setup()
    vi.stubEnv('API_KEY', 'test-key')
    const initialProducts = Array.from({ length: 22 }, (_, index) =>
      productPayload(String(index + 1)),
    )
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse(initialProducts))
    vi.stubGlobal('fetch', fetcher)

    const { router } = renderCatalog('/?search=Samsung')

    expect(
      await screen.findByText('No Products found for “Samsung”.'),
    ).toBeInTheDocument()
    const clearButtons = screen.getAllByRole('button', {
      name: 'Clear search',
    })
    expect(clearButtons).toHaveLength(2)

    await user.click(clearButtons[1])

    const searchInput = screen.getByRole('searchbox', {
      name: 'Search Products',
    })
    expect(searchInput).toHaveFocus()
    expect(searchInput).toHaveValue('')
    expect(router.state.location.search).toBe('')
    expect(await screen.findByText('20 Results')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(20)
    expect(String(fetcher.mock.calls[1]?.[0])).not.toContain('search=')
  })

  it('keeps the catalog structure available while Products load', () => {
    vi.stubEnv('API_KEY', 'test-key')
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => undefined)),
    )

    renderCatalog()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Catalog' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('status', { name: 'Catalog status' }),
    ).toHaveTextContent('Loading Products')
    expect(screen.getByRole('list', { name: 'Products' })).toBeInTheDocument()
  })

  it('renders normalized Product cards, result count, and matching detail navigation', async () => {
    const user = userEvent.setup()
    vi.stubEnv('API_KEY', 'test-key')
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse([productPayload('1'), productPayload('2')]),
        ),
    )

    renderCatalog()

    expect(await screen.findByText('2 Results')).toBeInTheDocument()
    const cards = screen.getAllByRole('listitem')
    expect(cards).toHaveLength(2)

    const firstCard = cards[0]
    expect(within(firstCard).getByText('Brand 1')).toBeInTheDocument()
    expect(within(firstCard).getByText('Product 1')).toBeInTheDocument()
    expect(within(firstCard).getByText('100 EUR')).toBeInTheDocument()
    expect(
      within(firstCard).getByRole('img', { name: 'Brand 1 Product 1' }),
    ).toHaveAttribute('src', 'https://images.example.com/1.png')

    await user.click(
      within(firstCard).getByRole('link', {
        name: 'Open Brand 1 Product 1',
      }),
    )
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Matching Product detail',
      }),
    ).toBeInTheDocument()
  })

  it('uses a view transition when opening a Product', async () => {
    const user = userEvent.setup()
    let finishTransition: () => void = () => undefined
    const transitionFinished = new Promise<void>((resolve) => {
      finishTransition = resolve
    })
    const startViewTransition = vi.fn((update: () => void) => {
      update()
      return { finished: transitionFinished }
    })
    Object.defineProperty(document, 'startViewTransition', {
      configurable: true,
      value: startViewTransition,
    })
    vi.stubEnv('API_KEY', 'test-key')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse([productPayload('1')])),
    )

    renderCatalog()

    await screen.findByRole('img', {
      name: 'Brand 1 Product 1',
    })
    await user.click(
      screen.getByRole('link', { name: 'Open Brand 1 Product 1' }),
    )

    expect(startViewTransition).toHaveBeenCalledTimes(1)
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Matching Product detail',
      }),
    ).toBeInTheDocument()

    finishTransition()
    await transitionFinished
  })

  it('renders the empty catalog outcome', async () => {
    vi.stubEnv('API_KEY', 'test-key')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([])))

    renderCatalog()

    expect(await screen.findByText('0 Results')).toBeInTheDocument()
    expect(screen.getByText('No Products found.')).toBeInTheDocument()
  })

  it.each([
    {
      expected: 'The Product catalog response is invalid.',
      response: jsonResponse({ unexpected: true }),
    },
    {
      expected: 'The Product catalog could not be authenticated.',
      response: jsonResponse({ message: 'Unauthorized' }, 401),
    },
  ])(
    'renders a recoverable API error: $expected',
    async ({ expected, response }) => {
      vi.stubEnv('API_KEY', 'test-key')
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

      renderCatalog()

      expect(await screen.findByRole('alert')).toHaveTextContent(expected)
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    },
  )

  it('preserves the search input while recovering from an inline retry', async () => {
    const user = userEvent.setup()
    vi.stubEnv('API_KEY', 'test-key')
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(jsonResponse([productPayload('3')]))
    vi.stubGlobal('fetch', fetcher)

    renderCatalog('/?search=Samsung')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Check your connection and try loading the catalog again.',
    )
    expect(
      screen.getByRole('searchbox', { name: 'Search Products' }),
    ).toHaveValue('Samsung')

    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findByText('Product 3')).toBeInTheDocument()
    expect(
      screen.getByRole('searchbox', { name: 'Search Products' }),
    ).toHaveValue('Samsung')
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(
      fetcher.mock.calls.every(([request]) =>
        String(request).includes('search=Samsung'),
      ),
    ).toBe(true)
  })

  it('replaces an image that fails without removing Product information', async () => {
    vi.stubEnv('API_KEY', 'test-key')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse([productPayload('4')])),
    )

    renderCatalog()

    const image = await screen.findByRole('img', {
      name: 'Brand 4 Product 4',
    })
    fireEvent.error(image)

    expect(
      screen.getByRole('img', {
        name: 'Brand 4 Product 4 image unavailable',
      }),
    ).toHaveTextContent('Image unavailable')
    expect(screen.getByText('Product 4')).toBeInTheDocument()
  })
})
