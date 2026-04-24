
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthLayout from '@/components/auth/AuthLayout';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ClassLevel, Subject } from '@/lib/types';
import { CheckCircle2, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    passcode: '',
    confirmPasscode: '',
    classLevel: '' as ClassLevel,
    subjectPreference: '' as Subject,
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.passcode !== formData.confirmPasscode) {
      setError('Passcodes do not match.');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.passcode);
      const user = userCredential.user;

      // Create Firestore profile
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        name: formData.name,
        email: formData.email,
        classLevel: formData.classLevel,
        subjectPreference: formData.subjectPreference || null,
        registrationDate: new Date().toISOString(),
        loginUid: formData.email.split('@')[0], // Simplified login UID for portal
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Account Created">
        <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <p className="text-lg font-body text-muted-foreground">
            Welcome to OneCrack Test Portal!
          </p>
          <p className="text-sm text-muted-foreground italic">Redirecting to your dashboard...</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create Account" subtitle="Join the professional testing environment">
      <form onSubmit={handleRegister} className="space-y-5">
        {error && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name" className="text-xs uppercase font-bold text-muted-foreground">Full Name</Label>
            <Input
              id="name"
              placeholder="Your full name"
              className="rounded-xl h-10 bg-muted/30"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs uppercase font-bold text-muted-foreground">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="student@example.com"
              className="rounded-xl h-10 bg-muted/30"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="class" className="text-xs uppercase font-bold text-muted-foreground">Current Class</Label>
              <Select onValueChange={(v) => setFormData({...formData, classLevel: v as ClassLevel})} required>
                <SelectTrigger className="rounded-xl h-10 bg-muted/30">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Class 10</SelectItem>
                  <SelectItem value="11">Class 11</SelectItem>
                  <SelectItem value="12">Class 12</SelectItem>
                  <SelectItem value="Dropper">Dropper</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-1">
              <Label className="text-xs uppercase font-bold text-muted-foreground">Stream</Label>
              <Select onValueChange={(v) => setFormData({...formData, subjectPreference: v as Subject})}>
                <SelectTrigger className="rounded-xl h-10 bg-muted/30">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Biology">Biology</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="pass" className="text-xs uppercase font-bold text-muted-foreground">Passcode</Label>
              <Input
                id="pass"
                type="password"
                placeholder="6+ characters"
                className="rounded-xl h-10 bg-muted/30"
                value={formData.passcode}
                onChange={(e) => setFormData({...formData, passcode: e.target.value})}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cpass" className="text-xs uppercase font-bold text-muted-foreground">Confirm</Label>
              <Input
                id="cpass"
                type="password"
                className="rounded-xl h-10 bg-muted/30"
                value={formData.confirmPasscode}
                onChange={(e) => setFormData({...formData, confirmPasscode: e.target.value})}
                required
              />
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full h-11 text-lg font-semibold rounded-xl mt-4" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {loading ? 'Processing...' : 'Complete Registration'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary font-semibold hover:underline">
            Login here
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
