# ConfigProvider Documentation

## Overview

The `ConfigProvider` is a React context component that makes the application's configuration bundle available to all components throughout the app. It follows the design specified in the Voter Matcher TN 2026 design document.

## Architecture

### Server-Side Loading

The config is loaded **server-side** in the root layout component using the `ConfigLoader` class. This approach:

- Avoids using Node.js `fs` module in client components
- Ensures config is loaded once at app startup
- Provides hash verification before the app renders
- Enables static optimization in Next.js

### Client-Side Context

The `ConfigProvider` is a client component that:

- Receives the pre-loaded config as a prop
- Makes it available via React Context
- Provides the `useConfig()` hook for easy access

## Usage

### In Root Layout (Server Component)

```tsx
// app/layout.tsx
import { ConfigProvider } from '@/lib/configProvider';
import { ConfigLoader } from '@/lib/configLoader';

export default function RootLayout({ children }) {
  // Load config server-side
  const loader = new ConfigLoader();
  const config = loader.load();

  return (
    <html>
      <body>
        <ConfigProvider config={config}>
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}
```

### In Any Component (Client or Server)

```tsx
'use client';

import { useConfig } from '@/lib/configProvider';

export function MyComponent() {
  const config = useConfig();

  return (
    <div>
      <h1>Parties: {config.parties.parties.length}</h1>
      <h2>Questions: {config.questions.questions.length}</h2>
    </div>
  );
}
```

## Config Bundle Structure

The `ConfigBundle` contains:

- `parties`: Party registry with all party metadata
- `axes`: Axis registry defining ideological dimensions
- `archetypes`: Archetype registry for voter profiling
- `languages`: Language registry for i18n support
- `questions`: Question bank with all questions and weights
- `scoringParams`: Scoring parameters and thresholds
- `version`: Composite version string
- `loadedAt`: ISO timestamp of when config was loaded

## Error Handling

### Hash Verification Failures

If any config file fails hash verification, the `ConfigLoader` will throw an error during server-side rendering, preventing the app from starting. This ensures config integrity.

### Missing Config Files

If any required config file is missing, the app will fail to build/start with a descriptive error message.

### Using useConfig Outside Provider

If `useConfig()` is called outside of a `ConfigProvider`, it will throw:

```
Error: useConfig must be used within a ConfigProvider.
Wrap your app with <ConfigProvider> at the root level.
```

## Hash Management

Config file hashes are computed using the `scripts/compute-hashes.ts` utility:

```bash
npx tsx scripts/compute-hashes.ts
```

This script:
1. Reads each config file
2. Sets the hash field to empty string
3. Computes SHA256 hash of the content
4. Updates the file with the computed hash

**Important**: Always run this script after modifying any config file.

## Design Principles

1. **Zero Hardcoded Content**: All political content comes from config files
2. **Hash Verification**: Cryptographic integrity check on all config
3. **Server-Side Loading**: Config loaded once at startup, not per-request
4. **Type Safety**: Full TypeScript types for all config structures
5. **Single Source of Truth**: ConfigBundle is the only source for all config data

## Future Enhancements

- API endpoint for runtime config updates (Task 6.1)
- Config versioning and migration support
- Hot reload during development
- Config validation beyond hash checking
