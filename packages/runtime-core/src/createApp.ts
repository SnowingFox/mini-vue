import type { ComponentInstance } from './component'
import type { RootRenderFunction } from './renderer'

export interface App<HostElement> {
  mount(
    container: HostElement | string
  ): void
}

export function createAppAPI<HostElement>(
  render: RootRenderFunction<HostElement>,
) {
  return function createApp(
    rootApp: ComponentInstance,
  ) {
    const app: App<HostElement> = {
      mount(container) {

      },
    }
  }
}
