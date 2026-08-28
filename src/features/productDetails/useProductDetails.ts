import { useEffect, useRef, useState } from 'react'

import {
  fetchProductDetails,
  type ProductDetailsResult,
} from './productDetailsService'

export type ProductDetailsState = { status: 'loading' } | ProductDetailsResult

type SettledRequest = {
  key: string
  result: ProductDetailsResult
}

type ActiveRequest = {
  abortTimer?: number
  controller: AbortController
  key: string
  promise: Promise<ProductDetailsResult>
}

export const useProductDetails = (productId: string) => {
  const [retryAttempt, setRetryAttempt] = useState(0)
  const [settledRequest, setSettledRequest] = useState<SettledRequest>()
  const activeRequestRef = useRef<ActiveRequest>(undefined)
  const requestKey = `${productId}\u0000${retryAttempt}`
  const state: ProductDetailsState =
    settledRequest?.key === requestKey
      ? settledRequest.result
      : { status: 'loading' }

  useEffect(() => {
    let request = activeRequestRef.current

    if (request?.key === requestKey && !request.controller.signal.aborted) {
      if (request.abortTimer !== undefined) {
        window.clearTimeout(request.abortTimer)
        request.abortTimer = undefined
      }
    } else {
      if (request) {
        if (request.abortTimer !== undefined) {
          window.clearTimeout(request.abortTimer)
        }
        request.controller.abort()
      }

      const controller = new AbortController()
      request = {
        controller,
        key: requestKey,
        promise: fetchProductDetails({
          apiKey: import.meta.env.API_KEY,
          productId,
          signal: controller.signal,
        }),
      }
      activeRequestRef.current = request
    }

    const currentRequest = request
    let isCurrent = true

    void currentRequest.promise.then((result) => {
      if (
        isCurrent &&
        activeRequestRef.current === currentRequest &&
        !currentRequest.controller.signal.aborted
      ) {
        activeRequestRef.current = undefined
        setSettledRequest({ key: requestKey, result })
      }
    })

    return () => {
      isCurrent = false
      currentRequest.abortTimer = window.setTimeout(() => {
        if (activeRequestRef.current === currentRequest) {
          currentRequest.controller.abort()
          activeRequestRef.current = undefined
        }
      }, 0)
    }
  }, [productId, requestKey])

  return {
    retry: () => setRetryAttempt((attempt) => attempt + 1),
    state,
  }
}
