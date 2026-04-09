# Lib Directory

This directory contains core utility modules for the Voter Matcher application.

## ConfigLoader

The `ConfigLoader` class is responsible for loading and verifying all configuration files with cryptographic hash verification.

### Usage

```typescript
import { ConfigLoader } from '@/lib/configLoader';

// Create a loader instance (defaults to /config directory)
const loader = new ConfigLoader();

// Load and verify all config files
try {
  const config = loader.load();
  
  // Access loaded configuration
  console.log('Loaded parties:', config.parties.parties.length);
  console.log('Loaded axes:', config.axes.axes.length);
  console.log('Config version:', config.version);
  console.log('Loaded at:', config.loadedAt);
} catch (error) {
  console.error('Config loading failed:', error.message);
  // Application should refuse to start if config verification fails
  process.exit(1);
}
```

### Hash Verification

Each config file must have a valid SHA256 hash in its `hash` field. The hash is computed over the entire file content with the hash field set to an empty string.

**Development:** Config files have `"hash": "PLACEHOLDER"` which will cause the loader to throw an error. This is intentional - hashes must be computed before deployment.

**Production:** Use the `scripts/validate-config.ts` tool (to be implemented in task 11.4) to compute and embed proper hashes.

### Error Handling

The ConfigLoader throws descriptive errors in the following cases:

1. **PLACEHOLDER hash:** Config file has not been properly hashed for deployment
2. **Hash mismatch:** File content has been modified or corrupted
3. **File not found:** Config file is missing from the expected location
4. **Invalid JSON:** Config file contains malformed JSON

All errors include the filename and specific failure reason to aid debugging.

### Type Safety

The ConfigLoader provides full TypeScript type definitions for all config structures:

- `PartyRegistry` - Party definitions and metadata
- `AxisRegistry` - Ideological axis definitions
- `ArchetypeRegistry` - Voter archetype profiles
- `LanguageRegistry` - Supported languages and localization settings
- `ScoringParams` - Scoring algorithm parameters
- `QuestionBank` - All questions and their weights
- `ConfigBundle` - Complete configuration bundle

### Testing

See `tests/configLoader.test.ts` and `tests/configLoader.integration.test.ts` for comprehensive test coverage including:

- Hash verification logic
- PLACEHOLDER detection
- Composite version string generation
- Error handling for various failure modes
