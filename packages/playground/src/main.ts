import type { Ref } from '@mini-vue/reactivity'
import { effect, ref } from '@mini-vue/reactivity'

const app = document.querySelector('#app')!

function App() {
  const count = ref(0)

  const button = document.createElement('button')

  button.textContent = 'inc'
  button.addEventListener('click', () => {
    count.value++
  })

  return () => {
    patch(count)
    return button
  }
}

function render(app: Element, vnode: HTMLElement) {
  app.appendChild(vnode)
}

function patch(state: Ref) {
  app.innerHTML = `${state.value}`
}

const component = App()

effect(() => {
  render(app!, component())
})
