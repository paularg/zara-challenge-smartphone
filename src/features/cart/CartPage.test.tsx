import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  createMemoryRouter,
  RouterProvider,
  type InitialEntry,
} from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { CartPage } from './CartPage'
import { useCartStore } from './cartStore'

const galaxyVariant = {
  productId: 'galaxy-s24-ultra',
  brand: 'Samsung',
  name: 'Galaxy S24 Ultra',
  imageUrl: 'https://images.example.com/galaxy-blue.png',
  color: 'Blue titanium',
  storage: '256 GB',
  unitPrice: 1099,
}

const renderCart = (initialEntry: InitialEntry = '/cart') => {
  const router = createMemoryRouter(
    [
      { path: '/', element: <h1>Catalog</h1> },
      { path: '/cart', element: <CartPage /> },
    ],
    { initialEntries: [initialEntry] },
  )

  return { router, ...render(<RouterProvider router={router} />) }
}

beforeEach(() => {
  window.localStorage.clear()
  useCartStore.setState({ lines: [] })
})

afterEach(() => {
  cleanup()
})

describe('Cart route', () => {
  it('presents the dedicated empty composition and returns to the catalog', async () => {
    const user = userEvent.setup()
    const { router } = renderCart()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Cart (0)' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.queryByText('Total')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Pay' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Continue shopping' }))

    expect(router.state.location.pathname).toBe('/')
  })

  it('displays the captured Product variant, quantity, total, and disabled checkout', () => {
    useCartStore.getState().addLine(galaxyVariant)
    useCartStore.getState().addLine(galaxyVariant)

    renderCart()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Cart (2)' }),
    ).toBeInTheDocument()

    const cartLine = screen.getByRole('listitem')
    expect(
      within(cartLine).getByRole('img', {
        name: 'Samsung Galaxy S24 Ultra in Blue titanium',
      }),
    ).toHaveAttribute('src', galaxyVariant.imageUrl)
    expect(within(cartLine).getByText('Galaxy S24 Ultra')).toBeVisible()
    expect(within(cartLine).getByText('256 GB | Blue titanium')).toBeVisible()
    expect(within(cartLine).getByText('QTY: 2')).toBeVisible()
    expect(within(cartLine).getByText('1099 EUR')).toBeVisible()
    expect(screen.getByText('2198 EUR')).toBeVisible()

    const pay = screen.getByRole('button', { name: 'Pay' })
    expect(pay).toBeDisabled()
    expect(pay).toHaveAccessibleDescription(
      'Checkout is outside this exercise.',
    )
  })

  it('decrements a Cart line, announces the change, and removes it at zero', async () => {
    const user = userEvent.setup()
    useCartStore.getState().addLine(galaxyVariant)
    useCartStore.getState().addLine(galaxyVariant)
    renderCart()

    const remove = screen.getByRole('button', {
      name: 'Remove one Galaxy S24 Ultra from Cart',
    })
    await user.click(remove)

    expect(screen.getByText('QTY: 1')).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Removed one Galaxy S24 Ultra from Cart. 1 unit remains.',
    )

    await user.click(remove)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Cart (0)' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Removed Galaxy S24 Ultra from Cart. Cart is empty.',
    )
  })

  it('does not announce an empty Cart when another variant line remains', async () => {
    const user = userEvent.setup()
    useCartStore.getState().addLine(galaxyVariant)
    useCartStore.getState().addLine({
      ...galaxyVariant,
      color: 'Black titanium',
      imageUrl: 'https://images.example.com/galaxy-black.png',
    })
    renderCart()

    await user.click(
      screen.getAllByRole('button', {
        name: 'Remove one Galaxy S24 Ultra from Cart',
      })[0],
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      'Removed Galaxy S24 Ultra from Cart. 1 unit remains in Cart.',
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })

  it('announces the Product variant that was added before navigation', () => {
    useCartStore.getState().addLine(galaxyVariant)
    renderCart({
      pathname: '/cart',
      state: {
        cartAnnouncement:
          'Galaxy S24 Ultra, Blue titanium, 256 GB added to Cart.',
      },
    })

    expect(screen.getByRole('status')).toHaveTextContent(
      'Galaxy S24 Ultra, Blue titanium, 256 GB added to Cart.',
    )
  })
})
