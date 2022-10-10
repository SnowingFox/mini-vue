import { isArray, isString } from '@mini-vue/shared'
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

type PatchFn<HostRenderElement = RendererElement> = (
  n1: VNode | null, // null means this is a mount
  n2: VNode,
  container: HostRenderElement,
  anchor?: RendererNode | null,
) => void

export interface RendererOptions<
  HostNode = RendererNode,
  HostElement = RendererElement,
  > {
  patchProp(
    el: HostNode,
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

export function createRenderer<HostElement extends RendererNode, HostRenderElement extends RendererElement>(
  options: RendererOptions<HostElement, HostRenderElement>,
) {
  const {
    insert: hostInsert,
    createElement: hostCreateElement,
    setText: hostSetText,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createText: hostCreateText,
  } = options

  const patch: PatchFn<HostRenderElement> = (n1, n2, container, anchor) => {
    if (n1 === n2) {
      return
    }

    const { type } = n2

    switch (type) {
      case Text:
        processText(
          n1,
          n2,
          container as HostRenderElement,
          anchor as HostElement,
        )
        break
      default:
        if (isString(type)) {
          processElement(n1, n2, container, anchor as HostElement)
        }
    }
  }

  const unmount: UnmountFn<VNode<HostElement>> = (vnode) => {
    hostRemove(vnode!.el as HostElement)
  }

  const render: RootRenderFunction<HostRenderElement> = (vnode, container) => {
    if (vnode === null && container._vnode) {
      unmount(container._vnode as any)
    } else {
      if (!isString(container)) {
        patch(container._vnode || null, vnode!, container)
      }
    }
  }

  function processText(n1: VNode | null, n2: VNode, container: HostRenderElement, anchor: HostElement | null) {
    if (n1 == null) {
      hostInsert(
        n2.el = hostCreateText(n2.children as string)!,
        container,
        anchor,
      )
    } else {
      const el = n2.el = n1.el as HostElement
      if (n1.children !== n2.children) {
        hostSetText(el, n2.children as string)
      }
    }
  }

  function processElement(n1: VNode | null, n2: VNode, container: HostRenderElement, anchor: HostElement | null) {
    if (n1 == null) {
      mountElement(n2, container)
    } else {
      patchElement(n1, n2)
    }
  }

  function mountElement(vnode: VNode, container: HostRenderElement) {
    const el = vnode.el = hostCreateElement(vnode.type as string)!
    const { children, props } = vnode

    // children
    if (children) {
      if (isString(children)) {
        hostSetText(el, children)
      } else if (isArray(children)) {
        for (const child of children) {
          patch(null, child, el as any)
        }
      }
    }

    // props
    if (props) {
      for (const prop in props) {
        hostPatchProp(el, prop, null, props[prop])
      }
    }

    container._vnode = vnode

    hostInsert(el, container)
  }

  function patchElement(n1: VNode, n2: VNode) {
    const el = n2.el = n1.el as HostElement

    const oldProps = n1.props || {}
    const newProps = n2.props || {}

    for (const key in newProps) {
      if (newProps[key] !== oldProps[key]) {
        hostPatchProp(el, key, oldProps[key], newProps[key])
      }
    }

    for (const key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null)
      }
    }

    patchChildren(n1, n2, el)
  }

  function patchChildren(n1: VNode, n2: VNode, container: HostElement) {
    if (isString(n2.children)) {
      if (isArray(n1?.children)) {
        for (const child of n1.children) {
          unmount(child)
        }
      }

      hostSetText(container, n2.children)
    } else if (isArray(n2.children)) {
      if (isArray(n1.children)) {
        for (const child of n1.children) {
          unmount(child)
        }

        for (const child of n2.children) {
          mountElement(child, container as any)
        }
      } else {
        hostSetText(n1 as any, '')
        for (const child of n2.children) {
          mountElement(child, container as any)
        }
      }
    } else {
      if (isArray(n1.children)) {
        for (const child of n1.children) {
          unmount(child)
        }
      } else {
        hostSetText(n1 as any, '')
      }
    }
  }

  return {
    render,
  }
}

