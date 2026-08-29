import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  createMemoryRouter,
  RouterProvider,
  type InitialEntry,
} from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { CartPage } from './CartPage'

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
})
