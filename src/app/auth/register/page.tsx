
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import AuthLayout from '@/components/auth/AuthLayout';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ClassLevel, Subject } from '@/lib/types';
import { CheckCircle2, Loader2, Eye, EyeOff, Info, Mail, UserCircle } from 'lucide-react';
import { sendWelcomeEmail } from '@/app/actions/email-actions';

export default function RegisterPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    loginUid: '',
    passcode: '',
    confirmPasscode: '',
    classLevel: '' as ClassLevel,
    subjectPreference: '' as Subject,
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.passcode !== formData.confirmPasscode) {
      setError('Passcodes do not match.');
      setLoading(false);
      return;
    }

    if (formData.loginUid.length < 3) {
      setError('UID must be at least 3 characters.');
      setLoading(false);
      return;
    }

    try {
      const authEmail = formData.email || `${formData.loginUid.toLowerCase()}@onecrack.internal`;
      const userCredential = await createUserWithEmailAndPassword(auth, authEmail, formData.passcode);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        name: formData.name,
        email: formData.email || null,
        loginUid: formData.loginUid.toLowerCase(),
        classLevel: formData.classLevel,
        subjectPreference: formData.subjectPreference || null,
        registrationDate: new Date().toISOString(),
      });

      if (formData.email) {
        await sendWelcomeEmail(
          formData.email, 
          formData.name, 
          formData.loginUid, 
          formData.classLevel, 
          formData.subjectPreference || 'General'
        );
      }

      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.code === 'auth/email-already-in-use' ? 'This UID or email is already taken.' : 'Registration failed.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Registration Successful">
        <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <p className="text-lg font-headline font-bold">Identity Verified</p>
          <p className="text-sm text-muted-foreground">Loading your personalized dashboard...</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Register Identity" subtitle="Create your professional testing credentials">
      <form onSubmit={handleRegister} className="space-y-4">
        {error && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Full Name</Label>
            <Input
              placeholder="Ex: John Doe"
              className="rounded-xl h-10 bg-muted/30"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Custom Unique ID (UID)</Label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ex: student_alpha_01"
                className="pl-10 rounded-xl h-10 bg-muted/30 font-mono"
                value={formData.loginUid}
                onChange={(e) => setFormData({...formData, loginUid: e.target.value.replace(/\s/g, '')})}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Email (Optional)</Label>
              <Badge variant="outline" className="text-[8px] h-4 py-0 border-primary/20 text-primary">RECOMMENDED</Badge>
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="you@example.com"
                className="pl-10 rounded-xl h-10 bg-muted/30"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="flex items-start gap-1.5 p-2 rounded-lg bg-primary/5 border border-primary/10 mt-1">
              <Info className="w-3 h-3 text-primary shrink-0 mt-0.5" />
              <p className="text-[9px] text-muted-foreground leading-tight">
                Recommended for password recovery and receiving automated digital reports directly in your inbox.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Current Class</Label>
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
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Stream</Label>
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
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Passcode</Label>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  placeholder="Min 6 chars"
                  className="rounded-xl h-10 bg-muted/30 pr-10"
                  value={formData.passcode}
                  onChange={(e) => setFormData({...formData, passcode: e.target.value})}
                  required
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 top-1 h-8 w-8 text-muted-foreground"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Confirm</Label>
              <Input
                type={showPass ? "text" : "password"}
                className="rounded-xl h-10 bg-muted/30"
                value={formData.confirmPasscode}
                onChange={(e) => setFormData({...formData, confirmPasscode: e.target.value})}
                required
              />
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full h-11 text-lg font-bold rounded-xl mt-2" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {loading ? 'Authenticating...' : 'Complete Registration'}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Member already?{' '}
          <Link href="/auth/login" className="text-primary font-bold hover:underline">
            Login Now
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
