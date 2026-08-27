import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

import type { Product } from './catalogService'
import { useCatalog } from './useCatalog'

const loadingCards = Array.from({ length: 5 }, (_, index) => index)
const productGridClassName =
  'm-0 grid list-none grid-cols-1 gap-0 p-0 min-[1576px]:!grid-cols-4 min-[1920px]:!grid-cols-5 md:grid-cols-2 xl:grid-cols-3'

const ProductCard = ({ product }: { product: Product }) => {
  const [imageFailed, setImageFailed] = useState(false)
  const imageName = `${product.brand} ${product.name}`

  return (
    <li className="border-border bg-card h-[344px] border-[0.5px] md:aspect-square md:h-auto">
      <Link
        aria-label={`Open ${imageName}`}
        className="focus-outline group flex h-full min-h-0 flex-col gap-6 overflow-hidden p-4 hover:bg-black hover:text-white"
        to={`/products/${encodeURIComponent(product.id)}`}
      >
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
          {imageFailed ? (
            <div
              aria-label={`${imageName} image unavailable`}
              className="text-muted-foreground group-hover:text-border-subtle flex size-full items-center justify-center text-center text-xs font-light uppercase"
              role="img"
            >
              Image unavailable
            </div>
          ) : (
            <img
              alt={imageName}
              className="size-full object-contain"
              onError={() => setImageFailed(true)}
              src={product.imageUrl}
            />
          )}
        </div>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
          <div className="min-w-0">
            <p className="text-muted-foreground group-hover:text-border-subtle truncate text-[10px] leading-[1.2] font-light uppercase">
              {product.brand}
            </p>
            <p className="truncate text-xs leading-[1.25] font-light uppercase">
              {product.name}
            </p>
          </div>
          <p className="text-xs leading-[1.25] font-light whitespace-nowrap">
            {product.basePrice} EUR
          </p>
        </div>
      </Link>
    </li>
  )
}

const ProductGrid = ({ products }: { products: Product[] }) => (
  <ul aria-label="Products" className={productGridClassName}>
    {products.map((product) => (
      <ProductCard key={product.id} product={product} />
    ))}
  </ul>
)

const LoadingGrid = () => (
  <ul aria-label="Products" className={productGridClassName}>
    {loadingCards.map((card) => (
      <li
        aria-hidden="true"
        className="border-border bg-disabled h-[344px] border-[0.5px] md:aspect-square md:h-auto"
        key={card}
      />
    ))}
  </ul>
)

export const CatalogPage = () => {
  const { catalogState, retry } = useCatalog()

  return (
    <section aria-labelledby="catalog-heading" className="pt-6 md:pt-12">
      <h1 className="sr-only" id="catalog-heading">
        Catalog
      </h1>
      <div className="px-4 py-3 md:px-10 xl:px-[100px]">
        {catalogState.status === 'loading' ? (
          <p
            className="m-0 text-xs leading-[1.25] font-light uppercase"
            role="status"
          >
            Loading Products
          </p>
        ) : null}
        {catalogState.status === 'success' ? (
          <p
            aria-live="polite"
            className="m-0 text-xs leading-[1.25] font-light uppercase"
          >
            {catalogState.products.length}{' '}
            {catalogState.products.length === 1 ? 'Result' : 'Results'}
          </p>
        ) : null}
      </div>

      <div className="mt-6 px-4 md:mt-12 md:px-10 xl:px-[100px]">
        {catalogState.status === 'loading' ? <LoadingGrid /> : null}
        {catalogState.status === 'error' ? (
          <div className="flex min-h-[344px] flex-col items-start justify-center gap-6 border-y-[0.5px] py-10">
            <div className="flex flex-col gap-2" role="alert">
              <h2 className="m-0 text-xl leading-[1.2] font-light uppercase">
                Catalog unavailable
              </h2>
              <p className="m-0 max-w-prose text-xs leading-[1.25] font-light">
                {catalogState.error.message}
              </p>
            </div>
            <Button onClick={retry} type="button">
              Retry
            </Button>
          </div>
        ) : null}
        {catalogState.status === 'success' &&
        catalogState.products.length === 0 ? (
          <p className="m-0 border-y-[0.5px] py-20 text-center text-xs leading-[1.25] font-light uppercase">
            No Products found.
          </p>
        ) : null}
        {catalogState.status === 'success' &&
        catalogState.products.length > 0 ? (
          <ProductGrid products={catalogState.products} />
        ) : null}
      </div>
    </section>
  )
}
