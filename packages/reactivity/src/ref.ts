import { hasChanged, isArray } from '@mini-vue/shared'
import type { IfAny } from '@mini-vue/shared/src/typeUtils'
import { createDep } from './dep'
import type { Dep } from './dep'
import { activeEffect, shouldTrack, trackEffects, triggerEffects } from './effect'
import { isReactive, isReadonly, isShallow, toRaw, toReactive } from './reactive'

declare const RefSymbol: unique symbol
export declare const RawSymbol: unique symbol

export interface Ref<T = any> {
  value: T
  [RefSymbol]: true
}

interface RefBase<T> {
  dep?: Dep
  value: T
}

export function trackRefValue(ref: RefBase<any>) {
  if (shouldTrack && activeEffect) {
    ref = toRaw(ref)

    trackEffects(ref.dep || (ref.dep = createDep()))
  }
}

export function triggerRefValue(ref: RefBase<any>) {
  ref = toRaw(ref)
  if (ref.dep) {
    triggerEffects(ref.dep)
  }
}

class RefImpl<T> {
  private _value: T
  private _rawValue: T

  dep?: Dep = undefined
  readonly __v_isRef = true

  constructor(
    value: T,
    public readonly __v_isShallow: boolean,
  ) {
    this._rawValue = __v_isShallow ? value : toRaw(value)
    this._value = __v_isShallow ? value : toReactive(value)
  }

  get value() {
    trackRefValue(this)
    return this._value
  }

  set value(newVal) {
    const useOriginalValue = this.__v_isShallow || isShallow(newVal) || isReadonly(newVal)

    newVal = useOriginalValue ? newVal : toRaw(newVal)

    if (hasChanged(newVal, this._rawValue)) {
      this._rawValue = newVal
      this._value = useOriginalValue ? newVal : toReactive(newVal)
      triggerRefValue(this)
    }
  }
}

export function createRef(value: unknown, shallow: boolean) {
  return new RefImpl(value, shallow)
}

export function ref<T extends object>(
  value: T
): [T] extends [Ref] ? T : Ref<UnwrapRef<T>>

export function ref<T>(value: T): Ref<UnwrapRef<T>>
export function ref<T = any>(): Ref<T | undefined>
export function ref(value?: unknown) {
  return createRef(value, false) as any
}

export function isRef<T>(r: Ref<T> | unknown): r is Ref<T>
export function isRef(r: any): r is Ref {
  return !!(r && r.__v_isRef)
}

export function unref<T>(ref: T | Ref<T>): T {
  return isRef(ref) ? ref.value : ref
}

class ObjectRefImpl<T extends object, K extends keyof T> {
  public readonly __v_isRef = true

  constructor(
    private readonly _object: T,
    private readonly _key: K,
    private readonly _defaultValue?: T[K],
  ) {}

  get value() {
    const val = this._object[this._key]
    return val === undefined ? (this._defaultValue as T[K]) : val
  }

  set value(newVal) {
    this._object[this._key] = newVal
  }
}

export type ToRef<T> = IfAny<T, Ref<T>, [T] extends [Ref] ? T : Ref<T>>

export function toRef<T extends object, K extends keyof T>(
  object: T,
  key: K
): ToRef<T[K]>

export function toRef<T extends object, K extends keyof T>(
  object: T,
  key: K,
  defaultValue: T[K]
): ToRef<Exclude<T[K], undefined>>

export function toRef<T extends object, K extends keyof T>(
  object: T,
  key: K,
  defaultValue?: T[K],
): ToRef<T[K]> {
  const val = object[key]
  return isRef(val)
    ? val
    : (new ObjectRefImpl(object, key, defaultValue) as any)
}

export type ToRefs<T = any> = {
  [K in keyof T]: ToRef<T[K]>
}

export function toRefs<T extends object>(
  object: T,
): ToRefs<T> {
  const ret = isArray(object) ? new Array(object.length) : {} as any

  for (const key in object) {
    ret[key] = toRef(object, key)
  }

  return ret
}
const shallowUnwrapHandlers: ProxyHandler<any> = {
  get: (target, key, receiver) => unref(Reflect.get(target, key, receiver)),
  set: (target, key, value, receiver) => {
    const oldValue = target[key]
    if (isRef(oldValue) && !isRef(value)) {
      oldValue.value = value
      return true
    } else {
      return Reflect.set(target, key, value, receiver)
    }
  },
}

export function proxyRefs<T extends object>(
  objectWithRefs: T,
): ShallowUnwrapRef<T> {
  return isReactive(objectWithRefs)
    ? objectWithRefs
    : new Proxy(objectWithRefs, shallowUnwrapHandlers)
}

export interface RefUnwrapBailTypes {}

type BaseTypes = string | number | boolean

export type ShallowUnwrapRef<T> = {
  [K in keyof T]: T[K] extends Ref<infer V>
    ? V
    : // if `V` is `unknown` that means it does not extend `Ref` and is undefined
    T[K] extends Ref<infer V> | undefined
      ? unknown extends V
        ? undefined
        : V | undefined
      : T[K]
}

export declare const ShallowReactiveMarker: unique symbol

declare const ShallowRefMarker: unique symbol

export type ShallowRef<T = any> = Ref<T> & { [ShallowRefMarker]?: true }

export type UnwrapRef<T> = T extends ShallowRef<infer V>
  ? V
  : T extends Ref<infer V>
    ? UnwrapRefSimple<V>
    : UnwrapRefSimple<T>

export type UnwrapRefSimple<T> = T extends
| Function
| BaseTypes
| Ref
| RefUnwrapBailTypes[keyof RefUnwrapBailTypes]
| { [RawSymbol]?: true }
  ? T
  : T extends Array<any>
    ? { [K in keyof T]: UnwrapRefSimple<T[K]> }
    : T extends object & { [ShallowReactiveMarker]?: never }
      ? {
          [P in keyof T]: P extends symbol ? T[P] : UnwrapRef<T[P]>
        }
      : T
