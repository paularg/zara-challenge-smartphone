import { flushSync } from 'react-dom'

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

export const startViewTransition = (navigate: () => void) => {
  if (prefersReducedMotion() || !document.startViewTransition) {
    navigate()
    return undefined
  }

  return document.startViewTransition(() => {
    flushSync(navigate)
  })
}
