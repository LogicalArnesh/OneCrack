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
import { collection, query, where, getDocs, limit, doc, setDoc, getDoc } from 'firebase/firestore';
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

    // Special Admin Shortcut Logic
    if (
      (cleanIdentifier === APP_CONFIG.ADMIN.UID || cleanIdentifier === APP_CONFIG.ADMIN.EMAIL) && 
      passcode === APP_CONFIG.ADMIN.PASSCODE
    ) {
      try {
        // Try normal login first
        await signInWithEmailAndPassword(auth, APP_CONFIG.ADMIN.EMAIL, APP_CONFIG.ADMIN.PASSCODE);
        router.push('/admin');
        return;
      } catch (err: any) {
        // If user doesn't exist, this is likely the first run
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          try {
            // Auto-provision admin for the first time
            const userCredential = await createUserWithEmailAndPassword(auth, APP_CONFIG.ADMIN.EMAIL, APP_CONFIG.ADMIN.PASSCODE);
            const user = userCredential.user;
            
            // Create user profile
            await setDoc(doc(db, 'users', user.uid), {
              id: user.uid,
              name: 'System Administrator',
              email: APP_CONFIG.ADMIN.EMAIL,
              loginUid: 'admin',
              classLevel: 'Dropper',
              registrationDate: new Date().toISOString(),
              isAdmin: true
            });

            // Grant Admin role
            await setDoc(doc(db, 'roles_admin', user.uid), { enabled: true });
            
            router.push('/admin');
            return;
          } catch (createErr) {
            console.error("Admin Provisioning Failed:", createErr);
          }
        }
        console.error("Admin Login Failed:", err);
      }
    }

    try {
      let emailToUse = cleanIdentifier;

      // Check if UID (no @ symbol)
      if (!cleanIdentifier.includes('@')) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('loginUid', '==', cleanIdentifier), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          throw new Error('Identity not found. Check your Login UID.');
        }

        const userData = querySnapshot.docs[0].data();
        emailToUse = userData.email || `${userData.loginUid}@onecrack.internal`;
      }

      await signInWithEmailAndPassword(auth, emailToUse, passcode);
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid credentials. Please verify your ID and passcode.');
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="OneCrack Access" subtitle="Secure portal for evaluations">
      <form onSubmit={handleLogin} className="space-y-6">
        {error && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Login ID (UID or Email)</Label>
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
              <Link href="#" className="text-[10px] text-primary font-bold hover:underline opacity-50">FORGOT?</Link>
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
          {loading ? 'Verifying Identity...' : 'Sign In'}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Not registered?{' '}
          <Link href="/auth/register" className="text-primary font-bold hover:underline">
            Register Unique ID
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
