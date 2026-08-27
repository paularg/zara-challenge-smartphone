import type { Page } from '@playwright/test'

export const monitorBrowserProblems = (page: Page): string[] => {
  const browserProblems: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      browserProblems.push(`console ${message.type()}: ${message.text()}`)
    }
  })
  page.on('pageerror', (error) => {
    browserProblems.push(`page error: ${error.message}`)
  })
  page.on('response', (response) => {
    if (response.status() >= 400) {
      browserProblems.push(`${response.status()} ${response.url()}`)
    }
  })
  page.on('requestfailed', (request) => {
    browserProblems.push(
      `request failed: ${request.failure()?.errorText ?? 'unknown error'} ${request.url()}`,
    )
  })

  return browserProblems
}
