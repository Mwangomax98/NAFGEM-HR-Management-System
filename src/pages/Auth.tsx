import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { MAIN_SITE_URL } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink, Lock } from 'lucide-react';
import nafgemLogo from '@/assets/nafgem-logo.png';

const AUTH_DISABLED = import.meta.env.VITE_AUTH_DISABLED === 'true';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await api.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: 'Welcome', description: 'Signed in successfully' });
      navigate('/');
    } catch (err: any) {
      toast({
        title: 'Login failed',
        description: err.message || 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(36,43%,96%)]">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={nafgemLogo} alt="NAFGEM" className="h-10 w-10 object-contain" />
            <div>
              <p className="font-heading font-semibold text-primary text-sm leading-tight">NAFGEM Tanzania</p>
              <p className="text-xs text-muted-foreground">Staff HR Portal</p>
            </div>
          </div>
          <a
            href={MAIN_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            Main website
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-elevated border-border/60">
          <CardHeader className="text-center space-y-3 pb-2">
            <div className="mx-auto w-20 h-20 rounded-full bg-white border border-border flex items-center justify-center overflow-hidden shadow-soft">
              <img src={nafgemLogo} alt="NAFGEM logo" className="w-14 h-14 object-contain" />
            </div>
            <div>
              <CardTitle className="text-2xl font-heading text-primary">Sign in</CardTitle>
              <CardDescription className="mt-1">
                NAFGEM HR Management System
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@nafgemtanzania.or.tz"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-accent hover:bg-accent-hover text-accent-foreground" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>

            {AUTH_DISABLED && (
              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                Continue without login (dev)
              </Button>
            )}

            <div className="rounded-lg bg-muted/60 border border-border px-3 py-3 text-sm text-muted-foreground flex gap-2">
              <Lock className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
              <p>
                Accounts are created by HR or Super Admin only. There is no self-registration.
                If you need access, contact your administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground border-t bg-white">
        © {new Date().getFullYear()} NAFGEM Tanzania ·{' '}
        <a href={MAIN_SITE_URL} className="text-primary hover:underline">
          nafgemtanzania.or.tz
        </a>
      </footer>
    </div>
  );
}
