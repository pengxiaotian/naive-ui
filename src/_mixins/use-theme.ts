import { inject, computed, onBeforeMount, ComputedRef, PropType } from 'vue'
import { merge } from 'lodash-es'
import globalStyle from '../_styles/global/index.cssr'
import { CNode } from 'css-render'
import {
  ConfigProviderInjection,
  ThemeOverrides
} from '../config-provider/index.js'
import type { ThemeCommonVars } from '../_styles/new-common'

globalStyle.mount({
  id: 'naive-ui-global'
})

interface Theme<T> {
  name: string
  common?: any
  peers?: any
  self(vars: ThemeCommonVars): T
}

type UseThemeProps<T> = Readonly<{
  unstableTheme: Theme<T>
  unstableThemeOverrides: ThemeOverrides
  builtinThemeOverrides: ThemeOverrides
  [key: string]: unknown
}>

export interface MergedTheme<T> {
  common: ThemeCommonVars
  self: T
  peers: any
  overrides: any
}

function useTheme<T> (
  resolveId: string,
  mountId: string,
  style: CNode | undefined,
  defaultTheme: Theme<T>,
  props: UseThemeProps<T>
): ComputedRef<MergedTheme<T>> {
  if (style) {
    onBeforeMount(() => {
      style.mount({
        target: mountId
      })
    })
  }
  const NConfigProvider = inject<ConfigProviderInjection | null>(
    'NConfigProvider',
    null
  )
  const mergedThemeRef = computed(() => {
    // keep props to make theme overrideable
    const {
      unstableTheme: { common, self, peers = {} } = {},
      unstableThemeOverrides: selfOverrides = {},
      builtinThemeOverrides: builtinOverrides = {}
    } = props
    const {
      common: commonOverrides,
      peers: peersOverrides = {}
    } = selfOverrides
    const {
      mergedUnstableTheme: {
        common: injectedGlobalCommon = undefined,
        [resolveId]: {
          common: injectedCommon = undefined,
          self: injectedSelf = undefined,
          peers: injectedPeers = {}
        } = {}
      } = {},
      mergedUnstableThemeOverrides: {
        common: injectedGlobalCommonOverrides = undefined,
        [resolveId]: injectedSelfOverrides = {}
      } = {}
    } = NConfigProvider || {}
    const {
      common: injectedCommonOverrides,
      peers: injectedPeersOverrides = {}
    } = injectedSelfOverrides
    const mergedCommon = merge(
      common ||
        injectedCommon ||
        injectedGlobalCommon ||
        defaultTheme.common ||
        {},
      injectedGlobalCommonOverrides,
      injectedCommonOverrides,
      commonOverrides
    )
    const mergedSelf = merge(
      (self || injectedSelf || defaultTheme.self)?.(mergedCommon) || {},
      builtinOverrides,
      injectedSelfOverrides,
      selfOverrides
    )
    return {
      common: mergedCommon,
      self: mergedSelf,
      peers: merge(defaultTheme.peers, peers, injectedPeers),
      overrides: merge(peersOverrides, injectedPeersOverrides)
    }
  })
  return mergedThemeRef
}

useTheme.props = {
  unstableTheme: {
    type: Object,
    default: undefined
  },
  unstableThemeOverrides: {
    type: Object,
    default: undefined
  },
  builtinThemeOverrides: {
    type: Object,
    default: undefined
  }
}

useTheme.createProps = function <T> () {
  return {
    unstableTheme: {
      type: Object as PropType<Theme<T>>,
      default: undefined
    },
    unstableThemeOverrides: {
      type: Object,
      default: undefined
    },
    builtinThemeOverrides: {
      type: Object,
      default: undefined
    }
  }
}

/**
 * props.unstableTheme:
 * { common, self(), peers }
 * provider.unstableTheme:
 * { common, Button: { common, self(), peers } }
 * defaultTheme:
 * { common, self(), peers }
 *
 * props.themeOverrides:
 * { { common, self, peers } }
 * provider.themeOverrides:
 * { common, Button: { common, self, peers } }
 */
export default useTheme