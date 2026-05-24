import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateRun } from '../../hooks/useCreateRun';
import { Spinner } from '../ui/Spinner';
import { getBrowserConfig } from '../../utils/browserIcons';
import useAppStore from '../../store/useAppStore';
import { Play, ChevronDown } from 'lucide-react';

const BROWSERS = ['chromium', 'firefox', 'webkit', 'mobile-chrome'];

export function QuickRunForm() {
  const navigate = useNavigate();
  const { setActiveRunId } = useAppStore();
  const { mutateAsync: createRun, isPending } = useCreateRun();

  const [url, setUrl]       = useState('');
  const [browsers, setBrowsers] = useState(['chromium', 'firefox']);
  const [error, setError]   = useState('');

  const toggleBrowser = (b) => {
    setBrowsers((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  };

  const handleSubmit = async () => {
    if (!url.trim()) { setError('URL is required'); return; }
    try { new URL(url); } catch { setError('Please enter a valid URL'); return; }
    if (!browsers.length) { setError('Select at least one browser'); return; }
    setError('');
    try {
      const run = await createRun({
        url,
        browsers,
        viewport: { width: 1440, height: 900 },
        waitStrategy: 'networkidle',
        threshold: 0.1,
        aiAnalysis: true,
        ignoreRects: [],
        cookies: [],
      });
      setActiveRunId(run.id);
      navigate(`/runs/${run.id}`);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to start run');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(''); }}
          placeholder="https://example.com"
          className="flex-1 text-sm px-4 py-2.5 border border-border rounded-lg bg-white text-ink placeholder-gray-400 outline-none focus:border-accent transition-colors shadow-sm"
        />
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="bg-accent text-white text-sm px-6 py-2.5 rounded-lg font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0 shadow-sm"
        >
          {isPending ? <Spinner size="sm" /> : <Play className="w-4 h-4 fill-current" />}
          Run Now
        </button>
      </div>

      {/* Browser toggles */}
      <div className="flex flex-wrap gap-2">
        {BROWSERS.map((b) => {
          const cfg = getBrowserConfig(b);
          const { Icon } = cfg;
          const active = browsers.includes(b);
          return (
            <button
              key={b}
              onClick={() => toggleBrowser(b)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors`}
              style={active ? { borderColor: cfg.color, color: cfg.color, backgroundColor: cfg.bgColor } : { borderColor: '#E5E7EB', color: '#6B7280', backgroundColor: '#FFFFFF' }}
            >
              <Icon size={14} />
              {cfg.label}
            </button>
          );
        })}
      </div>

      <button className="flex items-center gap-1 text-xs font-semibold text-ink mt-2">
        Advanced Options <ChevronDown className="w-3 h-3" />
      </button>

      {error && <p className="text-xs text-red font-medium">{error}</p>}
    </div>
  );
}
