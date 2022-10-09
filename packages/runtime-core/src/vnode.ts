import type { RendererElement } from './renderer'

export const Text = Symbol('Text')
export const Fragment = Symbol('Fragment')
export const Comment = Symbol('Comment')

export type VNodeTypes =
  | string
  | VNode
  | typeof Text
  | typeof Comment
  | typeof Fragment

export interface VNode<HostNode = RendererElement, ParentNode = any> {
  type: VNodeTypes

  el?: HostNode | null

  children?: Object | string | Object[]
}

export interface VNodeProps {

}

