export * from './typeUtils'

export const extend = Object.assign

export const objectToString = Object.prototype.toString
export const toTypeString = (value: unknown): string =>
  objectToString.call(value)

export const toRawType = (value: unknown): string => {
  // extract "RawType" from strings like "[object RawType]"
  return toTypeString(value).slice(8, -1)
}

export const isArray = Array.isArray
export const isMap = (val: unknown): val is Map<any, any> =>
  toTypeString(val) === '[object Map]'
export const isSet = (val: unknown): val is Set<any> =>
  toTypeString(val) === '[object Set]'

export const isDate = (val: unknown): val is Date => toTypeString(val) === '[object Date]'
export const isFunction = (val: unknown): val is Function =>
  typeof val === 'function'
export const isString = (val: unknown): val is string => typeof val === 'string'
export const isSymbol = (val: unknown): val is symbol => typeof val === 'symbol'
export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object'
export const isBoolean = (val: unknown): val is boolean => typeof val === 'boolean'

export const isPromise = <T = any>(val: unknown): val is Promise<T> => {
  return isObject(val) && isFunction(val.then) && isFunction(val.catch)
}

export const hasOwn = (
  val: object,
  key: string | symbol,
): key is keyof typeof val => Reflect.has(val, key)

export const isIntegerKey = (key: unknown) =>
  isString(key)
  && key !== 'NaN'
  && key[0] !== '-'
  && `${parseInt(key, 10)}` === key

export const hasChanged = (value: any, oldValue: any): boolean =>
  !Object.is(value, oldValue)
