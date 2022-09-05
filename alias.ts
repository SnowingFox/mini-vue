import { resolve } from 'path'

const r = (p: string) => resolve(__dirname, p)

export const alias: Record<string, string> = {
  '@mini-vue/shared': r('./packages/shared/src/'),
  '@mini-vue/reactivity': r('./packages/reactivity/src/index.ts'),
}
