import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import {
  Brain, AlertTriangle, TrendingUp, Lightbulb,
  ChevronRight, ArrowUpRight, Clock, Loader2,
  LayoutTemplate, Globe, Palette, Code, Smartphone,
  Zap, RefreshCw, BarChart3, Target
} from 'lucide-react';

const BROWSER_ICONS = {
  chromium: Globe,
  firefox: Globe,
  webkit: Smartphone,
  'mobile-chrome': Smartphone,
};

// ─── Sub-components ──────────────────────────────────────

function MetricCard({ label, value, change, icon: Icon, color, bg }) {
  const isPositive = change.startsWith('+') || change.endsWith('%') || change === 'Total' || change === 'Severity' || change === 'Confidence' || change === 'Applied';
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <Badge variant={isPositive ? 'success' : 'critical'} className="text-[10px] px-1.5 py-0">
            {change}
          </Badge>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryBar({ name, count, pct, color }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground font-medium">{name}</span>
        <span className="text-muted-foreground font-mono text-xs">{count} ({pct}%)</span>
      </div>
      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function TrendChart({ data }) {
  if (!data || data.length === 0) return <div className="text-xs text-muted-foreground text-center py-8">No trend data available</div>;
  const max = Math.max(...data.map(d => d.issues)) || 1;
  const w = 280;
  const h = 120;
  const pad = { t: 4, b: 20, l: 4, r: 4 };
  const chartW = w - pad.l - pad.r;
  const chartH = h - pad.t - pad.b;

  const points = data.map((d, i) => ({
    x: pad.l + (i / (data.length - 1)) * chartW,
    y: pad.t + (1 - d.issues / max) * chartH,
    ...d,
  }));

  const linePath = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`
  ).join(' ');

  const areaPath = linePath +
    ` L${points[points.length - 1].x.toFixed(1)},${(h - pad.b).toFixed(1)}` +
    ` L${points[0].x.toFixed(1)},${(h - pad.b).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 120 }} role="img" aria-label="Weekly issue trend">
      <defs>
        <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.15" />
          <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#trend-fill)" />
      <path d={linePath} fill="none" stroke="hsl(var(--accent))" strokeWidth="2" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="hsl(var(--accent))" stroke="hsl(var(--card))" strokeWidth="1.5" />
      ))}
      {points.map((p, i) => (
        <text key={i} x={p.x} y={h - 2} textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))" className="font-mono">
          {p.day}
        </text>
      ))}
    </svg>
  );
}

