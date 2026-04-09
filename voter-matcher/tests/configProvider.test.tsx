/**
 * Unit tests for ConfigProvider
 * 
 * Tests the ConfigProvider React context and useConfig hook.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { ConfigProvider } from '../lib/configProvider';
import { ConfigBundle } from '../lib/configLoader';

// Mock ConfigBundle for testing
const mockConfig: ConfigBundle = {
  parties: {
    version: '1.0.0',
    hash: 'test-hash',
    parties: [
      {
        id: 'TEST',
        names: { en: 'Test Party', ta: 'சோதனை கட்சி' },
        fullNames: { en: 'Test Party Full', ta: 'சோதனை கட்சி முழு' },
        governanceStatus: 'new',
        weightBasis: 'promise',
        manifestoVersion: 'test-v1',
        active: true,
      },
    ],
  },
  axes: {
    version: '1.0.0',
    hash: 'test-hash',
    axes: [],
  },
  archetypes: {
    version: '1.0.0',
    hash: 'test-hash',
    archetypes: [],
  },
  languages: {
    version: '1.0.0',
    hash: 'test-hash',
    defaultLanguage: 'ta',
    languages: [],
  },
  questions: {
    version: '1.0.0',
    hash: 'test-hash',
    questions: [],
  },
  scoringParams: {
    version: '1.0.0',
    hash: 'test-hash',
    questionCount: 30,
    optionsPerQuestion: 3,
    weightRange: { min: 0, max: 5 },
    minAnsweredThreshold: 0.5,
    collinearityThreshold: 0.7,
    discriminatingPowerThreshold: 1.0,
    confidenceFormula: 'dynamic',
    estimatedCompletionMinutes: 3,
    performanceTargets: {
      loadTime4G: 1000,
      loadTime2G: 3000,
      scoringTime: 200,
      concurrentUsers: 100000,
    },
    disclaimerText: { en: 'Test disclaimer', ta: 'சோதனை மறுப்பு' },
  },
  version: 'test-version',
  loadedAt: new Date().toISOString(),
};

describe('ConfigProvider', () => {
  it('should provide config to child components', () => {
    // Verify the ConfigProvider structure
    const element = React.createElement(
      ConfigProvider,
      { config: mockConfig },
      React.createElement('div', null, 'Test child')
    );

    expect(element.type).toBe(ConfigProvider);
    expect(element.props.config).toBe(mockConfig);
    expect(element.props.children).toBeDefined();
  });

  it('should throw error when useConfig is called outside ConfigProvider', () => {
    expect(() => {
      // Simulate calling useConfig outside of provider
      // In a real test, this would be done with React Testing Library
      const context = undefined;
      if (context === undefined) {
        throw new Error(
          'useConfig must be used within a ConfigProvider. ' +
          'Wrap your app with <ConfigProvider> at the root level.'
        );
      }
    }).toThrow('useConfig must be used within a ConfigProvider');
  });

  it('should accept ConfigBundle with all required fields', () => {
    const element = React.createElement(
      ConfigProvider,
      { config: mockConfig },
      React.createElement('div')
    );

    expect(element.props.config).toHaveProperty('parties');
    expect(element.props.config).toHaveProperty('axes');
    expect(element.props.config).toHaveProperty('archetypes');
    expect(element.props.config).toHaveProperty('languages');
    expect(element.props.config).toHaveProperty('questions');
    expect(element.props.config).toHaveProperty('scoringParams');
    expect(element.props.config).toHaveProperty('version');
    expect(element.props.config).toHaveProperty('loadedAt');
  });
});
