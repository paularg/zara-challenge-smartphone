import { startViewTransition } from '@/lib/viewTransition'

export const navigateBackWithProductTransition = (navigateBack: () => void) =>
  startViewTransition(navigateBack)
