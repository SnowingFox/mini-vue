import { extend, isIntegerKey } from '@mini-vue/shared'
import type { ComputedRefImpl } from './computed'
import type { Dep } from './dep'
import { createDep } from './dep'
import type { TrackOpTypes } from './operations'
import { TriggerOpTypes } from './operations'

export type EffectScheduler = (...args: any[]) => any

type KeyToDepMap = Map<any, Dep>
const targetMap = new WeakMap<any, KeyToDepMap>()

interface ReactiveEffectOptions {
  lazy?: boolean
  scheduler?: EffectScheduler
  onStop?: () => void
  allowRecurse?: boolean
}

export interface ReactiveEffectRunner<T = any> {
  (): T
  effect: ReactiveEffect
}

export let activeEffect: ReactiveEffect | undefined

export const ITERATE_KEY = Symbol('')
export const MAP_KEY_ITERATE_KEY = Symbol('')

export let shouldTrack = true

export class ReactiveEffect<T = any> {
  active = true

  deps: Dep[] = []

  onStop?: () => void
  allowRecurse?: boolean

  computed?: ComputedRefImpl<T>

  constructor(
    public fn: () => T,
    public scheduler: EffectScheduler | null = null,
  ) {}

  run() {
    if (!this.active) {
      return this.fn()
    }

    activeEffect = this as ReactiveEffect
    shouldTrack = true

    const res = this.fn()

    activeEffect = undefined
    shouldTrack = false

    return res
  }

  stop() {
    if (this.active) {
      if (this.onStop) {
        this.onStop()
      }
      cleanupEffect(this)

      this.active = false
    }
  }
}

export function stop(runner: ReactiveEffectRunner) {
  runner.effect.stop()
}

function cleanupEffect(effect: ReactiveEffect) {
  const { deps } = effect

  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect)
    }
    deps.length = 0
  }
}

export function effect<T = any>(
  fn: () => T,
  options?: ReactiveEffectOptions,
): ReactiveEffectRunner {
  const _effect = new ReactiveEffect(fn)

  extend(_effect, options)

  if (!options || !options.lazy) {
    _effect.run()
  }

  const runner = _effect.run.bind(_effect) as ReactiveEffectRunner
  runner.effect = _effect

  return runner
}

const trackStack: boolean[] = []

export function pauseTracking() {
  trackStack.push(shouldTrack)
  shouldTrack = false
}

export function enableTracking() {
  trackStack.push(shouldTrack)
  shouldTrack = true
}

export function resetTracking() {
  const last = trackStack.pop()
  shouldTrack = last === undefined ? true : last
}

export function track(target: object, type: TrackOpTypes, key: unknown) {
  if (shouldTrack && activeEffect) {
    let depsMap = targetMap.get(target)

    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }

    let dep = depsMap.get(key)
    if (!dep) {
      depsMap.set(key, (dep = createDep()))
    }

    trackEffects(dep)
  }
}

export function trackEffects(
  dep: Dep,
) {
  const shouldTrack = !dep.has(activeEffect!)

  if (shouldTrack) {
    dep.add(activeEffect!)
    activeEffect!.deps.push(dep)
  }
}

export function trigger(
  target: object,
  type: TriggerOpTypes,
  key?: unknown,
  newValue?: unknown,
  oldValue?: unknown,
  oldTarget?: Map<unknown, unknown> | Set<unknown>,
) {
  const depsMap = targetMap.get(target)

  if (!depsMap) {
    return
  }

  let deps: (Dep | undefined)[] = []

  if (type === TriggerOpTypes.CLEAR) {
    deps = [...depsMap.values()]
  } else if (key) {
    let dep = depsMap.get(key) || depsMap.get(ITERATE_KEY)

    if (type === TriggerOpTypes.ADD && isIntegerKey(key)) {
      dep = depsMap.get('length')
    }

    deps.push(dep)
  }

  const effects: ReactiveEffect[] = []

  for (const dep of deps) {
    if (dep) {
      effects.push(...dep)
    }
  }

  triggerEffects(createDep(effects))
}

export function triggerEffects(dep: Dep | ReactiveEffect[]) {
  const effects = Array.isArray(dep) ? dep : [...dep]

  for (const effect of effects) {
    if (effect !== activeEffect || effect.allowRecurse) {
      if (effect.scheduler) {
        effect.scheduler()
      } else {
        effect.run()
      }
    }
  }
}
