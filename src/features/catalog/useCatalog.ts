import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { fetchProducts, type CatalogResult } from './catalogService'

const SEARCH_DEBOUNCE_MS = 300

export type CatalogState = { status: 'loading' } | CatalogResult

type UseCatalogResult = {
  catalogState: CatalogState
  clearSearch: () => void
  confirmedQuery: string
  isSearchPending: boolean
  query: string
  retry: () => void
  setQuery: (query: string) => void
}

const normalizedQuery = (query: string) => query.trim()

const withSearchQuery = (searchParams: URLSearchParams, query: string) => {
  const nextParams = new URLSearchParams(searchParams)

  if (query) {
    nextParams.set('search', query)
  } else {
    nextParams.delete('search')
  }

  return nextParams
}

type ActiveRequest = {
  abortTimer?: number
  controller: AbortController
  key: string
  promise: Promise<CatalogResult>
}

export const useCatalog = (): UseCatalogResult => {
  const [searchParams, setSearchParams] = useSearchParams()
  const confirmedQuery = normalizedQuery(searchParams.get('search') ?? '')
  const [queryDraft, setQueryDraft] = useState({
    sourceQuery: confirmedQuery,
    value: confirmedQuery,
  })
  const query =
    queryDraft.sourceQuery === confirmedQuery
      ? queryDraft.value
      : confirmedQuery
  const [catalogState, setCatalogState] = useState<CatalogState>({
    status: 'loading',
  })
  const [isSearchPending, setIsSearchPending] = useState(false)
  const [retryAttempt, setRetryAttempt] = useState(0)
  const hasSettledRequest = useRef(false)
  const activeRequestRef = useRef<ActiveRequest>(undefined)

  const commitQuery = useCallback(
    (nextQuery: string) => {
      setSearchParams(
        (currentParams) => withSearchQuery(currentParams, nextQuery),
        { replace: false },
      )
    },
    [setSearchParams],
  )

  useEffect(() => {
    const nextQuery = normalizedQuery(query)

    if (nextQuery === confirmedQuery) {
      return
    }

    const timeout = window.setTimeout(() => {
      setQueryDraft({ sourceQuery: nextQuery, value: nextQuery })
      commitQuery(nextQuery)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeout)
  }, [commitQuery, confirmedQuery, query])

  useEffect(() => {
    const requestKey = `${confirmedQuery}\u0000${retryAttempt}`
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
        promise: fetchProducts({
          apiKey: import.meta.env.API_KEY,
          query: confirmedQuery || undefined,
          signal: controller.signal,
        }),
      }
      activeRequestRef.current = request
    }

    const currentRequest = request
    let isCurrent = true

    if (hasSettledRequest.current) {
      setIsSearchPending(true)
    }

    void currentRequest.promise.then((result) => {
      if (
        isCurrent &&
        activeRequestRef.current === currentRequest &&
        !currentRequest.controller.signal.aborted
      ) {
        activeRequestRef.current = undefined
        hasSettledRequest.current = true
        setCatalogState(result)
        setIsSearchPending(false)
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
  }, [confirmedQuery, retryAttempt])

  const clearSearch = () => {
    setQueryDraft({ sourceQuery: '', value: '' })
    commitQuery('')
  }

  const retry = () => {
    setRetryAttempt((attempt) => attempt + 1)
  }

  const updateQuery = (nextQuery: string) => {
    setQueryDraft({ sourceQuery: confirmedQuery, value: nextQuery })
  }

  return {
    catalogState,
    clearSearch,
    confirmedQuery,
    isSearchPending,
    query,
    retry,
    setQuery: updateQuery,
  }
}
