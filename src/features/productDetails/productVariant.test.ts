import { describe, expect, it } from 'vitest'

import type { ProductDetails } from './productDetailsService'
import { createProductVariant } from '.'

const product: ProductDetails = {
  id: 'galaxy-s24-ultra',
  brand: 'Samsung',
  name: 'Galaxy S24 Ultra',
  description: 'A flagship Product.',
  basePrice: 1099,
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
      name: 'Blue titanium',
      hexCode: '#4d4e5f',
      imageUrl: 'https://images.example.com/blue.png',
    },
  ],
  storageOptions: [{ capacity: '512 GB', price: 1199 }],
  similarProducts: [],
}

describe('Product variant contract', () => {
  it('defines a complete Product variant from Product, color, and storage', () => {
    expect(
      createProductVariant(
        product,
        product.colorOptions[0],
        product.storageOptions[0],
      ),
    ).toEqual({
      product,
      color: product.colorOptions[0],
      storage: product.storageOptions[0],
    })
  })

  it('does not create a Product variant until color and storage are selected', () => {
    expect(createProductVariant(product, null, product.storageOptions[0])).toBe(
      null,
    )
    expect(createProductVariant(product, product.colorOptions[0], null)).toBe(
      null,
    )
  })
})
