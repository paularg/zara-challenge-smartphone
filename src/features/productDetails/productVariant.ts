import type { ProductDetails } from './productDetailsService'

export type ProductColor = ProductDetails['colorOptions'][number]
export type ProductStorage = ProductDetails['storageOptions'][number]

export type ProductVariant = {
  product: ProductDetails
  color: ProductColor
  storage: ProductStorage
}

export const createProductVariant = (
  product: ProductDetails,
  color: ProductColor | null,
  storage: ProductStorage | null,
): ProductVariant | null =>
  color && storage ? { product, color, storage } : null
