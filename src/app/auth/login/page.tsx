
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthLayout from '@/components/auth/AuthLayout';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { KeyRound, User as UserIcon, Loader2, Eye, EyeOff } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const [identifier, setIdentifier] = useState(''); // UID or Email
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Special Admin Shortcut
    if (identifier.toLowerCase() === APP_CONFIG.ADMIN.UID && passcode === APP_CONFIG.ADMIN.PASSCODE) {
      try {
        await signInWithEmailAndPassword(auth, APP_CONFIG.ADMIN.EMAIL, APP_CONFIG.ADMIN.PASSCODE);
        router.push('/admin');
        return;
      } catch (err) {
        // If auth record doesn't exist, proceed with normal logic or handle error
      }
    }

    try {
      let emailToUse = identifier;

      // If identifier doesn't look like an email, it's likely a custom UID
      if (!identifier.includes('@')) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('loginUid', '==', identifier.toLowerCase()), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          throw new Error('No account found with this UID.');
        }

        const userData = querySnapshot.docs[0].data();
        // Use either the real email or the internal virtual email
        emailToUse = userData.email || `${userData.loginUid}@onecrack.internal`;
      }

      await signInWithEmailAndPassword(auth, emailToUse, passcode);
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError('Invalid ID or passcode. Access denied.');
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Secure Access" 
      subtitle="Login with your UID or Email"
    >
      <form onSubmit={handleLogin} className="space-y-6">
        {error && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Login UID or Email</Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter your unique ID"
                className="pl-10 h-11 bg-muted/50 border-border rounded-xl font-medium"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Passcode</Label>
              <Link href="/auth/forgot" className="text-[10px] text-primary font-bold hover:underline">RECOVER</Link>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPass ? "text" : "password"}
                placeholder="••••••"
                className="pl-10 pr-10 h-11 bg-muted/50 border-border rounded-xl font-mono"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                required
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1 h-9 w-9 text-muted-foreground hover:bg-transparent"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full h-12 text-lg font-bold rounded-xl shadow-xl shadow-primary/10" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {loading ? 'Verifying...' : 'Sign In'}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          New student?{' '}
          <Link href="/auth/register" className="text-primary font-bold hover:underline">
            Register UID
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
