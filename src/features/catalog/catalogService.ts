const PRODUCTS_ENDPOINT =
  'https://prueba-tecnica-api-tienda-moviles.onrender.com/products'
const PRODUCT_LIMIT = 20
type ProductListScope = 'initial-catalog' | 'search-results'

export type Product = {
  id: string
  brand: string
  name: string
  basePrice: number
  imageUrl: string
}

export type CatalogErrorKind =
  'authentication' | 'configuration' | 'invalid-payload' | 'network' | 'server'

export type CatalogResult =
  | { status: 'success'; products: Product[] }
  | {
      status: 'error'
      error: { kind: CatalogErrorKind; message: string }
    }

type FetchProductsOptions = {
  apiKey: string | undefined
  fetcher?: typeof fetch
  query?: string
  signal?: AbortSignal
}

const errorResult = (
  kind: CatalogErrorKind,
  message: string,
): CatalogResult => ({
  status: 'error',
  error: { kind, message },
})

const invalidPayloadResult = () =>
  errorResult('invalid-payload', 'The Product catalog response is invalid.')

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isProduct = (value: unknown): value is Product =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  value.id.length > 0 &&
  typeof value.brand === 'string' &&
  value.brand.length > 0 &&
  typeof value.name === 'string' &&
  value.name.length > 0 &&
  typeof value.basePrice === 'number' &&
  Number.isFinite(value.basePrice) &&
  typeof value.imageUrl === 'string' &&
  value.imageUrl.length > 0

const repairImageUrl = (imageUrl: string) =>
  imageUrl.replace(/^http:\/\//i, 'https://')

export const normalizeProductList = (
  payload: unknown,
  scope: ProductListScope = 'initial-catalog',
): CatalogResult => {
  const productPayloads = Array.isArray(payload)
    ? payload
    : isProduct(payload)
      ? [payload]
      : undefined

  if (!productPayloads || !productPayloads.every(isProduct)) {
    return invalidPayloadResult()
  }

  const productIds = new Set<string>()
  const products: Product[] = []

  for (const product of productPayloads) {
    if (productIds.has(product.id)) {
      continue
    }

    productIds.add(product.id)
    products.push({
      id: product.id,
      brand: product.brand,
      name: product.name,
      basePrice: product.basePrice,
      imageUrl: repairImageUrl(product.imageUrl),
    })

    if (scope === 'initial-catalog' && products.length === PRODUCT_LIMIT) {
      break
    }
  }

  return { status: 'success', products }
}

export const fetchProducts = async ({
  apiKey,
  fetcher = fetch,
  query,
  signal,
}: FetchProductsOptions): Promise<CatalogResult> => {
  if (!apiKey) {
    return errorResult(
      'configuration',
      'API_KEY is not configured. Add it to the local .env file.',
    )
  }

  try {
    const requestUrl = new URL(PRODUCTS_ENDPOINT)

    if (query) {
      requestUrl.searchParams.set('search', query)
    }

    const response = await fetcher(requestUrl.toString(), {
      headers: { 'x-api-key': apiKey },
      signal,
    })

    if (response.status === 401) {
      return errorResult(
        'authentication',
        'The Product catalog could not be authenticated.',
      )
    }

    if (!response.ok) {
      return errorResult('server', 'The Product catalog could not be loaded.')
    }

    try {
      return normalizeProductList(
        await response.json(),
        query ? 'search-results' : 'initial-catalog',
      )
    } catch {
      return invalidPayloadResult()
    }
  } catch {
    return errorResult(
      'network',
      'Check your connection and try loading the catalog again.',
    )
  }
}
