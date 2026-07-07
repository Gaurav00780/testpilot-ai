import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

const STORAGE_BASE = import.meta.env.VITE_STORAGE_URL || 'http://localhost:3001';

export function ScreenshotViewer({ screenshotUrl, diffUrl }) {
  const [showDiff, setShowDiff] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [viewMode, setViewMode] = useState('single');

  useEffect(() => {
    setImageLoaded(false);
  }, [screenshotUrl, diffUrl]);

  const resolveUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${STORAGE_BASE}${url}`;
  };

  const screenshotSrc = resolveUrl(screenshotUrl);
  const diffSrc = resolveUrl(diffUrl);

  if (!screenshotSrc) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30 text-muted-foreground text-sm">
        No screenshot available
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30 shrink-0">
        <Button
          variant={viewMode === 'single' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('single')}
        >
          Single
        </Button>
        {diffSrc && (
          <>
            <Button
              variant={viewMode === 'side-by-side' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('side-by-side')}
            >
              Side by Side
            </Button>
            <div className="w-px h-4 bg-border" />
            <Button
              variant={showDiff ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setShowDiff(!showDiff)}
            >
              {showDiff ? 'Hide Diff' : 'Show Diff'}
            </Button>
          </>
        )}
      </div>

      <div className="flex-1 overflow-auto bg-[#1a1916] p-4">
        {viewMode === 'single' ? (
          <div className="relative inline-block">
            {!imageLoaded && (
              <div className="skeleton" style={{ height: 600, minWidth: 400 }} />
            )}
            <img
              src={screenshotSrc}
              alt="Browser screenshot"
              className={cn('max-w-full rounded shadow-lg', imageLoaded ? '' : 'hidden')}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)}
            />
            {showDiff && diffSrc && imageLoaded && (
              <img
                src={diffSrc}
                alt="Visual diff overlay"
                className="absolute inset-0 max-w-full rounded"
                style={{ mixBlendMode: 'multiply', opacity: 0.8 }}
              />
            )}
          </div>
        ) : (
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-xs text-white/40 font-mono mb-2">REFERENCE</p>
              <img src={screenshotSrc} alt="Reference screenshot" className="w-full rounded shadow" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-white/40 font-mono mb-2">CURRENT</p>
              <div className="relative">
                <img src={screenshotSrc} alt="Current screenshot" className="w-full rounded shadow" />
                {diffSrc && (
                  <img
                    src={diffSrc}
                    alt="Diff"
                    className="absolute inset-0 w-full rounded"
                    style={{ mixBlendMode: 'multiply', opacity: 0.8 }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
