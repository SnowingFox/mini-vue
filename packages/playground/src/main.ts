import { effect, ref } from '@mini-vue/reactivity'
import { createRenderer } from '@mini-vue/runtime-core'
import type { RendererNode } from '@mini-vue/runtime-core/src'
import { isArray, isBoolean, isObject, isString } from '@mini-vue/shared'

function shouldSetAsProps(el: RendererNode, key: string) {
  if (key === 'form' && el.tagName === 'INPUT')
    return false

  return key in el
}

function normalizeClass(clsName: string | Record<string, boolean> | Array<any>) {
  const res = []

  const processObjectCls = (obj: Object) => {
    const ret = []

    for (const [key, val] of Object.entries(obj)) {
      if (val) {
        ret.push(key)
      }
    }

    return ret
  }

  if (isString(clsName)) {
    res.push(clsName)
  } else if (isArray(clsName)) {
    for (const item of (clsName as any[])) {
      if (isObject(item)) {
        res.push(...processObjectCls(item))
      } else if (isString(item)) {
        res.push(item)
      }
    }
  } else if (isObject(clsName)) {
    res.push(...processObjectCls(clsName))
  }

  return res.join(' ')
}

const renderer = createRenderer<HTMLDivElement & { _invoker: any }, HTMLDivElement>({
  createElement(type) {
    return document.createElement(type)
  },
  insert(el, parent, anchor = null) {
    parent.insertBefore(el, anchor)
  },
  setText(node, text) {
    node.textContent = text
  },
  remove(el) {
    el.remove()
  },
  createText(text) {
    return document.createTextNode(text)
  },
  patchProp(el, key, prevVal, nextVal) {
    if (prevVal === nextVal)
      return

    const type = typeof (el as any)[key]

    if (key.startsWith('on')) {
      const name = key.slice(2).toLowerCase()

      const invokers = el._invoker || (el._invoker = {})
      let invoker = invokers[key]

      if (nextVal) {
        if (!invoker) {
          invoker = el._invoker[key] = (e: Event) => {
            if (e.timeStamp < invoker.attached)
              return

            if (isArray(invoker.value)) {
              invoker.value.forEach((fn: (e: Event) => void) => fn(e))
            } else {
              invoker.value(e)
            }
          }

          invoker.value = nextVal
          invoker.attached = performance.now()
          el.addEventListener(name, invoker)
        } else {
          invoker = nextVal
        }
      }
    } else {
      if (key === 'class') {
        nextVal = normalizeClass(nextVal)
      }

      if (shouldSetAsProps(el, key)) {
        if (isBoolean(type) && nextVal === '') {
          (el as any)[key] = true
        } else {
          (el as any)[key] = nextVal
        }
      } else {
        el.setAttribute(key, nextVal)
      }
    }
  },
})

const flag = ref(false)

effect(() => {
  const app = {
    type: 'div',
    props: {
      ...(flag.value && {
        onClick() {
          console.log('parent clicked')
        },
      }),
    },
    children: [
      {
        type: 'h1',
        children: 'hello h1',
        props: {
          class: [
            'a',
          ],
          onClick() {
            flag.value = true
          },
        },
      },
    ],
  }

  renderer.render(app, document.querySelector('#app')!)
})
