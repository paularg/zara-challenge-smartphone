export type CartLineInput = {
  productId: string
  brand: string
  name: string
  imageUrl: string
  color: string
  storage: string
  unitPrice: number
}

declare const cartLineIdBrand: unique symbol

export type CartLineId = string & {
  readonly [cartLineIdBrand]: true
}

export type CartLine = CartLineInput & {
  id: CartLineId
  quantity: number
}

type CartLinesState = {
  lines: CartLine[]
}

export const createCartLineId = ({
  color,
  productId,
  storage,
}: Pick<CartLineInput, 'color' | 'productId' | 'storage'>): CartLineId =>
  JSON.stringify([productId, color, storage]) as CartLineId

export const addCartLine = (
  lines: CartLine[],
  line: CartLineInput,
): CartLine[] => {
  const lineId = createCartLineId(line)
  const existingLine = lines.find((cartLine) => cartLine.id === lineId)

  if (!existingLine) {
    return [...lines, { ...line, id: lineId, quantity: 1 }]
  }

  return lines.map((cartLine) =>
    cartLine.id === lineId
      ? { ...cartLine, quantity: cartLine.quantity + 1 }
      : cartLine,
  )
}

export const decrementCartLine = (
  lines: CartLine[],
  lineId: CartLineId,
): CartLine[] =>
  lines.flatMap((line) => {
    if (line.id !== lineId) {
      return [line]
    }

    return line.quantity > 1 ? [{ ...line, quantity: line.quantity - 1 }] : []
  })

export const selectCartUnitCount = (state: CartLinesState): number =>
  state.lines.reduce((unitCount, line) => unitCount + line.quantity, 0)

export const selectCartTotal = (state: CartLinesState): number =>
  state.lines.reduce((total, line) => total + line.unitPrice * line.quantity, 0)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0

const isCartLine = (value: unknown): value is CartLine => {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.productId) ||
    !isNonEmptyString(value.brand) ||
    !isNonEmptyString(value.name) ||
    !isNonEmptyString(value.imageUrl) ||
    !isNonEmptyString(value.color) ||
    !isNonEmptyString(value.storage) ||
    typeof value.unitPrice !== 'number' ||
    !Number.isFinite(value.unitPrice) ||
    value.unitPrice < 0 ||
    typeof value.quantity !== 'number' ||
    !Number.isSafeInteger(value.quantity) ||
    value.quantity < 1
  ) {
    return false
  }

  return (
    value.id ===
    createCartLineId({
      color: value.color,
      productId: value.productId,
      storage: value.storage,
    })
  )
}

const readCartLines = (value: unknown): CartLine[] | null => {
  if (!isRecord(value) || !Array.isArray(value.lines)) {
    return null
  }

  const lineIds = new Set<string>()
  const lines: CartLine[] = []

  for (const line of value.lines) {
    if (!isCartLine(line) || lineIds.has(line.id)) {
      return null
    }

    lineIds.add(line.id)
    lines.push(line)
  }

  return lines
}

export const restoreCartLines = (value: unknown): CartLine[] =>
  readCartLines(value) ?? []

const emptyPersistedCart = (version: number): string =>
  JSON.stringify({ state: { lines: [] }, version })

export const normalizePersistedCartStorageValue = (
  storedValue: string | null,
  expectedVersion: number,
): string | null => {
  if (storedValue === null) {
    return null
  }

  try {
    const persistedCart: unknown = JSON.parse(storedValue)

    if (
      !isRecord(persistedCart) ||
      persistedCart.version !== expectedVersion ||
      !('state' in persistedCart)
    ) {
      return emptyPersistedCart(expectedVersion)
    }

    const lines = readCartLines(persistedCart.state)

    return lines === null
      ? emptyPersistedCart(expectedVersion)
      : JSON.stringify({ state: { lines }, version: expectedVersion })
  } catch {
    return emptyPersistedCart(expectedVersion)
  }
}
