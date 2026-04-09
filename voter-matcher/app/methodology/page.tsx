/**
 * /methodology — Public methodology page
 *
 * Server component that renders axis definitions, weight basis documentation,
 * audit log summary, and disclaimer. Reads all data from config files.
 * Bilingual: renders both English and Tamil sections.
 */

import { ConfigLoader } from '@/lib/configLoader';

interface BilingualText {
  en: string;
  ta: string;
}

function Section({ title, children }: { title: BilingualText; children: React.ReactNode }): React.ReactElement {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-1">{title.en}</h2>
      <p className="text-sm text-gray-500 mb-3" lang="ta">{title.ta}</p>
      {children}
    </section>
  );
}

export default function MethodologyPage(): React.ReactElement {
  const loader = new ConfigLoader();
  const config = loader.load();

  const axes = config.axes.axes;
  const parties = config.parties.parties.filter((p) => p.active);
  const disclaimer = config.scoringParams.disclaimerText;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Methodology</h1>
      <p className="text-sm text-gray-500 mb-6" lang="ta">முறையியல்</p>

      {/* Axis Definitions */}
      <Section title={{ en: 'Ideological Axes', ta: 'கருத்தியல் அச்சுகள்' }}>
        <div className="space-y-3">
          {axes.map((axis) => (
            <div key={axis.id} className="border rounded p-3">
              <h3 className="font-medium">{axis.labels.en}</h3>
              <p className="text-sm text-gray-500" lang="ta">{axis.labels.ta}</p>
              <p className="text-xs text-gray-400 mt-1">
                Technical: {axis.technicalName.en} / <span lang="ta">{axis.technicalName.ta}</span>
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Weight Basis Documentation */}
      <Section title={{ en: 'Weight Basis', ta: 'எடை அடிப்படை' }}>
        <p className="text-sm text-gray-600 mb-3">
          Party alignment weights are derived from two sources depending on the party&apos;s governance history.
        </p>
        <p className="text-sm text-gray-500 mb-3" lang="ta">
          கட்சி ஒத்திசைவு எடைகள் கட்சியின் ஆட்சி வரலாற்றைப் பொறுத்து இரண்டு ஆதாரங்களிலிருந்து பெறப்படுகின்றன.
        </p>
        <ul className="space-y-2">
          {parties.map((party) => (
            <li key={party.id} className="border rounded p-3 text-sm">
              <span className="font-medium">{party.names.en}</span>
              {' — '}
              <span className="text-gray-600">
                {party.weightBasis === 'track-record'
                  ? 'Based on governance track record and manifesto'
                  : 'Based on manifesto promises only (no prior governance record)'}
              </span>
              <br />
              <span className="text-xs text-gray-400">
                Manifesto: {party.manifestoVersion}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Audit Log */}
      <Section title={{ en: 'Audit Trail', ta: 'தணிக்கை பாதை' }}>
        <p className="text-sm text-gray-600">
          All configuration changes are tracked via Git commit history. Each change includes
          a timestamp, the previous and new config versions, and the specific weights that changed.
        </p>
        <p className="text-sm text-gray-500 mt-2" lang="ta">
          அனைத்து கட்டமைப்பு மாற்றங்களும் Git commit வரலாற்றின் மூலம் கண்காணிக்கப்படுகின்றன.
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Config versions — parties: {config.parties.version}, axes: {config.axes.version},
          questions: {config.questions.version}, scoring: {config.scoringParams.version}
        </p>
      </Section>

      {/* Disclaimer */}
      <Section title={{ en: 'Disclaimer', ta: 'மறுப்பு' }}>
        <div className="border rounded p-4 bg-gray-50">
          <p className="text-sm text-gray-700">{disclaimer.en}</p>
          <p className="text-sm text-gray-500 mt-2" lang="ta">{disclaimer.ta}</p>
        </div>
      </Section>
    </main>
  );
}
