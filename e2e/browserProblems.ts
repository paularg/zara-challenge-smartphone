import { expect, type Page } from '@playwright/test'

type BrowserProblemMonitoringOptions = {
  expectedConsoleMessages?: readonly RegExp[]
  expectedErrorResponseUrls?: readonly string[]
  expectedFailedRequestUrlPrefixes?: readonly string[]
  expectedFailedRequestUrls?: readonly string[]
}

export const expectNoHorizontalPageOverflow = async (page: Page) => {
  const pageWidth = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))

  expect(pageWidth.scrollWidth).toBeLessThanOrEqual(pageWidth.clientWidth)
}

export const pressNextTabStop = async (page: Page) => {
  const browserName = page.context().browser()?.browserType().name()

  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
}

export const monitorBrowserProblems = (
  page: Page,
  {
    expectedConsoleMessages = [],
    expectedErrorResponseUrls = [],
    expectedFailedRequestUrlPrefixes = [],
    expectedFailedRequestUrls = [],
  }: BrowserProblemMonitoringOptions = {},
): string[] => {
  const browserProblems: string[] = []
  const expectedErrorResponses = new Set(expectedErrorResponseUrls)
  const expectedFailedRequests = new Set(expectedFailedRequestUrls)

  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      if (
        expectedConsoleMessages.some((pattern) => pattern.test(message.text()))
      ) {
        return
      }

      browserProblems.push(`console ${message.type()}: ${message.text()}`)
    }
  })
  page.on('pageerror', (error) => {
    browserProblems.push(`page error: ${error.message}`)
  })
  page.on('response', (response) => {
    if (
      response.status() >= 400 &&
      !expectedErrorResponses.has(response.url())
    ) {
      browserProblems.push(`${response.status()} ${response.url()}`)
    }
  })
  page.on('requestfailed', (request) => {
    if (
      expectedFailedRequests.has(request.url()) ||
      expectedFailedRequestUrlPrefixes.some((prefix) =>
        request.url().startsWith(prefix),
      )
    ) {
      return
    }

    browserProblems.push(
      `request failed: ${request.failure()?.errorText ?? 'unknown error'} ${request.url()}`,
    )
  })

  return browserProblems
}
