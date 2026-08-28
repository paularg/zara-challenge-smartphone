import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'
import { useCartStore } from './features/cart'

beforeEach(() => {
  window.localStorage.clear()
  useCartStore.setState({ lines: [] })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('application shell', () => {
  it('lets a customer navigate between the catalog and Cart from the shared header', async () => {
    const user = userEvent.setup()
    vi.stubEnv('API_KEY', 'test-key')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify([]), {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }),
      ),
    )

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Catalog' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'MBST home' })).toHaveAttribute(
      'href',
      '/',
    )

    await user.click(screen.getByRole('link', { name: 'Cart, 0 items' }))

    expect(
      screen.getByRole('heading', { level: 1, name: 'Cart (0)' }),
    ).toBeInTheDocument()
  })

  it('derives the shared header count from Cart units on every route', async () => {
    const user = userEvent.setup()
    vi.stubEnv('API_KEY', 'test-key')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify([]), {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }),
      ),
    )
    const variant = {
      brand: 'Samsung',
      color: 'Blue titanium',
      imageUrl: 'https://images.example.com/galaxy-blue.png',
      name: 'Galaxy S24 Ultra',
      productId: 'galaxy-s24-ultra',
      storage: '256 GB',
      unitPrice: 1099,
    }
    useCartStore.getState().addLine(variant)
    useCartStore.getState().addLine(variant)

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    const cartLink = screen.getByRole('link', { name: 'Cart, 2 items' })
    expect(cartLink).toBeVisible()
    await user.click(cartLink)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Cart (2)' }),
    ).toBeVisible()
    await user.click(screen.getByRole('link', { name: 'Continue shopping' }))
    expect(screen.getByRole('link', { name: 'Cart, 2 items' })).toBeVisible()
  })
})
