import { Link } from 'react-router-dom'

import bagIcon from '@/assets/bag.svg'
import wordmark from '@/assets/mbst-wordmark.svg'

type HeaderProps = {
  cartUnitCount: number
}

export const Header = ({ cartUnitCount }: HeaderProps) => (
  <header className="bg-background flex h-20 items-center justify-between px-4 md:px-10 xl:px-[100px]">
    <Link
      aria-label="MBST home"
      className="focus-outline inline-flex h-8 items-center"
      to="/"
    >
      <img aria-hidden="true" height="24" src={wordmark} width="74" />
    </Link>
    <Link
      aria-label={`Cart, ${cartUnitCount} ${cartUnitCount === 1 ? 'item' : 'items'}`}
      className="focus-outline inline-flex min-h-11 min-w-11 items-center justify-end gap-1.5 text-base leading-[1.2] font-light uppercase"
      to="/cart"
    >
      <img aria-hidden="true" height="18" src={bagIcon} width="18" />
      <span aria-hidden="true">{cartUnitCount}</span>
    </Link>
  </header>
)