function InsightsList({ metrics }) {
  const totalIssues = parseInt(metrics?.issuesAnalyzed || 0);
  const critIssues = parseInt(metrics?.criticalIssues || 0);

  const insights = [
    { icon: LayoutTemplate, text: totalIssues > 0 ? `Cross-browser analysis completed for ${totalIssues} visual difference points.` : 'No layout changes detected yet. Start visual tests to analyze.', severity: totalIssues > 10 ? 'warning' : 'info' },
    { icon: Palette, text: critIssues > 0 ? `Critical defects detected: ${critIssues} issues require immediate visual fix.` : 'Color contrasts and layouts pass WCAG visual standard baselines.', severity: critIssues > 0 ? 'critical' : 'info' },
    { icon: Code, text: 'Enable AI Audits on New Runs to identify root cause layout issues and CSS fixes.', severity: 'info' }
  ];

  return (
    <div className="space-y-3">
      {insights.map((item, i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors shadow-sm">
          <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${item.severity === 'critical' ? 'bg-red/10 text-red' :
              item.severity === 'major' ? 'bg-amber/10 text-amber' :
                item.severity === 'warning' ? 'bg-amber/5 text-amber' :
                  'bg-accent2/10 text-accent2'
            }`}>
            <item.icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground leading-snug">{item.text}</p>
          </div>
          <Badge variant={
            item.severity === 'critical' ? 'critical' :
              item.severity === 'major' ? 'warning' :
                item.severity === 'warning' ? 'warning' : 'info'
          } className="shrink-0 text-[10px]">
            {item.severity}
          </Badge>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function AiInsights() {
  const [trendView, setTrendView] = useState('weekly');

  const { data: insights, isLoading, refetch } = useQuery({
    queryKey: ['insights'],
    queryFn: async () => {
      const res = await api.get('/insights');
      return res.data;
    },
    staleTime: 15_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32 h-full">
        <Loader2 className="w-12 h-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const metrics = [
    { label: 'Issues Analyzed', value: insights?.metrics?.issuesAnalyzed || 0, change: 'Total', icon: Brain, color: 'text-emerald-600', bg: 'bg-amber-50' },
    { label: 'Critical Issues', value: insights?.metrics?.criticalIssues || 0, change: 'Severity', icon: AlertTriangle, color: 'text-emerald-600', bg: 'bg-amber-50' },
    { label: 'Avg Confidence', value: insights?.metrics?.avgConfidence || '0%', change: 'Confidence', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-amber-50' },
    { label: 'Suggestions Applied', value: insights?.metrics?.suggestionsApplied || 0, change: 'Applied', icon: Lightbulb, color: 'text-emerald-600', bg: 'bg-amber-50' },
  ];

  const categories = insights?.categories || [];
  const trendWeekly = insights?.trendWeekly || [];
  const topIssues = insights?.topIssues || [];
  const recentAnalyses = insights?.recentAnalyses || [];

  const totalIssuesCount = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">AI Insights</h1>
            <Badge variant="info" className="text-[10px] tracking-wider">BETA</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Cross-browser analysis, patterns, and actionable recommendations across all runs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button size="sm" className="gap-2" onClick={() => window.location.href = '/runs/new'}>
            <Target className="w-4 h-4" />
            Run Full Audit
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Issue Categories */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-accent2" />
              Issue Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No visual issues analyzed yet.</p>
            ) : (
              categories.map((c) => (
                <CategoryBar key={c.name} {...c} />
              ))
            )}
            <p className="text-xs text-muted-foreground pt-2">
              Based on {totalIssuesCount} issues across all runs and browsers
            </p>
          </CardContent>
        </Card>

        {/* Trend */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green" />
              Trend
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant={trendView === 'weekly' ? 'default' : 'outline'}
                size="sm"
                className="h-7 px-2 text-[11px]"
                onClick={() => setTrendView('weekly')}
              >
                Week
              </Button>
              <Button
                variant={trendView === 'monthly' ? 'default' : 'outline'}
                size="sm"
                className="h-7 px-2 text-[11px]"
                onClick={() => setTrendView('monthly')}
                disabled
              >
                Month
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <TrendChart data={trendWeekly} />
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span className="font-mono">Total: {totalIssuesCount} issues</span>
              <Badge variant="success" className="text-[10px]">Active</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Key Insights */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber" />
              Key Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InsightsList metrics={insights?.metrics} />
          </CardContent>
        </Card>

        {/* Top Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red" />
              Top Issues
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topIssues.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No issues detected.</p>
            ) : (
              topIssues.slice(0, 5).map((issue) => (
                <Link
                  key={issue.id}
                  to={`/runs/${issue.id}`}
                  className="block p-2.5 rounded-lg hover:bg-muted/30 transition-colors group"
                >
                  <div className="flex items-start gap-2">
                    <Badge variant={
                      issue.severity === 'critical' ? 'critical' :
                        issue.severity === 'major' ? 'warning' : 'info'
                    } className="shrink-0 text-[10px] px-1.5 py-0">
                      {issue.severity === 'critical' ? 'CRIT' : issue.severity === 'major' ? 'MAJ' : 'MIN'}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground font-medium leading-snug group-hover:text-accent transition-colors line-clamp-2">
                        {issue.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-muted-foreground">{issue.confidence}%</span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground">{issue.url}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                  </div>
                </Link>
              ))
            )}
            <Separator />
            <Button variant="ghost" size="sm" className="w-full text-xs gap-1" onClick={() => window.location.href = '/history'}>
              View All Issues <ArrowUpRight className="w-3 h-3" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent AI Analyses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-4 h-4 text-emerald-600" />
            Recent AI Analyses
          </CardTitle>
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => window.location.href = '/history'}>
            View All <ChevronRight className="w-3 h-3" />
          </Button>
        </CardHeader>
        <CardContent>
          {recentAnalyses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No audits run yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {recentAnalyses.map((a) => {
                const Icon = BROWSER_ICONS[a.browser] || Globe;
                return (
                  <Link
                    key={a.id}
                    to={`/runs/${a.id}`}
                    className="p-3 rounded-lg border border-border bg-card hover:border-accent/30 hover:bg-accent/5 transition-all group shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      <Badge variant={
                        a.verdict === 'pass' ? 'success' :
                          a.verdict === 'fail' ? 'critical' : 'warning'
                      } className="text-[9px] px-1.5 py-0 tracking-wider">
                        {a.verdict.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-foreground font-medium truncate group-hover:text-accent transition-colors">{a.url}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{a.time}</span>
                    </div>
                    {a.issues > 0 && (
                      <p className="text-xs font-mono text-red mt-1">{a.issues} issue{a.issues > 1 ? 's' : ''}</p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
