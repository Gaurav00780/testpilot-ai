import { useState, useEffect } from 'react';
import api from '../utils/api';
import useAppStore from '../store/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import {
  User, Key, Bell, Palette, Copy, Eye, EyeOff,
  Plus, Trash2, Globe, Smartphone
} from 'lucide-react';

const BROWSER_OPTIONS = ['chromium', 'firefox', 'webkit', 'mobile-chrome'];

export default function Settings() {
  const { user, setUser } = useAppStore();
  const [name, setName] = useState(user?.name || 'Sutha');
  const [email, setEmail] = useState(user?.email || 'sutha@example.com');
  const [apiKeys, setApiKeys] = useState([]);
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    weeklyDigest: false,
    runCompleted: true,
    criticalIssues: true,
    productUpdates: false,
  });
  const [defaultBrowsers, setDefaultBrowsers] = useState(['chromium', 'firefox']);
  const [defaultViewport, setDefaultViewport] = useState('1440x900');
  const [showKey, setShowKey] = useState({});
  const [saving, setSaving] = useState({});

  useEffect(() => {
    // Fetch API keys
    api.get('/settings/api-keys')
      .then((res) => setApiKeys(res.data))
      .catch((err) => console.error('Error fetching API keys:', err));
  }, []);

  const toggleNotification = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleBrowser = (b) => {
    setDefaultBrowsers((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  };

  const handleSave = async (section) => {
    setSaving((prev) => ({ ...prev, [section.toLowerCase()]: true }));
    try {
      if (section === 'Profile') {
        const res = await api.put('/settings/profile', { name, email });
        setUser(res.data);
        toast.success('Profile settings saved');
      } else {
        await new Promise((resolve) => setTimeout(resolve, 600));
        toast.success(`${section} settings saved`);
      }
    } catch (err) {
      toast.error(`Failed to save ${section} settings`);
    } finally {
      setSaving((prev) => ({ ...prev, [section.toLowerCase()]: false }));
    }
  };

  const createKey = async () => {
    const keyName = prompt('Enter a name for the new API key:');
    if (!keyName) return;
    try {
      const res = await api.post('/settings/api-keys', { name: keyName });
      setApiKeys((prev) => [res.data, ...prev]);
      toast.success('API key created');
    } catch (err) {
      toast.error('Failed to create API key');
    }
  };

  const deleteKey = async (id) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;
    try {
      await api.delete(`/settings/api-keys/${id}`);
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
      toast.success('API key deleted');
    } catch (err) {
      toast.error('Failed to delete API key');
    }
  };

  const copyKey = (key) => {
    navigator.clipboard?.writeText(key);
    toast.success('API key copied');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account, API keys, and preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="w-fit max-w-full justify-start overflow-x-auto flex-nowrap h-auto no-scrollbar">
          <TabsTrigger value="profile" className="gap-2 shrink-0"><User className="w-4 h-4" /> Profile</TabsTrigger>
          <TabsTrigger value="api" className="gap-2 shrink-0"><Key className="w-4 h-4" /> API Keys</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 shrink-0"><Bell className="w-4 h-4" /> Notifications</TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2 shrink-0"><Palette className="w-4 h-4" /> Preferences</TabsTrigger>
        </TabsList>

        {/* ── Profile ─────────────────────────────────── */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your name and email used across the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-emerald-950 text-emerald-400 text-lg font-bold">S</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground">{email}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="sm:ml-auto w-full sm:w-auto">Change Avatar</Button>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="settings-name">Name</Label>
                  <Input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settings-email">Email</Label>
                  <Input id="settings-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <Button onClick={() => handleSave('Profile')} disabled={saving.profile}>
                {saving.profile ? 'Saving…' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── API Keys ────────────────────────────────── */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>Keys used to authenticate API requests.</CardDescription>
              </div>
              <Button size="sm" className="gap-1 w-full sm:w-auto" onClick={createKey}><Plus className="w-4 h-4" /> Create Key</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {apiKeys.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No API keys created yet.</p>
              ) : (
                apiKeys.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg border">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">{item.name}</span>
                        <Badge variant={item.status === 'active' ? 'success' : 'secondary'} className="text-[9px] px-1.5 py-0">
                          {item.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                        <span className="truncate max-w-[200px]">
                          {showKey[item.id] ? item.key : `${item.key.substring(0, 12)}...`}
                        </span>
                        <button onClick={() => setShowKey((prev) => ({ ...prev, [item.id]: !prev[item.id] }))} className="hover:text-foreground transition-colors">
                          {showKey[item.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => copyKey(item.key)} className="hover:text-foreground transition-colors">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground shrink-0 hidden sm:block">
                      <p>Created {item.created}</p>
                      <p>Used {item.lastUsed}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteKey(item.id)} className="w-8 h-8 text-muted-foreground hover:text-destructive shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notifications ────────────────────────────── */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Choose what alerts you receive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive email notifications for important events' },
                { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Weekly summary of all runs and issues' },
                { key: 'runCompleted', label: 'Run Completed', desc: 'Notify when a test run finishes' },
                { key: 'criticalIssues', label: 'Critical Issues', desc: 'Immediate alert when critical issues are found' },
                { key: 'productUpdates', label: 'Product Updates', desc: 'New features, changelog, and maintenance notices' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <Switch checked={notifications[key]} onCheckedChange={() => toggleNotification(key)} />
                </div>
              ))}
              <Separator />
              <Button onClick={() => handleSave('Notifications')} disabled={saving.notifications}>
                {saving.notifications ? 'Saving…' : 'Save Preferences'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Preferences ──────────────────────────────── */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Default Test Settings</CardTitle>
              <CardDescription>Configure defaults for new test runs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Default Browsers</Label>
                <div className="flex flex-wrap gap-2">
                  {BROWSER_OPTIONS.map((b) => {
                    const active = defaultBrowsers.includes(b);
                    return (
                      <Button key={b} type="button" variant={active ? 'default' : 'outline'} size="sm" onClick={() => toggleBrowser(b)}>
                        {b === 'chromium' && <Globe className="w-3.5 h-3.5" />}
                        {b === 'firefox' && <Globe className="w-3.5 h-3.5" />}
                        {b === 'webkit' && <Smartphone className="w-3.5 h-3.5" />}
                        {b === 'mobile-chrome' && <Smartphone className="w-3.5 h-3.5" />}
                        {b.charAt(0).toUpperCase() + b.slice(1).replace('-chrome', ' Chrome')}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="viewport-pref">Default Viewport</Label>
                <Select value={defaultViewport} onValueChange={setDefaultViewport}>
                  <SelectTrigger id="viewport-pref" className="max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1440x900">Desktop 1440px</SelectItem>
                    <SelectItem value="1280x800">Laptop 1280px</SelectItem>
                    <SelectItem value="768x1024">Tablet 768px</SelectItem>
                    <SelectItem value="390x844">Mobile 390px</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">AI Analysis</p>
                  <p className="text-xs text-muted-foreground">Automatically run AI analysis on new test runs</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Auto-Baseline</p>
                  <p className="text-xs text-muted-foreground">Automatically promote passing runs to baselines</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <Button onClick={() => handleSave('Preferences')} disabled={saving.preferences}>
                {saving.preferences ? 'Saving…' : 'Save Preferences'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
