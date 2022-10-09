import { createRenderer } from '@mini-vue/runtime-core'

const renderer = createRenderer<HTMLDivElement, HTMLDivElement>({
  createElement(type) {
    return document.createElement(type)
  },
  insert(el, parent) {
    parent.appendChild(el)
  },
  setText(node, text) {
    node.textContent = text
  },
  remove(el) {
    el.remove()
  },
})

const app = { tag: 'div', children: 'hello world' }

renderer.render(app, document.querySelector('#app')!)
