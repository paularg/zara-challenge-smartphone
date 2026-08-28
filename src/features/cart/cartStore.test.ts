import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  CART_STORAGE_KEY,
  CART_STORAGE_VERSION,
  selectCartTotal,
  selectCartUnitCount,
  type CartLineInput,
  useCartStore,
} from './cartStore'

const galaxyVariant = (overrides: Partial<CartLineInput> = {}) => ({
  productId: 'galaxy-s24-ultra',
  brand: 'Samsung',
  name: 'Galaxy S24 Ultra',
  imageUrl: 'https://images.example.com/galaxy-blue.png',
  color: 'Blue titanium',
  storage: '256 GB',
  unitPrice: 1099,
  ...overrides,
})

const resetCart = () => {
  window.localStorage.clear()
  useCartStore.setState({ lines: [] })
}

beforeEach(resetCart)

describe('Cart store', () => {
  it('adds a captured Product variant with an initial quantity of one', () => {
    useCartStore.getState().addLine(galaxyVariant())

    expect(useCartStore.getState().lines).toEqual([
      expect.objectContaining({
        ...galaxyVariant(),
        quantity: 1,
      }),
    ])
  })

  it('merges the exact same Product variant without repricing its captured line', () => {
    useCartStore.getState().addLine(galaxyVariant())
    useCartStore.getState().addLine(
      galaxyVariant({
        imageUrl: 'https://images.example.com/new-remote-image.png',
        unitPrice: 1299,
      }),
    )

    expect(useCartStore.getState().lines).toEqual([
      expect.objectContaining({
        imageUrl: 'https://images.example.com/galaxy-blue.png',
        quantity: 2,
        unitPrice: 1099,
      }),
    ])
  })

  it('keeps different colors and storage capacities as separate Cart lines', () => {
    useCartStore.getState().addLine(galaxyVariant())
    useCartStore
      .getState()
      .addLine(galaxyVariant({ storage: '512 GB', unitPrice: 1199 }))
    useCartStore.getState().addLine(
      galaxyVariant({
        color: 'Black titanium',
        imageUrl: 'https://images.example.com/galaxy-black.png',
      }),
    )

    expect(useCartStore.getState().lines).toHaveLength(3)
  })

  it('derives Cart units and total, then decrements and removes a line', () => {
    useCartStore.getState().addLine(galaxyVariant())
    useCartStore.getState().addLine(galaxyVariant())
    useCartStore
      .getState()
      .addLine(galaxyVariant({ storage: '512 GB', unitPrice: 1199 }))

    expect(selectCartUnitCount(useCartStore.getState())).toBe(3)
    expect(selectCartTotal(useCartStore.getState())).toBe(3397)

    const [firstLine, secondLine] = useCartStore.getState().lines
    useCartStore.getState().decrementLine(firstLine.id)

    expect(selectCartUnitCount(useCartStore.getState())).toBe(2)
    expect(useCartStore.getState().lines[0].quantity).toBe(1)

    useCartStore.getState().decrementLine(firstLine.id)
    expect(useCartStore.getState().lines).toEqual([secondLine])
  })

  it('persists a versioned valid Cart and restores its captured values', async () => {
    useCartStore.getState().addLine(galaxyVariant())
    const storedCart = window.localStorage.getItem(CART_STORAGE_KEY)

    expect(JSON.parse(storedCart ?? '{}')).toMatchObject({
      state: { lines: [expect.objectContaining(galaxyVariant())] },
      version: CART_STORAGE_VERSION,
    })

    useCartStore.setState({ lines: [] })
    window.localStorage.setItem(CART_STORAGE_KEY, storedCart ?? '')
    await useCartStore.persist.rehydrate()

    expect(useCartStore.getState().lines).toEqual([
      expect.objectContaining({ ...galaxyVariant(), quantity: 1 }),
    ])
  })

  it.each([
    [
      'an incompatible version',
      JSON.stringify({
        state: {
          lines: [{ ...galaxyVariant(), id: 'stale', quantity: 1 }],
        },
        version: CART_STORAGE_VERSION + 1,
      }),
    ],
    [
      'invalid Cart data',
      JSON.stringify({
        state: {
          lines: [{ ...galaxyVariant(), id: 'invalid', quantity: 0 }],
        },
        version: CART_STORAGE_VERSION,
      }),
    ],
  ])('recovers %s as an empty Cart', async (_label, persistedCart) => {
    window.localStorage.setItem(CART_STORAGE_KEY, persistedCart)

    await useCartStore.persist.rehydrate()

    expect(useCartStore.getState().lines).toEqual([])
  })

  it('replaces malformed persisted JSON with an empty Cart without a console warning', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    useCartStore.getState().addLine(galaxyVariant())
    window.localStorage.setItem(CART_STORAGE_KEY, '{not-json')

    await useCartStore.persist.rehydrate()

    expect(useCartStore.getState().lines).toEqual([])
    expect(consoleError).not.toHaveBeenCalled()
    expect(consoleWarn).not.toHaveBeenCalled()
  })
})
