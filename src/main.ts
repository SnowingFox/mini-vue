import { effect } from './reactive/effect'
import { reactive } from './reactive/reactive'

const price = reactive({ count: 0, quantity: 0 })

effect(() => console.log(price))
