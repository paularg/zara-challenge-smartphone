import { useEffect, useId, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import chevronLeft from '@/assets/chevron-left.svg'
import { ProductCard } from '@/components/shared/ProductCard'
import { Button } from '@/components/ui/button'

import type { ProductDetails } from './productDetailsService'
import {
  createProductVariant,
  type ProductColor,
  type ProductVariant,
} from './productVariant'
import { useProductDetails } from './useProductDetails'

const specificationRows = (product: ProductDetails) =>
  [
    ['Brand', product.brand],
    ['Name', product.name],
    ['Description', product.description],
    ['Screen', product.specs.screen],
    ['Resolution', product.specs.resolution],
    ['Processor', product.specs.processor],
    ['Main camera', product.specs.mainCamera],
    ['Selfie camera', product.specs.selfieCamera],
    ['Battery', product.specs.battery],
    ['OS', product.specs.os],
    ['Screen refresh rate', product.specs.screenRefreshRate],
  ] as const

const BackButton = () => {
  const navigate = useNavigate()

  const handleBack = () => {
    const historyIndex = window.history.state?.idx

    if (typeof historyIndex === 'number' && historyIndex > 0) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="flex h-11 items-center px-4 md:px-10 xl:px-[100px]">
      <button
        aria-label="Back"
        className="focus-outline -ml-1 inline-flex min-h-11 items-center gap-1 border-0 bg-transparent px-1 text-xs font-light uppercase"
        onClick={handleBack}
        type="button"
      >
        <img alt="" className="size-5" src={chevronLeft} />
        Back
      </button>
    </div>
  )
}

type ProductImageProps = {
  color: ProductColor
  isSelected: boolean
  product: ProductDetails
}

const ProductImage = ({ color, isSelected, product }: ProductImageProps) => {
  const [imageFailed, setImageFailed] = useState(false)
  const imageName = isSelected
    ? `${product.brand} ${product.name} in ${color.name}`
    : `${product.brand} ${product.name}`

  return (
    <div className="flex h-[273px] w-[260px] items-center justify-center overflow-hidden md:h-[416px] md:w-[337px] xl:h-[630px] xl:w-[510px]">
      {imageFailed ? (
        <div
          aria-label={`${imageName} image unavailable`}
          className="text-muted-foreground flex size-full items-center justify-center text-center text-xs font-light uppercase"
          role="img"
        >
          Image unavailable
        </div>
      ) : (
        <img
          alt={imageName}
          className="size-full object-contain"
          onError={() => setImageFailed(true)}
          src={color.imageUrl}
        />
      )}
    </div>
  )
}

const LoadingProduct = () => (
  <section aria-labelledby="product-heading" aria-busy="true">
    <BackButton />
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-4 pt-[5px] md:grid md:w-[calc(100%-80px)] md:max-w-[754px] md:grid-cols-[337px_minmax(0,1fr)] md:gap-[55px] md:px-0 md:pt-1 xl:w-[1200px] xl:max-w-[1200px] xl:grid-cols-[510px_380px] xl:gap-[170px] xl:pt-[110px]">
      <div className="bg-disabled h-[273px] w-[260px] md:h-[416px] md:w-[337px] xl:h-[630px] xl:w-[510px]" />
      <div className="flex flex-col gap-3 md:pt-7 xl:pt-[85px]">
        <h1
          className="m-0 text-xl leading-[1.2] font-light uppercase xl:text-2xl"
          id="product-heading"
        >
          Loading Product
        </h1>
        <p className="m-0 text-sm font-light" role="status">
          Loading Product details
        </p>
      </div>
    </div>
  </section>
)

type ProductContentProps = {
  headingRef: React.RefObject<HTMLHeadingElement | null>
  onAddToCart: (variant: ProductVariant) => void
  product: ProductDetails
}

const ProductContent = ({
  headingRef,
  onAddToCart,
  product,
}: ProductContentProps) => {
  const carouselRef = useRef<HTMLUListElement>(null)
  const colorGroupId = useId()
  const storageGroupId = useId()
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(
    null,
  )
  const [selectedStorageIndex, setSelectedStorageIndex] = useState<
    number | null
  >(null)
  const selectedColor =
    selectedColorIndex === null
      ? undefined
      : product.colorOptions[selectedColorIndex]
  const selectedStorage =
    selectedStorageIndex === null
      ? undefined
      : product.storageOptions[selectedStorageIndex]
  const selectedVariant = createProductVariant(
    product,
    selectedColor ?? null,
    selectedStorage ?? null,
  )
  const displayedColor = selectedColor ?? product.colorOptions[0]

  const handleCarouselKeyDown = (
    event: React.KeyboardEvent<HTMLUListElement>,
  ) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return
    }

    event.preventDefault()
    carouselRef.current?.scrollBy({
      behavior: 'auto',
      left: event.key === 'ArrowRight' ? 344 : -344,
    })
  }

  return (
    <article aria-labelledby="product-heading">
      <BackButton />
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-4 pt-[5px] md:grid md:w-[calc(100%-80px)] md:max-w-[754px] md:grid-cols-[337px_minmax(0,1fr)] md:items-center md:gap-[55px] md:px-0 md:pt-1 xl:w-[1200px] xl:max-w-[1200px] xl:grid-cols-[510px_380px] xl:gap-[170px] xl:pt-[110px]">
        <ProductImage
          color={displayedColor}
          isSelected={selectedColor !== undefined}
          key={displayedColor.imageUrl}
          product={product}
        />
        <div className="flex min-w-0 flex-col gap-10 xl:gap-16">
          <div className="flex flex-col gap-[11px]">
            <h1
              className="m-0 text-xl leading-[1.2] font-light uppercase xl:text-2xl"
              id="product-heading"
              ref={headingRef}
              tabIndex={-1}
            >
              {product.name}
            </h1>
            <p className="m-0 text-sm leading-[1.2] font-light xl:text-xl">
              {selectedStorage
                ? `${selectedStorage.price} EUR`
                : `From ${product.basePrice} EUR`}
            </p>
          </div>
          <div className="flex flex-col gap-8 xl:gap-10">
            {product.storageOptions.length > 0 ? (
              <fieldset className="m-0 min-w-0 border-0 p-0">
                <legend className="p-0 text-xs font-light uppercase xl:text-sm">
                  Storage
                  <span aria-hidden="true">. How much space do you need?</span>
                </legend>
                <div className="mt-5 flex xl:mt-6">
                  {product.storageOptions.map((storage, index) => {
                    const optionId = `${storageGroupId}-${index}`

                    return (
                      <div
                        className="-ml-px first:ml-0 last:[&>label]:min-w-[95px]"
                        key={optionId}
                      >
                        <input
                          checked={selectedStorageIndex === index}
                          className="peer sr-only"
                          id={optionId}
                          name={`${storageGroupId}-storage`}
                          onChange={() => setSelectedStorageIndex(index)}
                          type="radio"
                        />
                        <label
                          className="border-border-subtle peer-checked:border-border peer-focus:outline-foreground flex h-12 min-w-[89px] cursor-pointer items-center justify-center border px-4 text-xs font-light peer-focus:relative peer-focus:outline-2 peer-focus:outline-offset-2 xl:h-[65px] xl:min-w-[95px] xl:text-sm"
                          htmlFor={optionId}
                        >
                          {storage.capacity}
                        </label>
                      </div>
                    )
                  })}
                </div>
              </fieldset>
            ) : null}
            <fieldset className="m-0 min-w-0 border-0 p-0">
              <legend className="p-0 text-xs font-light uppercase xl:text-sm">
                Color<span aria-hidden="true">. Pick your favourite.</span>
              </legend>
              <div className="mt-5 flex gap-4 xl:mt-6">
                {product.colorOptions.map((color, index) => {
                  const optionId = `${colorGroupId}-${index}`

                  return (
                    <div key={optionId}>
                      <input
                        checked={selectedColorIndex === index}
                        className="peer sr-only"
                        id={optionId}
                        name={`${colorGroupId}-color`}
                        onChange={() => setSelectedColorIndex(index)}
                        type="radio"
                      />
                      <label
                        className="peer-checked:[&>span]:border-border peer-focus:[&>span]:outline-foreground flex cursor-pointer flex-col items-start gap-2 text-[10px] leading-[1.2] font-light uppercase peer-focus:[&>span]:outline-2 peer-focus:[&>span]:outline-offset-2"
                        htmlFor={optionId}
                      >
                        <span
                          aria-hidden="true"
                          className="border-border-subtle flex size-6 items-center justify-center border"
                        >
                          <span
                            className="size-5"
                            style={{ backgroundColor: color.hexCode }}
                          />
                        </span>
                        {color.name}
                      </label>
                    </div>
                  )
                })}
              </div>
            </fieldset>
          </div>
          <Button
            className="h-12 w-full md:w-[260px] xl:h-14 xl:w-full"
            disabled={!selectedVariant}
            onClick={() => {
              if (selectedVariant) {
                onAddToCart(selectedVariant)
              }
            }}
            size="large"
            type="button"
          >
            Add to cart
          </Button>
          <p aria-live="polite" className="sr-only" role="status">
            {selectedColor
              ? `Selected color: ${selectedColor.name}.`
              : 'No color selected.'}{' '}
            {selectedStorage
              ? `Selected storage: ${selectedStorage.capacity}. Final price: ${selectedStorage.price} EUR.`
              : 'No storage selected.'}{' '}
            {selectedVariant ? 'Product variant complete.' : ''}
          </p>
        </div>
      </div>

      <section
        aria-labelledby="specifications-heading"
        className="mx-auto mt-20 w-full max-w-[1200px] px-4 md:mt-[88px] md:w-[calc(100%-80px)] md:max-w-[754px] md:px-0 xl:mt-[154px] xl:w-[1200px] xl:max-w-[1200px]"
      >
        <h2
          className="m-0 text-xl leading-[1.2] font-light uppercase"
          id="specifications-heading"
        >
          Specifications
        </h2>
        <table
          aria-label="Product specifications"
          className="mt-10 w-full table-fixed border-collapse text-left text-xs leading-[1.25] font-light md:mt-10"
        >
          <colgroup>
            <col className="w-[45%] md:w-[46%] xl:w-[29%]" />
            <col />
          </colgroup>
          <tbody>
            {specificationRows(product).map(([label, value], index) => (
              <tr
                className={
                  index === 0 ? 'border-y-[0.5px]' : 'border-b-[0.5px]'
                }
                key={label}
              >
                <th
                  className="py-4 pr-3 align-top font-light uppercase md:pr-12"
                  scope="row"
                >
                  {label}
                </th>
                <td className="py-4 align-top font-light">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {product.similarProducts.length > 0 ? (
        <section
          aria-labelledby="similar-products-heading"
          className="mx-auto mt-20 w-full max-w-[1200px] overflow-hidden px-4 pb-20 md:mt-[88px] md:w-[calc(100%-80px)] md:max-w-[754px] md:px-0 xl:mt-[154px] xl:w-[1200px] xl:max-w-[1200px] xl:pb-[104px]"
        >
          <h2
            className="m-0 text-xl leading-[1.2] font-light uppercase"
            id="similar-products-heading"
          >
            Similar Products
          </h2>
          <ul
            aria-label="Similar Products carousel"
            className="focus-outline mt-10 flex [scrollbar-width:none] list-none gap-0 overflow-x-auto p-0 [&::-webkit-scrollbar]:hidden"
            onKeyDown={handleCarouselKeyDown}
            ref={carouselRef}
            tabIndex={0}
          >
            {product.similarProducts.map((similarProduct) => (
              <ProductCard
                className="h-[344px] w-[344px] shrink-0 md:h-[377px] md:w-[377px] xl:h-[344px] xl:w-[344px]"
                focusProductStart
                key={similarProduct.id}
                product={similarProduct}
              />
            ))}
          </ul>
          <div
            className="bg-border-subtle relative mt-10 h-px w-full"
            role="presentation"
          >
            <div className="absolute inset-y-0 left-0 w-[100px] bg-black xl:w-[150px]" />
          </div>
        </section>
      ) : null}
    </article>
  )
}

type ProductDetailsPageProps = {
  onAddToCart: (variant: ProductVariant) => void
}

export const ProductDetailsPage = ({
  onAddToCart,
}: ProductDetailsPageProps) => {
  const { productId = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const { retry, state } = useProductDetails(productId)

  const handleAddToCart = (variant: ProductVariant) => {
    onAddToCart(variant)
    navigate('/cart', {
      state: {
        cartAnnouncement: `${variant.product.name}, ${variant.color.name}, ${variant.storage.capacity} added to Cart.`,
      },
    })
  }

  useEffect(() => {
    if (
      state.status === 'success' &&
      location.state?.focusProductStart === true
    ) {
      window.scrollTo({ top: 0 })
      headingRef.current?.focus()
    }
  }, [location.state, state])

  if (state.status === 'loading') {
    return <LoadingProduct />
  }

  if (state.status === 'error') {
    return (
      <section aria-labelledby="product-error-heading">
        <BackButton />
        <div className="mx-auto flex min-h-[344px] w-full max-w-[1200px] flex-col items-start justify-center gap-6 border-y-[0.5px] px-4 py-10 md:w-[calc(100%-80px)] md:max-w-[754px] md:px-0 xl:w-[1200px] xl:max-w-[1200px]">
          <div className="flex flex-col gap-2" role="alert">
            <h1
              className="m-0 text-xl leading-[1.2] font-light uppercase"
              id="product-error-heading"
            >
              {state.error.kind === 'not-found'
                ? 'Product not found'
                : 'Product unavailable'}
            </h1>
            <p className="m-0 max-w-prose text-xs leading-[1.25] font-light">
              {state.error.message}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={retry} type="button">
              Retry
            </Button>
            <Button
              onClick={() => navigate('/')}
              type="button"
              variant="outline"
            >
              Back to catalog
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <ProductContent
      headingRef={headingRef}
      key={state.product.id}
      onAddToCart={handleAddToCart}
      product={state.product}
    />
  )
}
