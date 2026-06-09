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
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { KeyRound, User as UserIcon, Loader2, Eye, EyeOff } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const [identifier, setIdentifier] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanIdentifier = identifier.trim().toLowerCase();

    // 1. Special Admin Case
    if (
      (cleanIdentifier === APP_CONFIG.ADMIN.UID || cleanIdentifier === APP_CONFIG.ADMIN.EMAIL) && 
      passcode === APP_CONFIG.ADMIN.PASSCODE
    ) {
      try {
        await signInWithEmailAndPassword(auth, APP_CONFIG.ADMIN.EMAIL, APP_CONFIG.ADMIN.PASSCODE);
        router.push('/admin');
        return;
      } catch (err: any) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
          try {
            // Attempt to provision admin if missing
            const userCredential = await createUserWithEmailAndPassword(auth, APP_CONFIG.ADMIN.EMAIL, APP_CONFIG.ADMIN.PASSCODE);
            const user = userCredential.user;
            await setDoc(doc(db, 'users', user.uid), {
              id: user.uid,
              name: 'System Administrator',
              email: APP_CONFIG.ADMIN.EMAIL,
              loginUid: 'admin',
              classLevel: 'Dropper',
              registrationDate: new Date().toISOString(),
              isAdmin: true
            });
            await setDoc(doc(db, 'roles_admin', user.uid), { enabled: true });
            router.push('/admin');
            return;
          } catch (createErr) {
            console.error("Admin Setup Failed:", createErr);
            setError('System verification failed. Root access denied.');
            setLoading(false);
            return;
          }
        }
      }
    }

    // 2. Standard User Login
    try {
      const loginEmail = cleanIdentifier.includes('@') 
        ? cleanIdentifier 
        : `${cleanIdentifier}@onecrack.internal`;

      await signInWithEmailAndPassword(auth, loginEmail, passcode);
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      let message = 'Identification failed. Verify UID and passcode.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        message = 'Invalid credentials. Ensure your UID is correctly entered.';
      }
      setError(message);
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="OneCrack Command" subtitle="Authenticated portal access exclusively">
      <form onSubmit={handleLogin} className="space-y-6">
        {error && (
          <Alert variant="destructive" className="rounded-2xl border-destructive/50 bg-destructive/10">
            <AlertDescription className="font-bold text-xs uppercase tracking-widest">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-primary">Identity UID</Label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ex: user_99"
                className="pl-12 h-14 bg-muted/20 border-border rounded-2xl font-bold font-mono"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-primary">Secure Passcode</Label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPass ? "text" : "password"}
                placeholder="••••••"
                className="pl-12 pr-12 h-14 bg-muted/20 border-border rounded-2xl font-mono"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="absolute right-4 top-3.5 text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full h-16 text-sm font-black uppercase tracking-[0.3em] rounded-2xl bg-primary text-black shadow-neon transition-all hover:scale-[1.02]" disabled={loading}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : null}
          {loading ? 'AUTHENTICATING...' : 'ACCESS PORTAL'}
        </Button>

        <p className="text-center text-[10px] text-muted-foreground font-black uppercase tracking-widest">
          NOT REGISTERED?{' '}
          <Link href="/auth/register" className="text-primary hover:underline">
            ESTABLISH IDENTITY
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}