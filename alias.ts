import { resolve } from 'path'

const r = (p: string) => resolve(__dirname, p)

export const alias: Record<string, string> = {
  '@mini-vue/shared': r('./packages/shared/src/'),
  '@mini-vue/reactivity': r('./packages/reactivity/src/index.ts'),
  '@mini-vue/runtime-core': r('./packages/runtime-core/src/'),
  '@mini-vue/playground': r('./packages/playground/src/'),
}
