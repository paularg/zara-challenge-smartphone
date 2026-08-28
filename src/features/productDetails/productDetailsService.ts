const PRODUCT_DETAILS_ENDPOINT =
  'https://prueba-tecnica-api-tienda-moviles.onrender.com/products'

export type ProductSummary = {
  id: string
  brand: string
  name: string
  basePrice: number
  imageUrl: string
}

export type ProductSpecs = {
  screen: string
  resolution: string
  processor: string
  mainCamera: string
  selfieCamera: string
  battery: string
  os: string
  screenRefreshRate: string
}

export type ProductDetails = {
  id: string
  brand: string
  name: string
  description: string
  basePrice: number
  specs: ProductSpecs
  colorOptions: Array<{
    name: string
    hexCode: string
    imageUrl: string
  }>
  storageOptions: Array<{
    capacity: string
    price: number
  }>
  similarProducts: ProductSummary[]
}

export type ProductDetailsErrorKind =
  | 'authentication'
  | 'configuration'
  | 'invalid-payload'
  | 'network'
  | 'not-found'
  | 'server'

export type ProductDetailsResult =
  | { status: 'success'; product: ProductDetails }
  | {
      status: 'error'
      error: { kind: ProductDetailsErrorKind; message: string }
    }

type FetchProductDetailsOptions = {
  apiKey: string | undefined
  fetcher?: typeof fetch
  productId: string
  signal?: AbortSignal
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const repairImageUrl = (imageUrl: string) =>
  imageUrl.replace(/^http:\/\//i, 'https://')

const errorResult = (
  kind: ProductDetailsErrorKind,
  message: string,
): ProductDetailsResult => ({ status: 'error', error: { kind, message } })

const invalidPayloadResult = () =>
  errorResult('invalid-payload', 'The Product detail response is invalid.')

const specsKeys = [
  'screen',
  'resolution',
  'processor',
  'mainCamera',
  'selfieCamera',
  'battery',
  'os',
  'screenRefreshRate',
] as const

const isProductSpecs = (value: unknown): value is ProductSpecs =>
  isRecord(value) && specsKeys.every((key) => isNonEmptyString(value[key]))

const isProductSummary = (value: unknown): value is ProductSummary =>
  isRecord(value) &&
  isNonEmptyString(value.id) &&
  isNonEmptyString(value.brand) &&
  isNonEmptyString(value.name) &&
  isFiniteNumber(value.basePrice) &&
  isNonEmptyString(value.imageUrl)

export const normalizeProductDetails = (
  payload: unknown,
): ProductDetailsResult => {
  if (
    !isRecord(payload) ||
    !isNonEmptyString(payload.id) ||
    !isNonEmptyString(payload.brand) ||
    !isNonEmptyString(payload.name) ||
    !isNonEmptyString(payload.description) ||
    !isFiniteNumber(payload.basePrice) ||
    !isProductSpecs(payload.specs) ||
    !Array.isArray(payload.colorOptions) ||
    !payload.colorOptions.every(
      (color) =>
        isRecord(color) &&
        isNonEmptyString(color.name) &&
        isNonEmptyString(color.hexCode) &&
        isNonEmptyString(color.imageUrl),
    ) ||
    payload.colorOptions.length === 0 ||
    !Array.isArray(payload.storageOptions) ||
    !payload.storageOptions.every(
      (storage) =>
        isRecord(storage) &&
        isNonEmptyString(storage.capacity) &&
        isFiniteNumber(storage.price),
    ) ||
    !Array.isArray(payload.similarProducts) ||
    !payload.similarProducts.every(isProductSummary)
  ) {
    return invalidPayloadResult()
  }

  return {
    status: 'success',
    product: {
      id: payload.id,
      brand: payload.brand,
      name: payload.name,
      description: payload.description,
      basePrice: payload.basePrice,
      specs: {
        screen: payload.specs.screen,
        resolution: payload.specs.resolution,
        processor: payload.specs.processor,
        mainCamera: payload.specs.mainCamera,
        selfieCamera: payload.specs.selfieCamera,
        battery: payload.specs.battery,
        os: payload.specs.os,
        screenRefreshRate: payload.specs.screenRefreshRate,
      },
      colorOptions: payload.colorOptions.map((color) => ({
        name: color.name,
        hexCode: color.hexCode,
        imageUrl: repairImageUrl(color.imageUrl),
      })),
      storageOptions: payload.storageOptions.map((storage) => ({
        capacity: storage.capacity,
        price: storage.price,
      })),
      similarProducts: payload.similarProducts.map((product) => ({
        id: product.id,
        brand: product.brand,
        name: product.name,
        basePrice: product.basePrice,
        imageUrl: repairImageUrl(product.imageUrl),
      })),
    },
  }
}

export const fetchProductDetails = async ({
  apiKey,
  fetcher = fetch,
  productId,
  signal,
}: FetchProductDetailsOptions): Promise<ProductDetailsResult> => {
  if (!apiKey) {
    return errorResult(
      'configuration',
      'API_KEY is not configured. Add it to the local .env file.',
    )
  }

  let response: Response

  try {
    response = await fetcher(
      `${PRODUCT_DETAILS_ENDPOINT}/${encodeURIComponent(productId)}`,
      {
        headers: { 'x-api-key': apiKey },
        signal,
      },
    )
  } catch {
    return errorResult(
      'network',
      'Check your connection and try loading the Product again.',
    )
  }

  if (response.status === 401) {
    return errorResult(
      'authentication',
      'The Product detail could not be authenticated.',
    )
  }

  if (response.status === 404) {
    return errorResult('not-found', 'The requested Product was not found.')
  }

  if (!response.ok) {
    return errorResult('server', 'The Product detail could not be loaded.')
  }

  try {
    const result = normalizeProductDetails(await response.json())

    if (result.status === 'success' && result.product.id !== productId) {
      return invalidPayloadResult()
    }

    return result
  } catch {
    return invalidPayloadResult()
  }
}
