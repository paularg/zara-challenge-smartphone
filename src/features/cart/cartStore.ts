import { create } from 'zustand'

type CartState = {
  unitCount: number
}

export const useCartStore = create<CartState>(() => ({ unitCount: 0 }))
