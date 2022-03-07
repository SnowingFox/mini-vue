import type { Fn } from '../shared/types'

export type ActiveEffect = Fn | null
export type DepSet = Set<Fn>
export type KeyToDepMap = Map<any, DepSet>

let activeEffect: ActiveEffect = null

const targetMap = new WeakMap<any, KeyToDepMap>()

export function track(target: object, key: unknown) {
  if (activeEffect) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }

    let dep = depsMap.get(key)
    if (!dep) {
      depsMap.set(key, (dep = new Set()))
    }
    dep.add(activeEffect)
  }
}

export function trigger(target: object, key: unknown) {
  const depsMap = targetMap.get(target)

  if (!depsMap) {
    return
  }

  let dep = depsMap.get(key)
  if (dep) {
    dep.forEach((effect) => {
      effect()
    })
  }
}

export function effect<T = any>(
  fn: Fn<T>,
) {
  activeEffect = fn
  activeEffect()
  activeEffect = null
}
