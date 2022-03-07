import { effect } from './effect'
import { ref } from './ref'

export type ComputedGetter<T> = (...args: any[]) => T

export function computed<T>(getter: ComputedGetter<T>) {
  const result = ref()

  effect(() => (result.value = getter()))

  return result
}
