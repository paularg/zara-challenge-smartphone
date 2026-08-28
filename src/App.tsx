import { Navigate, Route, Routes } from 'react-router-dom'

import { Header } from '@/components/shared/Header'
import { CartPage, selectCartUnitCount, useCartStore } from '@/features/cart'
import { CatalogPage } from '@/features/catalog'
import {
  ProductDetailsPage,
  type ProductVariant,
} from '@/features/productDetails'

const App = () => {
  const cartUnitCount = useCartStore(selectCartUnitCount)
  const addCartLine = useCartStore((state) => state.addLine)

  const handleAddToCart = (variant: ProductVariant) => {
    addCartLine({
      brand: variant.product.brand,
      color: variant.color.name,
      imageUrl: variant.color.imageUrl,
      name: variant.product.name,
      productId: variant.product.id,
      storage: variant.storage.capacity,
      unitPrice: variant.storage.price,
    })
  }

  return (
    <div className="bg-background text-foreground min-h-svh">
      <a
        className="bg-primary text-primary-foreground sr-only z-10 px-4 py-3 focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
        href="#main-content"
      >
        Skip to content
      </a>
      <Header cartUnitCount={cartUnitCount} />
      <main id="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route
            path="/products/:productId"
            element={<ProductDetailsPage onAddToCart={handleAddToCart} />}
          />
          <Route path="/cart" element={<CartPage />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
