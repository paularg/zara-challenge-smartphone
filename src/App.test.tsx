import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import App from './App'

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
})
