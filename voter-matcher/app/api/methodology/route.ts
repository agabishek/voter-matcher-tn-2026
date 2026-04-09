/**
 * GET /api/methodology
 *
 * Returns public methodology data:
 *   - axes: id, labels, technicalName (from Axis_Registry)
 *   - archetypes: id, names, descriptions (from Archetype_Registry)
 *   - parties: id, names, weightBasis, manifestoVersion (from Party_Registry)
 *   - auditLog: static summary of the audit trail
 */

import { NextResponse } from 'next/server';
import { ConfigLoader } from '@/lib/configLoader';

interface AxisMethodology {
  id: string;
  labels: { en: string; ta: string };
  technicalName: { en: string; ta: string };
}

interface ArchetypeMethodology {
  id: string;
  names: { en: string; ta: string };
  descriptions: { en: string; ta: string };
}

interface PartyMethodology {
  id: string;
  names: { en: string; ta: string };
  weightBasis: string;
  manifestoVersion: string;
}

interface AuditLogSummary {
  description: { en: string; ta: string };
  auditTrailLocation: string;
  lastVerified: string;
}

interface MethodologyResponse {
  axes: AxisMethodology[];
  archetypes: ArchetypeMethodology[];
  parties: PartyMethodology[];
  auditLog: AuditLogSummary;
}

const AUDIT_LOG_SUMMARY: AuditLogSummary = {
  description: {
    en: 'All configuration changes are tracked via Git commit history. Each change includes a timestamp, the previous and new config versions, and the specific weights that changed. The full audit trail is available in the project repository.',
    ta: 'அனைத்து கட்டமைப்பு மாற்றங்களும் Git commit வரலாற்றின் மூலம் கண்காணிக்கப்படுகின்றன. ஒவ்வொரு மாற்றமும் நேர முத்திரை, முந்தைய மற்றும் புதிய கட்டமைப்பு பதிப்புகள் மற்றும் மாற்றப்பட்ட குறிப்பிட்ட எடைகளை உள்ளடக்கியது.',
  },
  auditTrailLocation: 'https://github.com/voter-matcher-tn-2026/config',
  lastVerified: new Date().toISOString().split('T')[0] ?? new Date().toISOString(),
};

export async function GET(): Promise<NextResponse<MethodologyResponse | { error: string }>> {
  try {
    const loader = new ConfigLoader();
    const config = loader.load();

    const axes: AxisMethodology[] = config.axes.axes.map((axis) => ({
      id: axis.id,
      labels: axis.labels,
      technicalName: axis.technicalName,
    }));

    const archetypes: ArchetypeMethodology[] = config.archetypes.archetypes.map((archetype) => ({
      id: archetype.id,
      names: archetype.names,
      descriptions: archetype.descriptions,
    }));

    const parties: PartyMethodology[] = config.parties.parties
      .filter((party) => party.active)
      .map((party) => ({
        id: party.id,
        names: party.names,
        weightBasis: party.weightBasis,
        manifestoVersion: party.manifestoVersion,
      }));

    const response: MethodologyResponse = {
      axes,
      archetypes,
      parties,
      auditLog: AUDIT_LOG_SUMMARY,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load methodology data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
