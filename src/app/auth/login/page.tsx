"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthLayout from '@/components/auth/AuthLayout';
import { store } from '@/lib/store';
import { KeyRound, User as UserIcon } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [uid, setUid] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const users = store.getUsers();
    const user = users.find(u => u.uid === uid && u.passcode === passcode);

    if (user) {
      store.setCurrentUser(user);
      router.push('/dashboard');
    } else {
      setError('Invalid UID or passcode. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Welcome Back" 
      subtitle="Access your secure testing environment"
    >
      <form onSubmit={handleLogin} className="space-y-6">
        {error && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="uid" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Test Login UID</Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="uid"
                type="text"
                placeholder="Enter your UID"
                className="pl-10 h-11 bg-muted/50 border-border focus:ring-primary rounded-xl"
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="passcode" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Passcode</Label>
              <Link href="/auth/forgot" className="text-xs text-primary hover:underline">Forgot?</Link>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="passcode"
                type="password"
                placeholder="Enter passcode"
                className="pl-10 h-11 bg-muted/50 border-border focus:ring-primary rounded-xl"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full h-12 text-lg font-semibold rounded-xl" disabled={loading}>
          {loading ? 'Authenticating...' : 'Sign In'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          New to here?{' '}
          <Link href="/auth/register" className="text-primary font-semibold hover:underline">
            Register for access
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
