import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Award, GraduationCap, AlertTriangle } from 'lucide-react';
import { format, addDays, isBefore } from 'date-fns';

export default function MyTraining() {
  const location = useLocation();
  const { toast } = useToast();
  /** Personal page shows staff forms; HR route is records-only */
  const isHrRecordsPage = location.pathname.startsWith('/hr/');
  const [userId, setUserId] = useState<string | null>(null);
  const [certs, setCerts] = useState<any[]>([]);
  const [external, setExternal] = useState<any[]>([]);
  const [certForm, setCertForm] = useState({
    certificate_name: '',
    issuing_body: '',
    issue_date: '',
    expiry_date: '',
  });
  const [extForm, setExtForm] = useState({
    training_name: '',
    provider: '',
    training_date: '',
    location: '',
    cost: '',
  });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await api.auth.getUser();
      if (user) setUserId(user.id);
    })();
  }, []);

  useEffect(() => {
    if (userId) loadData();
  }, [userId, isHrRecordsPage]);

  const loadData = async () => {
    let certQuery = api.from('employee_certifications').select('*').order('expiry_date');
    let extQuery = api.from('external_trainings').select('*').order('training_date', { ascending: false });

    if (!isHrRecordsPage && userId) {
      certQuery = certQuery.eq('employee_id', userId);
      extQuery = extQuery.eq('employee_id', userId);
    }

    const [{ data: certData }, { data: extData }] = await Promise.all([certQuery, extQuery]);
    setCerts(certData || []);
    setExternal(extData || []);
  };

  const expiringSoon = certs.filter((c) => {
    if (!c.expiry_date) return false;
    const expiry = new Date(c.expiry_date);
    return isBefore(expiry, addDays(new Date(), 60));
  });

  const addCert = async () => {
    if (!userId || !certForm.certificate_name) return;
    const { error } = await api.from('employee_certifications').insert({
      employee_id: userId,
      ...certForm,
      issue_date: certForm.issue_date || null,
      expiry_date: certForm.expiry_date || null,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Saved', description: 'Certification added' });
    setCertForm({ certificate_name: '', issuing_body: '', issue_date: '', expiry_date: '' });
    loadData();
  };

  const addExternal = async () => {
    if (!userId || !extForm.training_name) return;
    const { error } = await api.from('external_trainings').insert({
      employee_id: userId,
      training_name: extForm.training_name,
      provider: extForm.provider,
      training_date: extForm.training_date || null,
      location: extForm.location,
      cost: extForm.cost ? Number(extForm.cost) : null,
      created_by: userId,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Saved', description: 'External training logged' });
    setExtForm({ training_name: '', provider: '', training_date: '', location: '', cost: '' });
    loadData();
  };

  const showStaffForms = !isHrRecordsPage;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-primary">
          {isHrRecordsPage ? 'Training Records' : 'My Training'}
        </h1>
        <p className="text-muted-foreground">
          {isHrRecordsPage
            ? 'All staff certifications and external training history'
            : 'Add your certifications and log external training'}
        </p>
      </div>

      {expiringSoon.length > 0 && (
        <Card className="border-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <AlertTriangle className="w-5 h-5" />
              Certifications expiring within 60 days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {expiringSoon.map((c) => (
                <li key={c.id} className="text-sm">
                  <strong>{c.certificate_name}</strong> — expires {format(new Date(c.expiry_date), 'dd MMM yyyy')}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="certifications">
        <TabsList>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="external">External Training</TabsTrigger>
        </TabsList>

        <TabsContent value="certifications" className="space-y-4">
          {showStaffForms && (
            <Card>
              <CardHeader><CardTitle>Add Certification</CardTitle></CardHeader>
              <CardContent className="grid gap-3 max-w-lg">
                <div className="space-y-2">
                  <Label>Certificate name</Label>
                  <Input placeholder="e.g. First Aid Certificate" value={certForm.certificate_name}
                    onChange={(e) => setCertForm({ ...certForm, certificate_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Issuing body</Label>
                  <Input placeholder="Issuing organization" value={certForm.issuing_body}
                    onChange={(e) => setCertForm({ ...certForm, issuing_body: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Issue date</Label>
                    <Input type="date" value={certForm.issue_date}
                      onChange={(e) => setCertForm({ ...certForm, issue_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiry date</Label>
                    <Input type="date" value={certForm.expiry_date}
                      onChange={(e) => setCertForm({ ...certForm, expiry_date: e.target.value })} />
                  </div>
                </div>
                <Button onClick={addCert} disabled={!certForm.certificate_name}>Save Certification</Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Award className="w-5 h-5" /> Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              {certs.length === 0 ? (
                <p className="text-muted-foreground">No certifications recorded.</p>
              ) : (
                <ul className="space-y-2">
                  {certs.map((c) => (
                    <li key={c.id} className="border rounded-lg p-3">
                      <p className="font-medium">{c.certificate_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {c.issuing_body}
                        {c.expiry_date && ` · Expires ${format(new Date(c.expiry_date), 'dd MMM yyyy')}`}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="external" className="space-y-4">
          {showStaffForms && (
            <Card>
              <CardHeader><CardTitle>Log External Training</CardTitle></CardHeader>
              <CardContent className="grid gap-3 max-w-lg">
                <div className="space-y-2">
                  <Label>Training name</Label>
                  <Input placeholder="Training or workshop name" value={extForm.training_name}
                    onChange={(e) => setExtForm({ ...extForm, training_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Input placeholder="Provider or organizer" value={extForm.provider}
                    onChange={(e) => setExtForm({ ...extForm, provider: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={extForm.training_date}
                    onChange={(e) => setExtForm({ ...extForm, training_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Location (optional)</Label>
                  <Input placeholder="Location" value={extForm.location}
                    onChange={(e) => setExtForm({ ...extForm, location: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Cost (optional)</Label>
                  <Input type="number" min={0} placeholder="0" value={extForm.cost}
                    onChange={(e) => setExtForm({ ...extForm, cost: e.target.value })} />
                </div>
                <Button onClick={addExternal} disabled={!extForm.training_name}>Save Training</Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><GraduationCap className="w-5 h-5" /> External Training</CardTitle>
            </CardHeader>
            <CardContent>
              {external.length === 0 ? (
                <p className="text-muted-foreground">No external training recorded.</p>
              ) : (
                <ul className="space-y-2">
                  {external.map((t) => (
                    <li key={t.id} className="border rounded-lg p-3">
                      <p className="font-medium">{t.training_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {t.provider}
                        {t.training_date && ` · ${format(new Date(t.training_date), 'dd MMM yyyy')}`}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
