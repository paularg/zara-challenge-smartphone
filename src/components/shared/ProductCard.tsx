import { useState } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'

export type ProductCardData = {
  id: string
  brand: string
  name: string
  basePrice: number
  imageUrl: string
}

type ProductCardProps = {
  className?: string
  focusProductStart?: boolean
  product: ProductCardData
}

export const ProductCard = ({
  className,
  focusProductStart = false,
  product,
}: ProductCardProps) => {
  const [imageFailed, setImageFailed] = useState(false)
  const imageName = `${product.brand} ${product.name}`

  return (
    <li
      className={cn(
        'border-border bg-card h-[344px] border-[0.5px] md:aspect-square md:h-auto',
        className,
      )}
    >
      <Link
        aria-label={`Open ${imageName}`}
        className="focus-outline group flex h-full min-h-0 flex-col gap-6 overflow-hidden p-4 hover:bg-black hover:text-white"
        state={focusProductStart ? { focusProductStart: true } : undefined}
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
