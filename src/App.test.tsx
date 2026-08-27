import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import App from './App'

describe('application shell', () => {
  it('lets a customer navigate between the catalog and Cart from the shared header', async () => {
    const user = userEvent.setup()

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
      screen.getByRole('heading', { level: 1, name: 'Cart' }),
    ).toBeInTheDocument()
  })
})
