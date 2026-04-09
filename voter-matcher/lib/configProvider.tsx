'use client';

/**
 * ConfigProvider - React context for ConfigBundle
 * 
 * This module provides a React context that makes the ConfigBundle available
 * to all components via the useConfig() hook.
 * 
 * Design principles:
 * - Config is loaded server-side and passed as a prop (avoids fs module in client)
 * - Provides the config to all child components via context
 * - Throws descriptive errors if config is not provided
 * - Makes ConfigBundle available to all child components via context
 * 
 * Usage:
 * ```tsx
 * // In app layout (server component):
 * const loader = new ConfigLoader();
 * const config = loader.load();
 * 
 * <ConfigProvider config={config}>
 *   <YourApp />
 * </ConfigProvider>
 * 
 * // In any component:
 * const config = useConfig();
 * ```
 * 
 * @module lib/configProvider
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { ConfigBundle } from './configLoader';

const ConfigContext = createContext<ConfigBundle | undefined>(undefined);

interface ConfigProviderProps {
  config: ConfigBundle;
  children: ReactNode;
}

/**
 * ConfigProvider - Provides ConfigBundle to all child components
 * 
 * This component should wrap the entire application at the root level.
 * The config must be loaded server-side and passed as a prop.
 * 
 * @param props.config - The ConfigBundle loaded server-side
 * @param props.children - Child components that will have access to config
 */
export function ConfigProvider({ config, children }: ConfigProviderProps) {
  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
}

/**
 * useConfig - Hook to access ConfigBundle from any component
 * 
 * This hook must be used within a component that is a child of ConfigProvider.
 * It provides access to the loaded config.
 * 
 * @returns ConfigBundle
 * @throws Error if used outside of ConfigProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const config = useConfig();
 *   
 *   // Use config.parties, config.axes, etc.
 *   return <div>{config.parties.parties.length} parties loaded</div>;
 * }
 * ```
 */
export function useConfig(): ConfigBundle {
  const context = useContext(ConfigContext);
  
  if (context === undefined) {
    throw new Error(
      'useConfig must be used within a ConfigProvider. ' +
      'Wrap your app with <ConfigProvider> at the root level.'
    );
  }
  
  return context;
}
