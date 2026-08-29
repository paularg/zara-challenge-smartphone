import type { ProductSpecs } from './productDetailsService'

export const withoutScreenRefreshRate = (specs: ProductSpecs): ProductSpecs => {
  const partialSpecs = { ...specs }
  delete partialSpecs.screenRefreshRate

  return partialSpecs
}
