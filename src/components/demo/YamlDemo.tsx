import { useState, useEffect } from 'react';
import { yamlConfigLoader } from '../../services';
import type { Domain } from '../../types';

export default function YamlDemo() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDomains = async () => {
      try {
        setLoading(true);
        setError(null);
        const loadedDomains = await yamlConfigLoader.loadAllDomains();
        setDomains(loadedDomains);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load domains');
        console.error('Error loading domains:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDomains();
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-pulse">Loading YAML configurations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-semibold">Configuration Error</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">YAML Configuration Demo</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {domains.map((domain) => (
          <div
            key={domain.id}
            className={`p-4 rounded-lg border-2 bg-${domain.theme.secondary}`}
          >
            <h3 className={`text-lg font-semibold text-${domain.theme.text} mb-2`}>
              {domain.name}
            </h3>
            <p className={`text-sm text-${domain.theme.text} opacity-80 mb-3`}>
              {domain.description}
            </p>
            <div className="space-y-2">
              <h4 className={`font-medium text-${domain.theme.text}`}>
                Advisors ({domain.advisors.length}):
              </h4>
              {domain.advisors.map((advisor) => (
                <div
                  key={advisor.id}
                  className={`p-2 bg-white bg-opacity-50 rounded text-${domain.theme.text}`}
                >
                  <div className="font-medium">{advisor.name}</div>
                  <div className="text-xs opacity-75">{advisor.expertise}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
