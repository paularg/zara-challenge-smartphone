import { Navigate, Route, Routes } from 'react-router-dom'

import { Header } from '@/components/shared/Header'
import { CartPage, useCartStore } from '@/features/cart'
import { CatalogPage } from '@/features/catalog'
import { ProductDetailsPage } from '@/features/productDetails'

const App = () => {
  const cartUnitCount = useCartStore((state) => state.unitCount)

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
          <Route path="/products/:productId" element={<ProductDetailsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
