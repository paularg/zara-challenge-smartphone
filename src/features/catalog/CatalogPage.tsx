import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import closeSmallIcon from '@/assets/close-small.svg'
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
  const {
    catalogState,
    clearSearch,
    confirmedQuery,
    isSearchPending,
    query,
    retry,
    setQuery,
  } = useCatalog()
  const searchInputRef = useRef<HTMLInputElement>(null)

  const handleClearSearch = () => {
    clearSearch()
    searchInputRef.current?.focus()
  }

  const catalogStatus =
    catalogState.status === 'loading'
      ? 'Loading Products'
      : catalogState.status === 'success'
        ? `${catalogState.products.length} ${
            catalogState.products.length === 1 ? 'Result' : 'Results'
          }`
        : ''

  return (
    <section aria-labelledby="catalog-heading" className="pt-6 md:pt-12">
      <h1 className="sr-only" id="catalog-heading">
        Catalog
      </h1>
      <div className="flex flex-col gap-3 px-4 py-3 md:px-10 xl:px-[100px]">
        <div className="flex h-[27px] items-center gap-3 border-b-[0.5px] pb-2">
          <label className="sr-only" htmlFor="product-search">
            Search Products
          </label>
          <input
            autoComplete="off"
            className="placeholder:text-placeholder focus-visible:outline-ring min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-base leading-[1.2] font-light outline-none focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-search-cancel-button]:appearance-none"
            id="product-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for a smartphone..."
            ref={searchInputRef}
            type="search"
            value={query}
          />
          {query ? (
            <button
              aria-label="Clear search"
              className="focus-outline -m-0.5 flex size-6 shrink-0 items-center justify-center border-0 bg-transparent p-0"
              onClick={handleClearSearch}
              type="button"
            >
              <img alt="" className="size-5" src={closeSmallIcon} />
            </button>
          ) : null}
        </div>
        <div className="flex h-6 items-center">
          <p
            aria-atomic="true"
            aria-label="Catalog status"
            className="m-0 text-xs leading-[1.25] font-light uppercase"
            role="status"
          >
            {catalogStatus}
          </p>
          <p
            aria-atomic="true"
            aria-label="Search status"
            className="sr-only"
            role="status"
          >
            {isSearchPending ? 'Searching Products' : ''}
          </p>
        </div>
      </div>

      <div
        aria-busy={isSearchPending}
        className="mt-6 px-4 md:mt-12 md:px-10 xl:px-[100px]"
      >
        {catalogState.status === 'loading' ? <LoadingGrid /> : null}
        {catalogState.status === 'error' ? (
          <div className="flex min-h-[344px] flex-col items-start justify-center gap-6 border-y-[0.5px] py-10">
            <div className="flex flex-col gap-2" role="alert">
              <h2 className="m-0 text-xl leading-[1.2] font-light uppercase">
                {confirmedQuery ? 'Search unavailable' : 'Catalog unavailable'}
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
          <div className="flex min-h-[344px] flex-col items-center justify-center gap-6 border-y-[0.5px] py-10 text-center">
            <p className="m-0 text-xs leading-[1.25] font-light uppercase">
              {confirmedQuery
                ? `No Products found for “${confirmedQuery}”.`
                : 'No Products found.'}
            </p>
            {confirmedQuery ? (
              <Button
                onClick={handleClearSearch}
                type="button"
                variant="outline"
              >
                Clear search
              </Button>
            ) : null}
          </div>
        ) : null}
        {catalogState.status === 'success' &&
        catalogState.products.length > 0 ? (
          <ProductGrid products={catalogState.products} />
        ) : null}
      </div>
    </section>
  )
}
