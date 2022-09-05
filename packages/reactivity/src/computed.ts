import { isFunction } from '@mini-vue/shared'
import type { Dep } from './dep'
import { ReactiveEffect } from './effect'
import { ReactiveFlags, toRaw } from './reactive'
import { trackRefValue, triggerRefValue } from './ref'
import type { Ref } from './ref'

declare const ComputedRefSymbol: unique symbol

export interface ComputedRef<T = any> extends WritableComputedRef<T> {
  readonly value: T
  [ComputedRefSymbol]: true
}

export interface WritableComputedRef<T> extends Ref<T> {
  readonly effect: ReactiveEffect<T>
}

export type ComputedGetter<T> = (...args: any[]) => T
export type ComputedSetter<T> = (v: T) => void

export interface WritableComputedOptions<T> {
  get: ComputedGetter<T>
  set: ComputedSetter<T>
}

export class ComputedRefImpl<T> {
  public dep?: Dep = undefined

  private _value!: T
  public readonly effect: ReactiveEffect<T>

  readonly __v_isRef = true
  readonly [ReactiveFlags.IS_READONLY]: boolean = false

  public _dirty = true

  constructor(
    getter: ComputedGetter<T>,
    private readonly _setter: ComputedSetter<T>,
  ) {
    this.effect = new ReactiveEffect<T>(getter, () => {
      if (!this._dirty) {
        this._dirty = true
        triggerRefValue(this)
      }
    })
  }

  get value() {
    const self = toRaw(this)
    trackRefValue(self)

    if (self._dirty) {
      self._dirty = false
      self._value = self.effect.run()
    }

    return self._value
  }

  set value(newVal) {
    this._setter(newVal)
  }
}

export function computed<T>(
  getter: ComputedGetter<T>,
): ComputedRef<T>
export function computed<T>(
  options: WritableComputedOptions<T>,
): WritableComputedRef<T>
export function computed<T>(
  getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>,
) {
  let getter: ComputedGetter<T>
  let setter: ComputedSetter<T>

  const onlyGetter = isFunction(getterOrOptions)
  if (onlyGetter) {
    getter = getterOrOptions
    setter = () => console.warn('Write operation failed: computed value is readonly')
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  return new ComputedRefImpl(getter, setter) as any
}
