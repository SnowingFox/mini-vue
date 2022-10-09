import { isString } from '@mini-vue/shared'
import { Text } from './vnode'
import type { VNode, VNodeProps } from './vnode'

export interface RendererNode {
  [key: string]: any
}

export interface RendererElement extends RendererNode {
  _vnode?: VNode
}

export type RootRenderFunction<HostElement = RendererNode> = (
  vnode: VNode | null,
  container: HostElement
) => void

type UnmountFn<HostRenderElement> = (container: HostRenderElement) => void

type PatchFn<HostRenderElement> = (
  n1: VNode | null, // null means this is a mount
  n2: VNode,
  container: HostRenderElement,
) => void

export interface RendererOptions<
  HostNode = RendererNode,
  HostElement = RendererElement,
  > {
  patchProp(
    el: HostElement,
    key: string,
    prevValue: any,
    nextValue: any,
    isSVG?: boolean,
    prevChildren?: VNode<HostNode, HostElement>[],
    parentComponent?: any, // ComponentInternalInstance | null,
    parentSuspense?: any, // SuspenseBoundary | null,
    unmountChildren?: any // UnmountChildrenFn
  ): void
  insert(el: HostNode, parent: HostElement, anchor?: HostNode | null): void
  remove(el: HostNode): void
  createElement(
    type: string,
    vnodeProps?: (VNodeProps & { [key: string]: any }) | null
  ): HostNode
  createText(text: string): HostNode
  createComment(text: string): HostNode
  setText(node: HostNode, text: string): void
  setElementText(node: HostElement, text: string): void
  parentNode(node: HostNode): HostElement | null
  nextSibling(node: HostNode): HostNode | null
  querySelector?(selector: string): HostElement | null
}

export function createRenderer<HostElement, HostRenderElement extends RendererElement>(
  options: RendererOptions<HostElement, HostRenderElement>,
) {
  const {
    insert: hostInsert,
    createElement: hostCreateElement,
    setText: hostSetText,
    remove: hostRemove,
  } = options

  const patch: PatchFn<HostRenderElement> = (n1, n2, container) => {
    if (n1 === n2) {
      return
    }

    const { type } = n2

    switch (type) {
      case Text:
        processText()
        break
    }
  }

  const unmount: UnmountFn<HostRenderElement> = (container) => {
    hostRemove(container._vnode!.el as HostElement)
  }

  const render: RootRenderFunction<HostRenderElement> = (vnode, container) => {
    if (vnode === null && container._vnode) {
      unmount(container)
    } else {
      if (!isString(container)) {
        patch(null, vnode!, container)
      }
    }
  }

  function mountElement(vnode: VNode, container: HostRenderElement) {
    const el = vnode.el = hostCreateElement(vnode.type as string)!
    const { children } = vnode

    if (vnode.children) {
      if (isString(children)) {
        hostSetText(el, children)
      }
    }

    container._vnode = vnode

    hostInsert(el, container)
  }

  function processText() {}

  return {
    render,
  }
}

