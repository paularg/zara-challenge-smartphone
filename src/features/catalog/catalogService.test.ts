import { describe, expect, it, vi } from 'vitest'

import { fetchProducts, normalizeProductList } from './catalogService'

const productPayload = (
  id: string,
  overrides: Record<string, unknown> = {},
) => ({
  id,
  brand: `Brand ${id}`,
  name: `Product ${id}`,
  basePrice: Number(id) || 100,
  imageUrl: `http://images.example.com/${id}.png`,
  ...overrides,
})

describe('catalog API boundary', () => {
  it('normalizes the live array, removes duplicate Product identities, repairs images, and keeps the first 20 unique Products', () => {
    const payload = [
      productPayload('1', {
        imageUrl: 'HTTP://images.example.com/1.png',
        unknownField: 'must not cross the boundary',
      }),
      productPayload('1', { name: 'Duplicate must be ignored' }),
      ...Array.from({ length: 21 }, (_, index) =>
        productPayload(String(index + 2)),
      ),
    ]

    const result = normalizeProductList(payload)

    expect(result).toEqual({
      status: 'success',
      products: Array.from({ length: 20 }, (_, index) => ({
        id: String(index + 1),
        brand: `Brand ${index + 1}`,
        name: `Product ${index + 1}`,
        basePrice: index + 1,
        imageUrl: `https://images.example.com/${index + 1}.png`,
      })),
    })
  })

  it.each([
    {
      label: 'an object that is not a Product',
      payload: { unexpected: true },
    },
    {
      label: 'a Product without every consumed field',
      payload: [productPayload('1', { brand: undefined })],
    },
  ])('rejects $label as an invalid payload', ({ payload }) => {
    expect(normalizeProductList(payload)).toEqual({
      status: 'error',
      error: {
        kind: 'invalid-payload',
        message: 'The Product catalog response is invalid.',
      },
    })
  })

  it('also supports the single Product object documented by OpenAPI', () => {
    expect(normalizeProductList(productPayload('1'))).toEqual({
      status: 'success',
      products: [
        {
          id: '1',
          brand: 'Brand 1',
          name: 'Product 1',
          basePrice: 1,
          imageUrl: 'https://images.example.com/1.png',
        },
      ],
    })
  })

  it('sends the configured API key in x-api-key', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify([productPayload('1')]), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }),
    )

    const result = await fetchProducts({ apiKey: 'configured-key', fetcher })

    expect(fetcher).toHaveBeenCalledWith(
      'https://prueba-tecnica-api-tienda-moviles.onrender.com/products',
      expect.objectContaining({
        headers: { 'x-api-key': 'configured-key' },
      }),
    )
    expect(result.status).toBe('success')
  })

  it('searches without pagination and returns every normalized unique match', async () => {
    const controller = new AbortController()
    const payload = [
      productPayload('1'),
      productPayload('1', { name: 'Duplicate must be ignored' }),
      ...Array.from({ length: 21 }, (_, index) =>
        productPayload(String(index + 2)),
      ),
    ]
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(payload), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }),
    )

    const result = await fetchProducts({
      apiKey: 'configured-key',
      fetcher,
      query: 'Brand 1',
      signal: controller.signal,
    })

    const requestUrl = new URL(String(fetcher.mock.calls[0]?.[0]))
    expect(requestUrl.searchParams.get('search')).toBe('Brand 1')
    expect(requestUrl.searchParams.has('limit')).toBe(false)
    expect(requestUrl.searchParams.has('offset')).toBe(false)
    expect(fetcher).toHaveBeenCalledWith(
      requestUrl.toString(),
      expect.objectContaining({ signal: controller.signal }),
    )
    expect(result).toMatchObject({ status: 'success' })
    if (result.status === 'success') {
      expect(result.products).toHaveLength(22)
      expect(new Set(result.products.map(({ id }) => id)).size).toBe(22)
      expect(result.products[0]?.imageUrl).toBe(
        'https://images.example.com/1.png',
      )
    }
  })

  it('reports missing API_KEY clearly without making a request', async () => {
    const fetcher = vi.fn<typeof fetch>()

    await expect(fetchProducts({ apiKey: '', fetcher })).resolves.toEqual({
      status: 'error',
      error: {
        kind: 'configuration',
        message: 'API_KEY is not configured. Add it to the local .env file.',
      },
    })
    expect(fetcher).not.toHaveBeenCalled()
  })
})
