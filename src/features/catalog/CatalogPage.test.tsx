import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
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

const renderCatalog = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route
          path="/products/:productId"
          element={<h1>Matching Product detail</h1>}
        />
      </Routes>
    </MemoryRouter>,
  )

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('Product catalog', () => {
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
    expect(screen.getByRole('status')).toHaveTextContent('Loading Products')
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

  it('recovers from a network error when the customer retries', async () => {
    const user = userEvent.setup()
    vi.stubEnv('API_KEY', 'test-key')
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(jsonResponse([productPayload('3')]))
    vi.stubGlobal('fetch', fetcher)

    renderCatalog()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Check your connection and try loading the catalog again.',
    )

    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findByText('Product 3')).toBeInTheDocument()
    expect(fetcher).toHaveBeenCalledTimes(2)
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
