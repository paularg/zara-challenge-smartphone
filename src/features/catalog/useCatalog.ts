import { useEffect, useRef, useState } from 'react'

import { fetchProducts, type CatalogResult } from './catalogService'

export type CatalogState = { status: 'loading' } | CatalogResult

type UseCatalogResult = {
  catalogState: CatalogState
  retry: () => void
}

export const useCatalog = (): UseCatalogResult => {
  const [catalogState, setCatalogState] = useState<CatalogState>({
    status: 'loading',
  })
  const [retryAttempt, setRetryAttempt] = useState(0)
  const requestRef = useRef<Promise<CatalogResult>>(undefined)

  useEffect(() => {
    let isCurrent = true
    const request =
      requestRef.current ??
      fetchProducts({
        apiKey: import.meta.env.API_KEY,
      })
    requestRef.current = request

    void request
      .then((result) => {
        if (isCurrent) {
          setCatalogState(result)
        }
      })
      .finally(() => {
        if (requestRef.current === request) {
          requestRef.current = undefined
        }
      })

    return () => {
      isCurrent = false
    }
  }, [retryAttempt])

  const retry = () => {
    requestRef.current = undefined
    setCatalogState({ status: 'loading' })
    setRetryAttempt((attempt) => attempt + 1)
  }

  return { catalogState, retry }
}
