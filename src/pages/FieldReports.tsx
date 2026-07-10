import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { NAFGEM_PROGRAMS, NAFGEM_REGIONS } from '@/lib/constants';
import { isHrOrAbove, normalizeRole } from '@/lib/roles';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Download, Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function FieldReports() {
  const { userRole } = useUserRole();
  const { toast } = useToast();
  const hrView = isHrOrAbove(userRole || undefined);
  const isFieldOfficer = normalizeRole(userRole || '') === 'field_officer';
  const [userId, setUserId] = useState<string | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [filterProgram, setFilterProgram] = useState<string>('all');
  const [form, setForm] = useState({
    program: NAFGEM_PROGRAMS[0],
    region: NAFGEM_REGIONS[0],
    activity_date: new Date().toISOString().split('T')[0],
    description: '',
    beneficiaries_reached: '',
    challenges: '',
    recommendations: '',
  });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await api.auth.getUser();
      if (user) setUserId(user.id);
    })();
  }, []);

  useEffect(() => {
    if (userId) loadReports();
  }, [userId, hrView]);

  const loadReports = async () => {
    let query = api.from('field_activity_reports').select('*').order('activity_date', { ascending: false });
    if (!hrView && userId) {
      query = query.eq('submitted_by', userId);
    }
    const { data, error } = await query;
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setReports(data || []);
  };

  const filtered = reports.filter((r) => {
    if (filterRegion !== 'all' && r.region !== filterRegion) return false;
    if (filterProgram !== 'all' && r.program !== filterProgram) return false;
    return true;
  });

  const submitReport = async () => {
    if (!userId || !form.description) return;
    const { error } = await api.from('field_activity_reports').insert({
      submitted_by: userId,
      program: form.program,
      region: form.region,
      activity_date: form.activity_date,
      description: form.description,
      beneficiaries_reached: form.beneficiaries_reached ? Number(form.beneficiaries_reached) : 0,
      challenges: form.challenges || null,
      recommendations: form.recommendations || null,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Submitted', description: 'Field activity report saved' });
    setForm({
      ...form,
      description: '',
      beneficiaries_reached: '',
      challenges: '',
      recommendations: '',
    });
    loadReports();
  };

  const exportCsv = () => {
    const headers = ['Date', 'Program', 'Region', 'Beneficiaries', 'Description'];
    const rows = filtered.map((r) => [
      r.activity_date,
      r.program,
      r.region,
      r.beneficiaries_reached,
      `"${String(r.description).replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `field-reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const canSubmit = userId && (hrView || !isFieldOfficer || isFieldOfficer || normalizeRole(userRole || '') === 'employee');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary">
            {hrView ? 'All Field Reports' : 'Field Activity Reports'}
          </h1>
          <p className="text-muted-foreground">Program activities across NAFGEM regions</p>
        </div>
        {hrView && (
          <Button variant="outline" onClick={exportCsv}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      {canSubmit && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Submit Report
            </CardTitle>
            <CardDescription>Record field activities and beneficiary reach</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Program</Label>
                <Select value={form.program} onValueChange={(v) => setForm({ ...form, program: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NAFGEM_PROGRAMS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Region</Label>
                <Select value={form.region} onValueChange={(v) => setForm({ ...form, region: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NAFGEM_REGIONS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Activity date</Label>
                <Input type="date" value={form.activity_date}
                  onChange={(e) => setForm({ ...form, activity_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Beneficiaries reached</Label>
                <Input type="number" min={0} value={form.beneficiaries_reached}
                  onChange={(e) => setForm({ ...form, beneficiaries_reached: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Challenges (optional)</Label>
              <Textarea value={form.challenges} onChange={(e) => setForm({ ...form, challenges: e.target.value })} rows={2} />
            </div>
            <Button onClick={submitReport}>Submit Report</Button>
          </CardContent>
        </Card>
      )}

      {hrView && (
        <Card>
          <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Select value={filterProgram} onValueChange={setFilterProgram}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Program" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All programs</SelectItem>
                {NAFGEM_PROGRAMS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterRegion} onValueChange={setFilterRegion}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Region" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All regions</SelectItem>
                {NAFGEM_REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Reports ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-muted-foreground">No reports yet.</p>
          ) : (
            <ul className="space-y-3">
              {filtered.map((r) => (
                <li key={r.id} className="border rounded-lg p-4">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">{r.program}</span>
                    <span className="text-xs font-medium bg-accent/10 text-accent px-2 py-1 rounded">{r.region}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(r.activity_date), 'dd MMM yyyy')}
                    </span>
                  </div>
                  <p className="text-sm">{r.description}</p>
                  {r.beneficiaries_reached > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Beneficiaries: {r.beneficiaries_reached}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
