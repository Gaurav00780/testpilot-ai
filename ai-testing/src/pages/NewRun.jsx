import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateRun } from '../hooks/useCreateRun';
import { getBrowserConfig } from '../utils/browserIcons';
import useAppStore from '../store/useAppStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Loader2, ChevronRight } from 'lucide-react';

const BROWSERS = ['chromium', 'firefox', 'webkit', 'mobile-chrome'];
const VIEWPORTS = [
  { label: 'Desktop 1440px', value: { width: 1440, height: 900 } },
  { label: 'Laptop 1280px', value: { width: 1280, height: 800 } },
  { label: 'Tablet 768px', value: { width: 768, height: 1024 } },
  { label: 'Mobile 390px', value: { width: 390, height: 844 } },
];
const WAIT_STRATEGIES = [
  { label: 'Network Idle', value: 'networkidle' },
  { label: 'DOM Content Loaded', value: 'domcontentloaded' },
  { label: 'Delay 2s', value: 'delay:2000' },
];

export default function NewRun() {
  const navigate = useNavigate();
  const { setActiveRunId } = useAppStore();
  const { mutateAsync: createRun, isPending } = useCreateRun();

  const [url, setUrl] = useState('');
  const [browsers, setBrowsers] = useState(['chromium', 'firefox', 'webkit', 'mobile-chrome']);
  const [viewport, setViewport] = useState(VIEWPORTS[0].value);
  const [waitStrategy, setWait] = useState('networkidle');
  const [threshold, setThreshold] = useState(0.1);
  const [aiAnalysis, setAiAnalysis] = useState(true);
  const [advanced, setAdvanced] = useState(false);
  const [ignoreRects, setIgnoreRects] = useState('[]');
  const [cookies, setCookies] = useState('[]');
  const [errors, setErrors] = useState({});

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
        cookies: JSON.parse(cookies),
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
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-1">New Test Run</h1>
        <p className="text-sm text-muted-foreground">Configure and launch a cross-browser visual test</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="url-input">URL to Test *</Label>
            <Input
              id="url-input"
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setErrors((p) => ({ ...p, url: '' })); }}
              placeholder="https://example.com"
              className={errors.url ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {errors.url && <p className="text-xs text-destructive">{errors.url}</p>}
          </div>

          {/* Browser Selection */}
          <div className="space-y-2">
            <Label>Browsers</Label>
            <div className="flex flex-wrap gap-2">
              {BROWSERS.map((b) => {
                const cfg = getBrowserConfig(b);
                const { Icon } = cfg;
                const active = browsers.includes(b);
                return (
                  <Button
                    key={b}
                    id={`browser-${b}`}
                    type="button"
                    variant={active ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleBrowser(b)}
                    className="gap-2"
                  >
                    <Icon size={14} />
                    {cfg.label}
                  </Button>
                );
              })}
            </div>
            {errors.browsers && <p className="text-xs text-destructive">{errors.browsers}</p>}
          </div>

          {/* Viewport */}
          <div className="space-y-2">
            <Label htmlFor="viewport-select">Viewport</Label>
            <Select
              onValueChange={(v) => setViewport(JSON.parse(v))}
              defaultValue={JSON.stringify(VIEWPORTS[0].value)}
            >
              <SelectTrigger id="viewport-select">
                <SelectValue placeholder="Select viewport" />
              </SelectTrigger>
              <SelectContent>
                {VIEWPORTS.map((v) => (
                  <SelectItem key={v.label} value={JSON.stringify(v.value)}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Wait Strategy */}
          <div className="space-y-2">
            <Label htmlFor="wait-select">Wait Strategy</Label>
            <Select value={waitStrategy} onValueChange={setWait}>
              <SelectTrigger id="wait-select">
                <SelectValue placeholder="Select wait strategy" />
              </SelectTrigger>
              <SelectContent>
                {WAIT_STRATEGIES.map((w) => (
                  <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mismatch Threshold */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="threshold-slider">Mismatch Threshold</Label>
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
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-0.5">
              <span>0%</span><span>5%</span>
            </div>
          </div>

          {/* AI Analysis Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">AI Analysis</p>
              <p className="text-xs text-muted-foreground">Detect root causes and suggest fixes automatically</p>
            </div>
            <Switch id="ai-toggle" checked={aiAnalysis} onCheckedChange={setAiAnalysis} />
          </div>

          {/* Advanced Section */}
          <Separator />
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAdvanced(!advanced)}
              className="gap-1 text-xs font-semibold uppercase tracking-wide"
            >
              <ChevronRight className={`w-3 h-3 transition-transform ${advanced ? 'rotate-90' : ''}`} />
              Advanced Options
            </Button>

            {advanced && (
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ignore-rects">Ignore Regions (JSON array)</Label>
                  <textarea
                    id="ignore-rects"
                    value={ignoreRects}
                    onChange={(e) => { setIgnoreRects(e.target.value); setErrors((p) => ({ ...p, ignoreRects: '' })); }}
                    rows={3}
                    className={`w-full px-3 py-2 border shadow-sm dark:shadow-2xl rounded text-xs font-mono bg-transparent outline-none focus:border-accent transition-colors resize-none ${errors.ignoreRects ? 'border-destructive' : 'border-input'
                      }`}
                    placeholder='[{"x":0,"y":0,"width":100,"height":50}]'
                  />
                  {errors.ignoreRects && <p className="text-xs text-destructive">{errors.ignoreRects}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auth-cookies">Auth Cookies (JSON array)</Label>
                  <textarea
                    id="auth-cookies"
                    value={cookies}
                    onChange={(e) => { setCookies(e.target.value); setErrors((p) => ({ ...p, cookies: '' })); }}
                    rows={3}
                    className={`w-full px-3 py-2 border shadow-sm dark:shadow-2xl rounded text-xs font-mono bg-transparent outline-none focus:border-accent transition-colors resize-none ${errors.cookies ? 'border-destructive' : 'border-input'
                      }`}
                    placeholder='[{"name":"session","value":"abc123","domain":"example.com"}]'
                  />
                  {errors.cookies && <p className="text-xs text-destructive">{errors.cookies}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          {errors.submit && (
            <div className="text-xs text-destructive bg-destructive/10 rounded px-3 py-2">{errors.submit}</div>
          )}

          <Button
            id="submit-run-button"
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full dark:shadow-2xl shadow-md"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isPending ? 'Starting…' : 'Run Tests →'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
