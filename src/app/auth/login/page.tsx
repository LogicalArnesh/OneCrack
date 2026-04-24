
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthLayout from '@/components/auth/AuthLayout';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { KeyRound, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, passcode);
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError('Invalid email or passcode. Please check your credentials.');
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
            <Label htmlFor="email" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="pl-10 h-11 bg-muted/50 border-border focus:ring-primary rounded-xl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
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
