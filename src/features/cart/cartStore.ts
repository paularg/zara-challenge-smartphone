import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export const CART_STORAGE_KEY = 'mbst-cart'
export const CART_STORAGE_VERSION = 1

export type CartLineInput = {
  productId: string
  brand: string
  name: string
  imageUrl: string
  color: string
  storage: string
  unitPrice: number
}

export type CartLine = CartLineInput & {
  id: string
  quantity: number
}

type CartState = {
  lines: CartLine[]
  addLine: (line: CartLineInput) => void
  decrementLine: (lineId: string) => void
}

type PersistedCartState = Pick<CartState, 'lines'>

const createCartLineId = ({
  color,
  productId,
  storage,
}: Pick<CartLineInput, 'color' | 'productId' | 'storage'>) =>
  JSON.stringify([productId, color, storage])

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
    !Number.isInteger(value.quantity) ||
    value.quantity < 1
  ) {
    return false
  }

  return value.id === createCartLineId(value as CartLine)
}

const readPersistedCart = (value: unknown): PersistedCartState | null => {
  if (
    !isRecord(value) ||
    !Array.isArray(value.lines) ||
    !value.lines.every(isCartLine)
  ) {
    return null
  }

  return { lines: value.lines }
}

export const selectCartUnitCount = (state: Pick<CartState, 'lines'>): number =>
  state.lines.reduce((unitCount, line) => unitCount + line.quantity, 0)

export const selectCartTotal = (state: Pick<CartState, 'lines'>): number =>
  state.lines.reduce((total, line) => total + line.unitPrice * line.quantity, 0)

export const useCartStore = create<CartState>()(
  persist<CartState, [], [], PersistedCartState>(
    (set) => ({
      lines: [],
      addLine: (line) =>
        set((state) => {
          const lineId = createCartLineId(line)
          const existingLine = state.lines.find(
            (cartLine) => cartLine.id === lineId,
          )

          if (!existingLine) {
            return {
              lines: [...state.lines, { ...line, id: lineId, quantity: 1 }],
            }
          }

          return {
            lines: state.lines.map((cartLine) =>
              cartLine.id === lineId
                ? { ...cartLine, quantity: cartLine.quantity + 1 }
                : cartLine,
            ),
          }
        }),
      decrementLine: (lineId) =>
        set((state) => ({
          lines: state.lines.flatMap((line) => {
            if (line.id !== lineId) {
              return [line]
            }

            return line.quantity > 1
              ? [{ ...line, quantity: line.quantity - 1 }]
              : []
          }),
        })),
    }),
    {
      name: CART_STORAGE_KEY,
      version: CART_STORAGE_VERSION,
      storage: createJSONStorage(() => window.localStorage),
      partialize: (state) => ({ lines: state.lines }),
      migrate: () => ({ lines: [] }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        lines: readPersistedCart(persistedState)?.lines ?? [],
      }),
    },
  ),
)
