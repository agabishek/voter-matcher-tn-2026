import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/config/route';

describe('GET /api/config', () => {
  it('should return a valid JSON response with status 200', async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toBeDefined();
    expect(body.error).toBeUndefined();
  });

  it('should include all required top-level registry fields', async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.parties).toBeDefined();
    expect(body.axes).toBeDefined();
    expect(body.archetypes).toBeDefined();
    expect(body.languages).toBeDefined();
    expect(body.scoringParams).toBeDefined();
    expect(body.questions).toBeDefined();
    expect(body.version).toBeDefined();
  });

  it('should strip partyWeights from all question options', async () => {
    const response = await GET();
    const body = await response.json();

    for (const question of body.questions.questions) {
      for (const option of question.options) {
        expect(option).not.toHaveProperty('partyWeights');
      }
    }
  });

  it('should strip axisWeights from all question options', async () => {
    const response = await GET();
    const body = await response.json();

    for (const question of body.questions.questions) {
      for (const option of question.options) {
        expect(option).not.toHaveProperty('axisWeights');
      }
    }
  });

  it('should preserve question id, cluster, and bilingual text', async () => {
    const response = await GET();
    const body = await response.json();

    for (const question of body.questions.questions) {
      expect(typeof question.id).toBe('string');
      expect(typeof question.cluster).toBe('string');
      expect(typeof question.text.en).toBe('string');
      expect(typeof question.text.ta).toBe('string');
    }
  });

  it('should preserve option id and bilingual text', async () => {
    const response = await GET();
    const body = await response.json();

    for (const question of body.questions.questions) {
      expect(question.options.length).toBeGreaterThan(0);
      for (const option of question.options) {
        expect(typeof option.id).toBe('string');
        expect(typeof option.text.en).toBe('string');
        expect(typeof option.text.ta).toBe('string');
      }
    }
  });

  it('should include questions version string', async () => {
    const response = await GET();
    const body = await response.json();

    expect(typeof body.questions.version).toBe('string');
    expect(body.questions.version).toBe('1.0.0');
  });

  it('should include party registry with bilingual names', async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.parties.parties.length).toBeGreaterThan(0);
    for (const party of body.parties.parties) {
      expect(typeof party.id).toBe('string');
      expect(typeof party.names.en).toBe('string');
      expect(typeof party.names.ta).toBe('string');
    }
  });

  it('should include axis registry with bilingual labels', async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.axes.axes.length).toBeGreaterThan(0);
    for (const axis of body.axes.axes) {
      expect(typeof axis.id).toBe('string');
      expect(typeof axis.labels.en).toBe('string');
      expect(typeof axis.labels.ta).toBe('string');
    }
  });

  it('should include archetype registry with bilingual descriptions', async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.archetypes.archetypes.length).toBeGreaterThan(0);
    for (const archetype of body.archetypes.archetypes) {
      expect(typeof archetype.id).toBe('string');
      expect(typeof archetype.names.en).toBe('string');
      expect(typeof archetype.names.ta).toBe('string');
      expect(typeof archetype.descriptions.en).toBe('string');
      expect(typeof archetype.descriptions.ta).toBe('string');
    }
  });

  it('should include scoring params with disclaimer in both languages', async () => {
    const response = await GET();
    const body = await response.json();

    expect(typeof body.scoringParams.questionCount).toBe('number');
    expect(typeof body.scoringParams.disclaimerText.en).toBe('string');
    expect(typeof body.scoringParams.disclaimerText.ta).toBe('string');
  });

  it('should include language registry with default language', async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.languages.defaultLanguage).toBe('ta');
    expect(body.languages.languages.length).toBeGreaterThanOrEqual(2);
  });

  it('should set cache-control headers for CDN caching', async () => {
    const response = await GET();
    const cacheControl = response.headers.get('Cache-Control');

    expect(cacheControl).toBeDefined();
    expect(cacheControl).toContain('public');
    expect(cacheControl).toContain('s-maxage');
  });

  it('should not include loadedAt in the public response', async () => {
    const response = await GET();
    const body = await response.json();

    expect(body).not.toHaveProperty('loadedAt');
  });

  it('should return exactly the expected keys at top level', async () => {
    const response = await GET();
    const body = await response.json();

    const keys = Object.keys(body).sort();
    expect(keys).toEqual([
      'archetypes',
      'axes',
      'languages',
      'parties',
      'questions',
      'scoringParams',
      'version',
    ]);
  });

  it('should return question options with only id and text keys', async () => {
    const response = await GET();
    const body = await response.json();

    const firstOption = body.questions.questions[0].options[0];
    const optionKeys = Object.keys(firstOption).sort();
    expect(optionKeys).toEqual(['id', 'text']);
  });
});
