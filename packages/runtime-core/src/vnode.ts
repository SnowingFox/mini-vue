import type { RendererElement, RendererNode } from './renderer'

export const Text = Symbol('Text')
export const Fragment = Symbol('Fragment')
export const Comment = Symbol('Comment')

export type VNodeTypes =
  | string
  | VNode
  | typeof Text
  | typeof Comment
  | typeof Fragment

export type VNodeProps = Record<string, string>

export interface VNode<HostNode = RendererNode, HostElement = RendererElement> {
  type: VNodeTypes

  el: HostNode | null

  children?: Object | string | Object[]

  props?: VNodeProps
}

