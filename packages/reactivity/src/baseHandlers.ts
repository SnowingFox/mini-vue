import { hasChanged, hasOwn, isArray, isIntegerKey, isObject, isSymbol } from '@mini-vue/shared'
import type { Target } from './reactive'
import {
  ReactiveFlags,
  isReadonly,
  reactive,
  reactiveMap,
  readonly,
  readonlyMap,
  shallowReactiveMap, shallowReadonlyMap,
} from './reactive'
import { TrackOpTypes, TriggerOpTypes } from './operations'
import { ITERATE_KEY, track, trigger } from './effect'

const get = /* #__PURE__ */ createGetter()
const shallowGet = /* #__PURE__ */ createGetter(false, true)
const readonlyGet = /* #__PURE__ */ createGetter(true)
const shallowReadonlyGet = /* #__PURE__ */ createGetter(true, true)

function createGetter(isReadonly = false, shallow = false) {
  return function get(target: Target, key: string | symbol, receiver: object) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly
    } else if (key === ReactiveFlags.IS_SHALLOW) {
      return shallow
    } else if (
      key === ReactiveFlags.RAW
      && receiver === (
        isReadonly
          ? shallow ? shallowReadonlyMap : readonlyMap
          : shallow ? shallowReactiveMap : reactiveMap
      ).get(target)
    ) {
      return target
    }

    if (!isReadonly) {
      track(target, TrackOpTypes.GET, key)
    }

    const res = Reflect.get(target, key, receiver)

    if (shallow) {
      return res
    }

    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res)
    }

    return res
  }
}

const set = /* #__PURE__ */ createSetter()
const shallowSet = /* #__PURE__ */ createSetter(true)

function createSetter(shallow = false) {
  return function set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object,
  ): boolean {
    const oldValue = (target as any)[key]

    if (isReadonly(oldValue)) {
      return false
    }

    const hadKey
      = isArray(target) && isIntegerKey(key)
        ? Number(key) < target.length
        : hasOwn(target, key)

    const result = Reflect.set(target, key, value, receiver)

    if (!hadKey) {
      trigger(target, TriggerOpTypes.ADD, key, value)
    } else if (hasChanged(value, oldValue)) {
      trigger(target, TriggerOpTypes.SET, key, value)
    }

    return result
  }
}

export const mutableHandlers: ProxyHandler<object> = {
  get,
  set,
  deleteProperty,
  ownKeys,
  has,
}

export const readonlyHandlers: ProxyHandler<object> = {
  get: readonlyGet,
  set() {
    return true
  },
  deleteProperty() {
    return true
  },
}

function deleteProperty(target: object, key: string | symbol): boolean {
  const hadKey = hasOwn(target, key)
  const oldValue = (target as any)[key]
  const result = Reflect.deleteProperty(target, key)
  if (result && hadKey) {
    trigger(target, TriggerOpTypes.DELETE, key, undefined, oldValue)
  }
  return result
}

function has(target: object, key: string | symbol): boolean {
  const result = Reflect.has(target, key)
  if (!isSymbol(key)) {
    track(target, TrackOpTypes.HAS, key)
  }
  return result
}

function ownKeys(target: object): (string | symbol)[] {
  track(target, TrackOpTypes.ITERATE, isArray(target) ? 'length' : ITERATE_KEY)
  return Reflect.ownKeys(target)
}
