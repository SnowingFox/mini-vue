import { track, trigger } from './effect'

export function createProxyHandler() {
  return baseHandler
}

export const baseHandler = <T extends object>(): ProxyHandler<T> => ({
  get(target: T, key: string | symbol, receiver: any): any {
    const result = Reflect.get(target, key, receiver)
    track(target, key)
    return result
  },
  set(target: T, key: string, value: any, receiver: any) {
    const oldVal = (target as any)[key]
    const result = Reflect.set(target, key, value, receiver)
    if (result && oldVal !== value) {
      trigger(target, key)
    }

    return result
  },
})
