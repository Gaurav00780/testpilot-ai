import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateRun } from '../../hooks/useCreateRun';
import { getBrowserConfig } from '../../utils/browserIcons';
import useAppStore from '../../store/useAppStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Play, Loader2 } from 'lucide-react';

const BROWSERS = ['chromium', 'webkit', 'mobile-chrome'];

export function QuickRunForm() {
  const navigate = useNavigate();
  const { setActiveRunId } = useAppStore();
  const { mutateAsync: createRun, isPending } = useCreateRun();

  const [url, setUrl]       = useState('');
  const [browsers, setBrowsers] = useState(['chromium', 'webkit']);
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
        <Input
          type="url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(''); }}
          placeholder="https://example.com"
          className="flex-1"
        />
        <Button
          onClick={handleSubmit}
          disabled={isPending}
          className="gap-2 shrink-0"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
          Run Now
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {BROWSERS.map((b) => {
          const cfg = getBrowserConfig(b);
          const { Icon } = cfg;
          const active = browsers.includes(b);
          return (
            <Button
              key={b}
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

      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
    </div>
  );
}
