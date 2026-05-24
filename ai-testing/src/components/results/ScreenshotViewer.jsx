import { useState } from 'react';

const STORAGE_BASE = 'http://localhost:3001';

export function ScreenshotViewer({ screenshotUrl, diffUrl }) {
  const [showDiff, setShowDiff] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [viewMode, setViewMode] = useState('single'); // 'single' | 'side-by-side'

  const resolveUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${STORAGE_BASE}${url}`;
  };

  const screenshotSrc = resolveUrl(screenshotUrl);
  const diffSrc = resolveUrl(diffUrl);

  if (!screenshotSrc) {
    return (
      <div className="flex-1 flex items-center justify-center bg-tag-bg text-muted text-sm">
        No screenshot available
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-paper shrink-0">
        <button
          onClick={() => setViewMode('single')}
          className={`text-xs px-2 py-1 rounded border transition-colors ${
            viewMode === 'single' ? 'border-accent text-accent bg-accent/5' : 'border-border text-muted hover:text-ink'
          }`}
        >
          Single
        </button>
        {diffSrc && (
          <>
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`text-xs px-2 py-1 rounded border transition-colors ${
                viewMode === 'side-by-side' ? 'border-accent text-accent bg-accent/5' : 'border-border text-muted hover:text-ink'
              }`}
            >
              Side by Side
            </button>
            <div className="w-px h-4 bg-border" />
            <button
              onClick={() => setShowDiff(!showDiff)}
              className={`text-xs px-2 py-1 rounded border transition-colors ${
                showDiff ? 'border-red text-red bg-red/5' : 'border-border text-muted hover:text-ink'
              }`}
            >
              {showDiff ? 'Hide Diff' : 'Show Diff'}
            </button>
          </>
        )}
      </div>

      {/* Image area */}
      <div className="flex-1 overflow-auto bg-[#1a1916] p-4">
        {viewMode === 'single' ? (
          <div className="relative inline-block">
            {!imageLoaded && (
              <div className="skeleton w-full" style={{ height: 600, minWidth: 400 }} />
            )}
            <img
              src={screenshotSrc}
              alt="Browser screenshot"
              className={`max-w-full rounded shadow-lg ${imageLoaded ? '' : 'hidden'}`}
              onLoad={() => setImageLoaded(true)}
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
