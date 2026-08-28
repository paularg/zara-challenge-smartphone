import { describe, expect, it, vi } from 'vitest'

import {
  fetchProductDetails,
  normalizeProductDetails,
} from './productDetailsService'

const productDetailsPayload = {
  id: 'galaxy-s24-ultra',
  brand: 'Samsung',
  name: 'Galaxy S24 Ultra',
  description: 'A flagship Product.',
  basePrice: 1099,
  rating: 4.8,
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
      ignored: true,
    },
  ],
  storageOptions: [{ capacity: '256 GB', price: 1099 }],
  similarProducts: [
    {
      id: 'iphone-15-pro',
      brand: 'Apple',
      name: 'iPhone 15 Pro',
      basePrice: 1219,
      imageUrl: 'http://images.example.com/iphone.png',
    },
  ],
  ignored: true,
}

describe('Product detail API boundary', () => {
  it('normalizes the documented Product detail payload and repairs every image URL', () => {
    expect(normalizeProductDetails(productDetailsPayload)).toEqual({
      status: 'success',
      product: {
        id: 'galaxy-s24-ultra',
        brand: 'Samsung',
        name: 'Galaxy S24 Ultra',
        description: 'A flagship Product.',
        basePrice: 1099,
        specs: productDetailsPayload.specs,
        colorOptions: [
          {
            name: 'Black titanium',
            hexCode: '#62605f',
            imageUrl: 'https://images.example.com/black.png',
          },
        ],
        storageOptions: [{ capacity: '256 GB', price: 1099 }],
        similarProducts: [
          {
            id: 'iphone-15-pro',
            brand: 'Apple',
            name: 'iPhone 15 Pro',
            basePrice: 1219,
            imageUrl: 'https://images.example.com/iphone.png',
          },
        ],
      },
    })
  })

  it('requests the matching Product with authentication and cancellation support', async () => {
    const controller = new AbortController()
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          ...productDetailsPayload,
          id: 'galaxy/s24 ultra',
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        },
      ),
    )

    const result = await fetchProductDetails({
      apiKey: 'configured-key',
      fetcher,
      productId: 'galaxy/s24 ultra',
      signal: controller.signal,
    })

    expect(fetcher).toHaveBeenCalledWith(
      'https://prueba-tecnica-api-tienda-moviles.onrender.com/products/galaxy%2Fs24%20ultra',
      {
        headers: { 'x-api-key': 'configured-key' },
        signal: controller.signal,
      },
    )
    expect(result.status).toBe('success')
  })

  it('rejects a valid detail payload that does not match the requested Product', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify(productDetailsPayload), { status: 200 }),
      )

    await expect(
      fetchProductDetails({
        apiKey: 'configured-key',
        fetcher,
        productId: 'another-product',
      }),
    ).resolves.toEqual({
      status: 'error',
      error: {
        kind: 'invalid-payload',
        message: 'The Product detail response is invalid.',
      },
    })
  })

  it('reports an authentication failure without exposing the transport response', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
      }),
    )

    await expect(
      fetchProductDetails({
        apiKey: 'invalid-key',
        fetcher,
        productId: 'product-1',
      }),
    ).resolves.toEqual({
      status: 'error',
      error: {
        kind: 'authentication',
        message: 'The Product detail could not be authenticated.',
      },
    })
  })

  it('distinguishes a missing Product from other failures', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify({ message: 'Not found' }), { status: 404 }),
      )

    await expect(
      fetchProductDetails({
        apiKey: 'configured-key',
        fetcher,
        productId: 'missing-product',
      }),
    ).resolves.toEqual({
      status: 'error',
      error: {
        kind: 'not-found',
        message: 'The requested Product was not found.',
      },
    })
  })

  it('reports a missing API key without making a request', async () => {
    const fetcher = vi.fn<typeof fetch>()

    await expect(
      fetchProductDetails({
        apiKey: '',
        fetcher,
        productId: 'product-1',
      }),
    ).resolves.toEqual({
      status: 'error',
      error: {
        kind: 'configuration',
        message: 'API_KEY is not configured. Add it to the local .env file.',
      },
    })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('turns a network rejection into a recoverable result', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new TypeError('offline'))

    await expect(
      fetchProductDetails({
        apiKey: 'configured-key',
        fetcher,
        productId: 'product-1',
      }),
    ).resolves.toEqual({
      status: 'error',
      error: {
        kind: 'network',
        message: 'Check your connection and try loading the Product again.',
      },
    })
  })

  it('rejects malformed JSON as an invalid Product detail payload', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('{', { status: 200 }))

    await expect(
      fetchProductDetails({
        apiKey: 'configured-key',
        fetcher,
        productId: 'product-1',
      }),
    ).resolves.toEqual({
      status: 'error',
      error: {
        kind: 'invalid-payload',
        message: 'The Product detail response is invalid.',
      },
    })
  })

  it('reports an unexpected HTTP failure as a server error', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Unavailable' }), {
        status: 503,
      }),
    )

    await expect(
      fetchProductDetails({
        apiKey: 'configured-key',
        fetcher,
        productId: 'product-1',
      }),
    ).resolves.toEqual({
      status: 'error',
      error: {
        kind: 'server',
        message: 'The Product detail could not be loaded.',
      },
    })
  })
})
