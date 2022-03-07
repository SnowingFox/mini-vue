import { isObject } from '../shared/utils/is'
import { warn } from '../shared/utils/log'
import { baseHandler, createProxyHandler } from './baseHandlers'

export const reactiveMap = new WeakMap<Target, any>()

export const enum ReactiveFlags {
  SKIP = '_SKIP',
  IS_REACTIVE = '_IS_REACTIVE',
  IS_READONLY = '_IS_READONLY',
  IS_SHALLOW = ' _IS_SHALLOW',
  RAW = '_RAW',
}

export interface Target {
  [ReactiveFlags.SKIP]?: boolean
  [ReactiveFlags.IS_REACTIVE]?: boolean
  [ReactiveFlags.IS_READONLY]?: boolean
  [ReactiveFlags.IS_SHALLOW]?: boolean
  [ReactiveFlags.RAW]?: any
}

export const enum TargetType {
  COMMON,
  COLLECTION,
  INVALID,
}

export function isReadonly(target: Target) {
  return !!(target && target[ReactiveFlags.IS_READONLY])
}

export function isReactive(target: unknown) {
  return !!(target && (target as Target)[ReactiveFlags.IS_REACTIVE])
}

function targetTypeMap(rawType: string) {
  switch (rawType) {
    case 'Object':
    case 'Array':
      return TargetType.COMMON
    case 'Map':
    case 'Set':
    case 'WeakMap':
    case 'WeakSet':
      return TargetType.COLLECTION
    default:
      return TargetType.INVALID
  }
}

function createReactiveObject(
  target: Target,
  isReadonly: boolean,
  proxyMap: WeakMap<Target, any>,
  handler: ProxyHandler<object>,
) {
  if (!isObject(target)) {
    if (__DEV__) {
      warn(`value cannot to be reactive: ${target}, it must be an object`)
      return target
    }
  }

  if (isReactive(target)) {
    if (__DEV__) {
      console.warn('value is already proxy')
    }
  }

  // When target is already a Proxy, return it
  if (isReadonly || target[ReactiveFlags.IS_REACTIVE]) {
    return target
  }

  const existingProxy = proxyMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  const proxy = new Proxy(target, handler)

  return proxy
}

export function reactive<T extends object>(target: T): T {
  if (isReadonly(target)) {
    return target
  }

  return createReactiveObject(
    target,
    false,
    reactiveMap,
    baseHandler(),
  )
}
