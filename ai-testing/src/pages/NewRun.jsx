import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateRun } from '../hooks/useCreateRun';
import { Spinner } from '../components/ui/Spinner';
import { getBrowserConfig } from '../utils/browserIcons';
import useAppStore from '../store/useAppStore';

const BROWSERS = ['chromium', 'firefox', 'webkit', 'mobile-chrome'];
const VIEWPORTS = [
  { label: 'Desktop 1440px',  value: { width: 1440, height: 900 } },
  { label: 'Laptop 1280px',   value: { width: 1280, height: 800 } },
  { label: 'Tablet 768px',    value: { width: 768,  height: 1024 } },
  { label: 'Mobile 390px',    value: { width: 390,  height: 844 } },
];
const WAIT_STRATEGIES = [
  { label: 'Network Idle',         value: 'networkidle' },
  { label: 'DOM Content Loaded',   value: 'domcontentloaded' },
  { label: 'Delay 2s',             value: 'delay:2000' },
];

export default function NewRun() {
  const navigate = useNavigate();
  const { setActiveRunId } = useAppStore();
  const { mutateAsync: createRun, isPending } = useCreateRun();

  const [url, setUrl]               = useState('');
  const [browsers, setBrowsers]     = useState(['chromium', 'firefox', 'webkit', 'mobile-chrome']);
  const [viewport, setViewport]     = useState(VIEWPORTS[0].value);
  const [waitStrategy, setWait]     = useState('networkidle');
  const [threshold, setThreshold]   = useState(0.1);
  const [aiAnalysis, setAiAnalysis] = useState(true);
  const [advanced, setAdvanced]     = useState(false);
  const [ignoreRects, setIgnoreRects] = useState('[]');
  const [cookies, setCookies]         = useState('[]');
  const [errors, setErrors]           = useState({});

  const toggleBrowser = (b) => {
    setBrowsers((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  };

  const validate = () => {
    const errs = {};
    if (!url.trim()) { errs.url = 'URL is required'; }
    else { try { new URL(url); } catch { errs.url = 'Must be a valid URL'; } }
    if (!browsers.length) errs.browsers = 'Select at least one browser';
    try { JSON.parse(ignoreRects); } catch { errs.ignoreRects = 'Must be valid JSON array'; }
    try { JSON.parse(cookies); } catch { errs.cookies = 'Must be valid JSON array'; }
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    try {
      const run = await createRun({
        url,
        browsers,
        viewport,
        waitStrategy,
        threshold,
        aiAnalysis,
        ignoreRects: JSON.parse(ignoreRects),
        cookies:     JSON.parse(cookies),
      });
      setActiveRunId(run.id);
      navigate(`/runs/${run.id}`);
    } catch (e) {
      setErrors({ submit: e.response?.data?.error || 'Failed to start run' });
    }
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-ink mb-1">New Test Run</h1>
        <p className="text-sm text-muted">Configure and launch a cross-browser visual test</p>
      </div>

      <div className="tp-card p-6 space-y-6">
        {/* URL */}
        <div>
          <label className="block text-xs font-semibold text-muted mb-2 uppercase tracking-wide" htmlFor="url-input">
            URL to Test *
          </label>
          <input
            id="url-input"
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setErrors((p) => ({ ...p, url: '' })); }}
            placeholder="https://example.com"
            className={`w-full px-3 py-2.5 border rounded text-sm text-ink placeholder-muted bg-paper outline-none focus:border-accent transition-colors ${
              errors.url ? 'border-red' : 'border-border'
            }`}
          />
          {errors.url && <p className="text-xs text-red mt-1">{errors.url}</p>}
        </div>

        {/* Browser Selection */}
        <div>
          <label className="block text-xs font-semibold text-muted mb-2 uppercase tracking-wide">
            Browsers
          </label>
          <div className="flex flex-wrap gap-2">
            {BROWSERS.map((b) => {
              const cfg = getBrowserConfig(b);
              const { Icon } = cfg;
              const active = browsers.includes(b);
              return (
                <button
                  key={b}
                  id={`browser-${b}`}
                  onClick={() => toggleBrowser(b)}
                  className={`flex items-center gap-2 px-3 py-2 rounded border text-sm font-medium transition-colors ${
                    active
                      ? 'border-accent text-accent bg-[#fff0ec]'
                      : 'border-border text-muted hover:border-ink hover:text-ink'
                  }`}
                >
                  <Icon size={14} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
          {errors.browsers && <p className="text-xs text-red mt-1">{errors.browsers}</p>}
        </div>

        {/* Viewport */}
        <div>
          <label className="block text-xs font-semibold text-muted mb-2 uppercase tracking-wide" htmlFor="viewport-select">
            Viewport
          </label>
          <select
            id="viewport-select"
            onChange={(e) => setViewport(JSON.parse(e.target.value))}
            className="w-full px-3 py-2.5 border border-border rounded text-sm text-ink bg-paper outline-none focus:border-accent transition-colors"
          >
            {VIEWPORTS.map((v) => (
              <option key={v.label} value={JSON.stringify(v.value)}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* Wait Strategy */}
        <div>
          <label className="block text-xs font-semibold text-muted mb-2 uppercase tracking-wide" htmlFor="wait-select">
            Wait Strategy
          </label>
          <select
            id="wait-select"
            value={waitStrategy}
            onChange={(e) => setWait(e.target.value)}
            className="w-full px-3 py-2.5 border border-border rounded text-sm text-ink bg-paper outline-none focus:border-accent transition-colors"
          >
            {WAIT_STRATEGIES.map((w) => (
              <option key={w.value} value={w.value}>{w.label}</option>
            ))}
          </select>
        </div>

        {/* Mismatch Threshold */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-muted uppercase tracking-wide" htmlFor="threshold-slider">
              Mismatch Threshold
            </label>
            <span className="text-xs font-mono text-accent font-bold">{threshold.toFixed(1)}%</span>
          </div>
          <input
            id="threshold-slider"
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-[10px] text-muted font-mono mt-0.5">
            <span>0%</span><span>5%</span>
          </div>
        </div>

        {/* AI Analysis Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">AI Analysis</p>
            <p className="text-xs text-muted">Detect root causes and suggest fixes automatically</p>
          </div>
          <button
            id="ai-toggle"
            onClick={() => setAiAnalysis(!aiAnalysis)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              aiAnalysis ? 'bg-accent' : 'bg-border'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow ${
                aiAnalysis ? 'left-7' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Advanced Section */}
        <div className="border-t border-border pt-4">
          <button
            onClick={() => setAdvanced(!advanced)}
            className="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wide hover:text-ink transition-colors"
          >
            <span className={`transition-transform ${advanced ? 'rotate-90' : ''}`}>›</span>
            Advanced Options
          </button>

          {advanced && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide" htmlFor="ignore-rects">
                  Ignore Regions (JSON array)
                </label>
                <textarea
                  id="ignore-rects"
                  value={ignoreRects}
                  onChange={(e) => { setIgnoreRects(e.target.value); setErrors((p) => ({ ...p, ignoreRects: '' })); }}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded text-xs font-mono text-ink bg-paper outline-none focus:border-accent transition-colors resize-none ${
                    errors.ignoreRects ? 'border-red' : 'border-border'
                  }`}
                  placeholder='[{"x":0,"y":0,"width":100,"height":50}]'
                />
                {errors.ignoreRects && <p className="text-xs text-red mt-1">{errors.ignoreRects}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide" htmlFor="auth-cookies">
                  Auth Cookies (JSON array)
                </label>
                <textarea
                  id="auth-cookies"
                  value={cookies}
                  onChange={(e) => { setCookies(e.target.value); setErrors((p) => ({ ...p, cookies: '' })); }}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded text-xs font-mono text-ink bg-paper outline-none focus:border-accent transition-colors resize-none ${
                    errors.cookies ? 'border-red' : 'border-border'
                  }`}
                  placeholder='[{"name":"session","value":"abc123","domain":"example.com"}]'
                />
                {errors.cookies && <p className="text-xs text-red mt-1">{errors.cookies}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        {errors.submit && (
          <div className="text-xs text-red bg-[#ffe8e5] rounded px-3 py-2">{errors.submit}</div>
        )}

        <button
          id="submit-run-button"
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full bg-accent text-white py-3 rounded font-semibold text-sm hover:bg-opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isPending ? <Spinner size="sm" /> : null}
          {isPending ? 'Starting…' : 'Run Tests →'}
        </button>
      </div>
    </div>
  );
}
