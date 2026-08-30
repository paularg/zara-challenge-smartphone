import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { Button } from '@/components/ui/button'

import {
  selectCartTotal,
  selectCartUnitCount,
  useCartStore,
  type CartLine,
} from './cartStore'

const checkoutDescriptionId = 'checkout-unavailable-description'

const formatPrice = (price: number) => `${price} EUR`

const readCartAnnouncement = (state: unknown) => {
  if (
    typeof state === 'object' &&
    state !== null &&
    'cartAnnouncement' in state &&
    typeof state.cartAnnouncement === 'string'
  ) {
    return state.cartAnnouncement
  }

  return ''
}

type CartLineItemProps = {
  line: CartLine
  onRemoveOne: (line: CartLine) => void
}

const CartLineItem = ({ line, onRemoveOne }: CartLineItemProps) => {
  const [imageFailed, setImageFailed] = useState(false)
  const imageName = `${line.brand} ${line.name} in ${line.color}`

  return (
    <li className="group flex h-[197.863px] w-full gap-6 md:h-[324px] md:gap-10 xl:w-[548px]">
      <div className="h-full w-40 shrink-0 md:w-[262px]">
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
            className="h-full w-full object-contain"
            onError={() => setImageFailed(true)}
            src={line.imageUrl}
          />
        )}
      </div>

      <div className="group-hover:bg-primary group-hover:text-primary-foreground flex min-w-0 flex-1 flex-col justify-between py-10 text-xs leading-4 font-light">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex min-w-0 flex-col gap-1 uppercase">
            <p className="truncate">{line.name}</p>
            <p className="truncate">
              {line.storage} | {line.color}
            </p>
          </div>

          <div className="flex flex-col gap-1 uppercase">
            <p>{formatPrice(line.unitPrice)}</p>
            <p>QTY: {line.quantity}</p>
          </div>
        </div>

        <button
          aria-label={`Remove one ${line.name} from Cart`}
          className="focus-outline text-destructive group-hover:text-primary-foreground min-h-6 w-fit cursor-pointer border-0 bg-transparent p-0 text-xs leading-4 font-light uppercase"
          onClick={() => onRemoveOne(line)}
          type="button"
        >
          Remove
        </button>
      </div>
    </li>
  )
}

type CartTotalProps = {
  total: number
}

const CartTotal = ({ total }: CartTotalProps) => (
  <div className="order-1 col-span-2 flex items-center justify-between gap-6 text-sm leading-4 font-normal whitespace-nowrap uppercase md:order-2 md:col-span-1 md:col-start-3">
    <span>Total</span>
    <span>{formatPrice(total)}</span>
  </div>
)

const ContinueShoppingButton = () => (
  <Button
    asChild
    className="order-2 h-12 w-full min-w-0 px-4 md:order-1 md:w-[200px] xl:h-14 xl:w-[260px]"
    size="medium"
    variant="outline"
  >
    <Link to="/">Continue shopping</Link>
  </Button>
)

const PayButton = () => (
  <Button
    aria-describedby={checkoutDescriptionId}
    className="order-3 h-12 w-full min-w-0 px-4 md:col-start-4 md:w-[260px] xl:h-14"
    size="medium"
    type="button"
  >
    Pay
  </Button>
)

const EmptyCartFooter = () => (
  <footer
    aria-label="Cart actions"
    className="bg-background mt-auto flex h-24 shrink-0 items-center px-4 py-6 md:h-28 md:px-10 md:pt-6 md:pb-10 xl:h-[136px] xl:px-[100px] xl:pt-6 xl:pb-14"
    role="group"
  >
    <ContinueShoppingButton />
  </footer>
)

const FilledCartFooter = ({ total }: CartTotalProps) => (
  <footer
    aria-label="Cart actions"
    className="bg-background mt-auto grid h-[129px] shrink-0 grid-cols-2 items-center gap-x-3 gap-y-6 px-4 pt-4 pb-6 min-[834px]:!gap-x-14 md:h-28 md:grid-cols-[200px_1fr_auto_260px] md:gap-x-8 md:gap-y-0 md:px-10 md:pt-6 md:pb-10 xl:h-[136px] xl:grid-cols-[260px_1fr_auto_260px] xl:!gap-x-20 xl:px-[100px] xl:pt-6 xl:pb-14"
    role="group"
  >
    <CartTotal total={total} />
    <ContinueShoppingButton />
    <PayButton />
  </footer>
)

export const CartPage = () => {
  const location = useLocation()
  const lines = useCartStore((state) => state.lines)
  const unitCount = useCartStore(selectCartUnitCount)
  const total = useCartStore(selectCartTotal)
  const decrementLine = useCartStore((state) => state.decrementLine)
  const [announcement, setAnnouncement] = useState(() =>
    readCartAnnouncement(location.state),
  )

  const handleRemoveOne = (line: CartLine) => {
    const remainingUnitCount = unitCount - 1

    decrementLine(line.id)
    setAnnouncement(
      line.quantity > 1
        ? `Removed one ${line.name} from Cart. ${line.quantity - 1} unit${line.quantity - 1 === 1 ? '' : 's'} remains.`
        : remainingUnitCount > 0
          ? `Removed ${line.name} from Cart. ${remainingUnitCount} unit${remainingUnitCount === 1 ? '' : 's'} remain${remainingUnitCount === 1 ? 's' : ''} in Cart.`
          : `Removed ${line.name} from Cart. Cart is empty.`,
    )
  }

  return (
    <div className="flex min-h-[calc(100svh-80px)] flex-col">
      <section
        aria-labelledby="cart-heading"
        className="flex flex-1 flex-col gap-5 px-4 pt-6 md:gap-10 md:px-10 md:pt-12 xl:gap-16 xl:px-[100px]"
      >
        <h1
          className="m-0 text-2xl leading-[1.2] font-light uppercase"
          id="cart-heading"
        >
          Cart ({unitCount})
        </h1>

        {lines.length > 0 ? (
          <ul className="m-0 flex list-none flex-col gap-12 p-0">
            {lines.map((line) => (
              <CartLineItem
                key={line.id}
                line={line}
                onRemoveOne={handleRemoveOne}
              />
            ))}
          </ul>
        ) : null}
      </section>

      {lines.length > 0 ? (
        <FilledCartFooter total={total} />
      ) : (
        <EmptyCartFooter />
      )}

      <p aria-live="polite" className="sr-only" role="status">
        {announcement}
      </p>
      <p className="sr-only" id={checkoutDescriptionId}>
        Checkout is outside this exercise.
      </p>
    </div>
  )
}
