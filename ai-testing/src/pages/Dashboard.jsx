import { useState, useMemo } from 'react';
import { subDays, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { useRuns } from '../hooks/useRuns';
import { RunHealthChart } from '../components/dashboard/RunHealthChart';
import { RecentRunCard } from '../components/dashboard/RecentRunCard';
import { QuickRunForm } from '../components/dashboard/QuickRunForm';
import { DatePickerWithRange } from '../components/ui/date-picker-range';
import useAppStore from '../store/useAppStore';
import { Calendar, ChevronDown, Activity, CheckCircle2, AlertCircle, ShieldCheck, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Link } from 'react-router-dom';

function StatCard({ label, value, icon: Icon, iconColor, iconBg }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${iconBg} ${iconColor} dark:bg-amber-50 dark:text-emerald-600`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground leading-none mb-1">{value}</p>
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1">
              {label}
              <Info className="w-3.5 h-3.5 text-muted-foreground/50" />
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Badge variant="success" className="px-1.5 py-0.5 text-[10px]">0%</Badge>
          <span className="text-xs text-muted-foreground font-medium">vs last 7 days</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAppStore();
  const [date, setDate] = useState({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [healthDate, setHealthDate] = useState({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  const { data, isLoading } = useRuns({ limit: 100 });

  const runs = useMemo(() => {
    if (!data?.runs) return [];
    if (!date?.from || !date?.to) return data.runs;
    
    const start = startOfDay(date.from);
    const end = endOfDay(date.to);
    
    return data.runs.filter((run) => {
      const runDate = parseISO(run.createdAt);
      return runDate >= start && runDate <= end;
    });
  }, [data?.runs, date]);

  const healthRuns = useMemo(() => {
    if (!data?.runs) return [];
    if (!healthDate?.from || !healthDate?.to) return data.runs;
    
    const start = startOfDay(healthDate.from);
    const end = endOfDay(healthDate.to);
    
    return data.runs.filter((run) => {
      const runDate = parseISO(run.createdAt);
      return runDate >= start && runDate <= end;
    });
  }, [data?.runs, healthDate]);

  const recent5 = runs.slice(0, 5);
  const passRate = runs.length
    ? Math.round((runs.filter((r) => r.verdict === 'pass').length / runs.length) * 100)
    : 0;

  const criticalIssues = runs.reduce((acc, r) => acc + (r.summary?.criticalIssues || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Welcome back, {user?.name ? user.name.split(' ')[0] : 'test'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Here's what's happening with your tests today.</p>
        </div>
        <DatePickerWithRange date={date} setDate={setDate} />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-2">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard label="Total Runs" value={data?.total ?? runs.length ?? 0} icon={Activity} iconColor="text-emerald-600" iconBg="bg-amber-50" />
            <StatCard label="Pass Rate" value={`${passRate}%`} icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-amber-50" />
            <StatCard label="Open Critical Issues" value={criticalIssues} icon={AlertCircle} iconColor="text-emerald-600" iconBg="bg-amber-50" />
            <StatCard label="Resolved Issues" value="0" icon={ShieldCheck} iconColor="text-emerald-600" iconBg="bg-amber-50" />
          </>
        )}
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Run Health Chart */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              Run Health
              <Info className="w-4 h-4 text-muted-foreground/50" />
            </CardTitle>
            <DatePickerWithRange date={healthDate} setDate={setHealthDate} />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full rounded-lg" />
            ) : runs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-48 h-32 mb-4 bg-muted/30 rounded-xl border flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50" />
                  <div className="w-3/4 h-3/4 border-2 border-muted rounded-lg bg-background relative">
                    <div className="h-4 border-b flex items-center px-1 gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-muted"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-muted"></div>
                    </div>
                    <div className="p-2 space-y-1">
                      <div className="h-1.5 w-1/2 bg-muted/50 rounded"></div>
                      <div className="h-1.5 w-3/4 bg-muted/50 rounded"></div>
                      <div className="h-1.5 w-2/3 bg-muted/50 rounded"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-emerald-100 rounded-full p-2 text-emerald-600 border-2 border-card shadow-sm">
                    <Activity className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-foreground font-bold mb-1">No runs yet</h3>
                <p className="text-muted-foreground text-sm">Run your first test to see health metrics here.</p>
              </div>
            ) : (
              <RunHealthChart runs={healthRuns} />
            )}
          </CardContent>
        </Card>

        {/* Quick Test */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Test</CardTitle>
          </CardHeader>
          <CardContent>
            <QuickRunForm />
          </CardContent>
        </Card>
      </div>

      {/* Recent Runs */}
      <Card className="overflow-hidden border-0">
        <div className="px-5 py-4 flex items-center justify-between">
          <h2 className="font-bold text-base text-foreground">Recent Runs</h2>
          <Link to="/history" className="text-sm text-accent2 hover:text-accent transition-colors font-medium flex items-center gap-1">
            View all runs <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        <div>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-4 px-5 py-2 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="col-span-1 truncate">URL</div>
            <div className="col-span-1 text-center hidden sm:block">Browsers</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-1 text-center hidden md:block">Issues</div>
            <div className="col-span-1 text-right hidden sm:block">Duration</div>
            <div className="col-span-1 text-right">Date</div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : recent5.length === 0 ? (
          <div className="px-5 py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-muted/30 rounded-2xl flex items-center justify-center mb-4 border shadow-sm relative">
              <div className="w-10 h-8 border-2 border-muted rounded flex flex-col bg-background">
                <div className="h-2 border-b flex items-center px-1 gap-0.5">
                  <div className="w-1 h-1 rounded-full bg-muted"></div>
                  <div className="w-1 h-1 rounded-full bg-muted"></div>
                </div>
              </div>
            </div>
            <h3 className="text-foreground font-bold mb-1">No runs yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Start your first test to see results here.</p>
            <Link to="/runs/new">
              <Button>Run Your First Test</Button>
            </Link>
          </div>
        ) : (
          <div>
            {recent5.map((run) => <RecentRunCard key={run.id} run={run} />)}
          </div>
        )}
      </Card>
    </div>
  );
}
