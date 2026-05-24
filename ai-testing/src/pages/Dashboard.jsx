import { useRuns } from '../hooks/useRuns';
import { RunHealthChart } from '../components/dashboard/RunHealthChart';
import { RecentRunCard } from '../components/dashboard/RecentRunCard';
import { QuickRunForm } from '../components/dashboard/QuickRunForm';
import useAppStore from '../store/useAppStore';
import { Calendar, ChevronDown, Activity, CheckCircle2, AlertCircle, ShieldCheck, Info } from 'lucide-react';

function StatCard({ label, value, icon: Icon, iconColor, iconBg }) {
  return (
    <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="font-sans text-3xl font-bold text-ink leading-none mb-1">{value}</p>
          <p className="text-sm text-muted font-medium flex items-center gap-1">
            {label}
            <Info className="w-3.5 h-3.5 text-gray-400" />
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-green/10 text-green">0%</span>
        <span className="text-xs text-muted font-medium">vs last 7 days</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAppStore();
  const { data, isLoading } = useRuns({ limit: 10 });

  const runs     = data?.runs || [];
  const recent5  = runs.slice(0, 5);
  const passRate = runs.length
    ? Math.round((runs.filter((r) => r.verdict === 'pass').length / runs.length) * 100)
    : 0;

  const criticalIssues = runs.reduce((acc, r) => acc + (r.summary?.criticalIssues || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans text-2xl font-bold text-ink flex items-center gap-2">
            Welcome back, {user?.name ? user.name.split(' ')[0] : 'test'} <span className="text-2xl">👋</span>
          </h1>
          <p className="text-muted text-sm mt-1">Here's what's happening with your tests today.</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-white text-sm font-medium text-ink shadow-sm hover:bg-gray-50 transition-colors">
          <Calendar className="w-4 h-4 text-gray-500" />
          May 1 – May 7, 2025
          <ChevronDown className="w-4 h-4 text-gray-500 ml-1" />
        </button>
      </div>

      {/* Stat Cards */}
      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-2">
              <div className="skeleton h-12 w-12 rounded-lg" />
              <div className="skeleton h-8 w-20 mt-4" />
              <div className="skeleton h-3 w-32" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Total Runs"
            value={data?.total ?? runs.length ?? 0}
            icon={Activity}
            iconColor="text-indigo-500"
            iconBg="bg-indigo-50"
          />
          <StatCard
            label="Pass Rate"
            value={`${passRate}%`}
            icon={CheckCircle2}
            iconColor="text-amber-500"
            iconBg="bg-amber-50"
          />
          <StatCard
            label="Open Critical Issues"
            value={criticalIssues}
            icon={AlertCircle}
            iconColor="text-red"
            iconBg="bg-red-50"
          />
          <StatCard
            label="Resolved Issues"
            value="0"
            icon={ShieldCheck}
            iconColor="text-green"
            iconBg="bg-green-50"
          />
        </div>
      )}

      {/* Middle row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Run Health Chart */}
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base text-ink flex items-center gap-2">
              Run Health
              <Info className="w-4 h-4 text-gray-400" />
            </h2>
            <button className="flex items-center gap-1 text-sm text-ink border border-border rounded-md px-2 py-1 shadow-sm">
              Last 7 days
              <ChevronDown className="w-3 h-3 text-gray-500" />
            </button>
          </div>
          {isLoading ? (
            <div className="skeleton h-48 w-full rounded-lg" />
          ) : runs.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-48 h-32 mb-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50" />
                    <div className="w-3/4 h-3/4 border-2 border-gray-200 rounded-lg bg-white relative">
                      <div className="h-4 border-b border-gray-200 flex items-center px-1 gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                      </div>
                      <div className="p-2 space-y-1">
                        <div className="h-1.5 w-1/2 bg-gray-100 rounded"></div>
                        <div className="h-1.5 w-3/4 bg-gray-100 rounded"></div>
                        <div className="h-1.5 w-2/3 bg-gray-100 rounded"></div>
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-indigo-100 rounded-full p-2 text-indigo-500 border-2 border-white shadow-sm">
                      <Activity className="w-6 h-6" />
                    </div>
                </div>
                <h3 className="text-ink font-bold mb-1">No runs yet</h3>
                <p className="text-muted text-sm">Run your first test to see health metrics here.</p>
             </div>
          ) : (
            <RunHealthChart runs={runs} />
          )}
        </div>

        {/* Quick Test */}
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <h2 className="font-bold text-base text-ink mb-4">Quick Test</h2>
          <QuickRunForm />
        </div>
      </div>

      {/* Recent Runs */}
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 flex items-center justify-between">
          <h2 className="font-bold text-base text-ink">Recent Runs</h2>
          <a href="/history" className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors font-medium flex items-center gap-1">
            View all runs <span aria-hidden="true">&rarr;</span>
          </a>
        </div>

        <div className="w-full">
           <div className="grid grid-cols-6 gap-4 px-5 py-2 border-y border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
             <div className="col-span-1">URL</div>
             <div className="col-span-1 text-center">Browsers</div>
             <div className="col-span-1 text-center">Status</div>
             <div className="col-span-1 text-center">Issues</div>
             <div className="col-span-1 text-right">Duration</div>
             <div className="col-span-1 text-right">Started At</div>
           </div>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : recent5.length === 0 ? (
          <div className="px-5 py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100 shadow-sm relative">
              <div className="w-10 h-8 border-2 border-gray-200 rounded flex flex-col bg-white">
                <div className="h-2 border-b border-gray-200 flex items-center px-1 gap-0.5">
                   <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                   <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                </div>
              </div>
            </div>
            <h3 className="text-ink font-bold mb-1">No runs yet</h3>
            <p className="text-muted text-sm mb-4">Start your first test to see results here.</p>
            <a href="/runs/new" className="px-4 py-2 bg-accent hover:bg-orange-600 text-white font-medium rounded-lg transition-colors">
              Run Your First Test
            </a>
          </div>
        ) : (
           <div className="divide-y divide-gray-100">
             {recent5.map((run) => <RecentRunCard key={run.id} run={run} />)}
           </div>
        )}
      </div>
    </div>
  );
}
