import { describe, expect, it } from 'vitest'

import {
  addCartLine,
  createCartLineId,
  decrementCartLine,
  normalizePersistedCartStorageValue,
  restoreCartLines,
  selectCartTotal,
  selectCartUnitCount,
  type CartLineInput,
} from './cartRules'

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

const validLine = () => addCartLine([], galaxyVariant())[0]
const persistedLine = (overrides: Record<string, unknown>) => ({
  lines: [{ ...validLine(), ...overrides }],
})

describe('Cart line rules', () => {
  it('identifies a Product variant by Product, color, and storage only', () => {
    const original = galaxyVariant()
    const refreshedPresentation = galaxyVariant({
      brand: 'Samsung Mobile',
      imageUrl: 'https://images.example.com/refreshed.png',
      name: 'Galaxy S24 Ultra 5G',
      unitPrice: 1299,
    })

    expect(createCartLineId(original)).toBe(
      createCartLineId(refreshedPresentation),
    )
  })

  it.each([
    ['Product', { productId: 'galaxy-s24-plus' }],
    ['color', { color: 'Black titanium' }],
    ['storage', { storage: '512 GB' }],
  ])('keeps a different %s as a distinct Cart line', (_field, difference) => {
    const firstLine = addCartLine([], galaxyVariant())
    const lines = addCartLine(firstLine, galaxyVariant(difference))

    expect(lines).toHaveLength(2)
  })

  it('merges an exact repeat while retaining the original captured values', () => {
    const original = galaxyVariant()
    const firstLine = addCartLine([], original)
    const lines = addCartLine(
      firstLine,
      galaxyVariant({
        imageUrl: 'https://images.example.com/new-remote-image.png',
        unitPrice: 1299,
      }),
    )

    expect(lines).toEqual([
      expect.objectContaining({
        imageUrl: original.imageUrl,
        quantity: 2,
        unitPrice: 1099,
      }),
    ])
  })

  it('sums every Cart line quantity for the Cart unit count', () => {
    const repeatedVariant = addCartLine(
      addCartLine([], galaxyVariant()),
      galaxyVariant(),
    )
    const lines = addCartLine(
      repeatedVariant,
      galaxyVariant({ storage: '512 GB', unitPrice: 1199 }),
    )

    expect(selectCartUnitCount({ lines })).toBe(3)
  })

  it('totals captured unit price multiplied by quantity for every line', () => {
    const repeatedVariant = addCartLine(
      addCartLine([], galaxyVariant()),
      galaxyVariant(),
    )
    const lines = addCartLine(
      repeatedVariant,
      galaxyVariant({ storage: '512 GB', unitPrice: 1199 }),
    )

    expect(selectCartTotal({ lines })).toBe(3397)
  })

  it('decrements exactly one unit from the matching Cart line', () => {
    const repeatedVariant = addCartLine(
      addCartLine([], galaxyVariant()),
      galaxyVariant(),
    )
    const [line] = repeatedVariant

    expect(decrementCartLine(repeatedVariant, line.id)).toEqual([
      { ...line, quantity: 1 },
    ])
  })

  it('removes a Cart line when its quantity reaches zero', () => {
    const [line] = addCartLine([], galaxyVariant())

    expect(decrementCartLine([line], line.id)).toEqual([])
  })
})

describe('Cart hydration rules', () => {
  it('restores valid captured Cart lines', () => {
    const lines = addCartLine([], galaxyVariant())

    expect(restoreCartLines({ lines })).toEqual(lines)
  })

  it.each([
    ['id', { id: '' }],
    ['Product id', { productId: '' }],
    ['brand', { brand: '' }],
    ['name', { name: '' }],
    ['image URL', { imageUrl: '' }],
    ['color', { color: '' }],
    ['storage', { storage: '' }],
  ])('rejects a line without a valid %s', (_field, invalidValue) => {
    expect(restoreCartLines(persistedLine(invalidValue))).toEqual([])
  })

  it.each([
    ['a negative price', -1],
    ['a non-finite price', Number.POSITIVE_INFINITY],
    ['a non-numeric price', '1099'],
  ])('rejects a line with %s', (_label, unitPrice) => {
    expect(restoreCartLines(persistedLine({ unitPrice }))).toEqual([])
  })

  it.each([
    ['zero', 0],
    ['a fraction', 1.5],
    ['an unsafe integer', Number.MAX_SAFE_INTEGER + 1],
    ['a non-numeric value', '1'],
  ])('rejects a line with %s as its quantity', (_label, quantity) => {
    expect(restoreCartLines(persistedLine({ quantity }))).toEqual([])
  })

  it.each([
    ['a non-object value', null],
    ['a missing lines array', {}],
    ['a non-array lines value', { lines: 'invalid' }],
    ['a line with a forged identity', persistedLine({ id: 'forged-line-id' })],
    [
      'duplicate Product variant lines',
      {
        lines: [
          addCartLine([], galaxyVariant())[0],
          addCartLine([], galaxyVariant())[0],
        ],
      },
    ],
  ])('rejects %s as an empty Cart', (_label, persistedState) => {
    expect(restoreCartLines(persistedState)).toEqual([])
  })
})

describe('Cart persistence rules', () => {
  const storageVersion = 1
  const emptyPersistedCart = JSON.stringify({
    state: { lines: [] },
    version: storageVersion,
  })

  it('keeps a valid persisted Cart available for hydration', () => {
    const storedValue = JSON.stringify({
      state: { lines: [validLine()] },
      version: storageVersion,
    })

    expect(
      normalizePersistedCartStorageValue(storedValue, storageVersion),
    ).toBe(storedValue)
  })

  it('normalizes malformed JSON to an empty current-version Cart', () => {
    expect(
      normalizePersistedCartStorageValue('{not-json', storageVersion),
    ).toBe(emptyPersistedCart)
  })

  it('normalizes an unsupported version to an empty current-version Cart', () => {
    const storedValue = JSON.stringify({
      state: { lines: [validLine()] },
      version: storageVersion + 1,
    })

    expect(
      normalizePersistedCartStorageValue(storedValue, storageVersion),
    ).toBe(emptyPersistedCart)
  })

  it('normalizes structurally invalid lines to an empty current-version Cart', () => {
    const storedValue = JSON.stringify({
      state: persistedLine({ quantity: 0 }),
      version: storageVersion,
    })

    expect(
      normalizePersistedCartStorageValue(storedValue, storageVersion),
    ).toBe(emptyPersistedCart)
  })
})
