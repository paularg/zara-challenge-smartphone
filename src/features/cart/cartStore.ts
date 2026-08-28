import { create } from 'zustand'
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from 'zustand/middleware'

import {
  addCartLine,
  decrementCartLine,
  normalizePersistedCartStorageValue,
  restoreCartLines,
  selectCartTotal,
  selectCartUnitCount,
  type CartLine,
  type CartLineId,
  type CartLineInput,
} from './cartRules'

export { selectCartTotal, selectCartUnitCount }
export type { CartLine, CartLineInput }

export const CART_STORAGE_KEY = 'mbst-cart'
export const CART_STORAGE_VERSION = 1

type CartState = {
  lines: CartLine[]
  addLine: (line: CartLineInput) => void
  decrementLine: (lineId: CartLineId) => void
}

type PersistedCartState = Pick<CartState, 'lines'>

const createCartStateStorage = (): StateStorage => {
  const storage = window.localStorage

  return {
    getItem: (name) => {
      const storedValue = storage.getItem(name)
      const normalizedValue = normalizePersistedCartStorageValue(
        storedValue,
        CART_STORAGE_VERSION,
      )

      if (normalizedValue !== storedValue && normalizedValue !== null) {
        storage.setItem(name, normalizedValue)
      }

      return normalizedValue
    },
    removeItem: (name) => storage.removeItem(name),
    setItem: (name, value) => storage.setItem(name, value),
  }
}

export const useCartStore = create<CartState>()(
  persist<CartState, [], [], PersistedCartState>(
    (set) => ({
      lines: [],
      addLine: (line) =>
        set((state) => ({ lines: addCartLine(state.lines, line) })),
      decrementLine: (lineId) =>
        set((state) => ({ lines: decrementCartLine(state.lines, lineId) })),
    }),
    {
      name: CART_STORAGE_KEY,
      version: CART_STORAGE_VERSION,
      storage: createJSONStorage(createCartStateStorage),
      partialize: (state) => ({ lines: state.lines }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        lines: restoreCartLines(persistedState),
      }),
    },
  ),
)
