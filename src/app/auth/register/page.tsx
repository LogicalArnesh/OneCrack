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
import { CheckCircle2, Loader2, Eye, EyeOff, Info, Mail, UserCircle, ShieldCheck } from 'lucide-react';
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

    const cleanUid = formData.loginUid.trim().toLowerCase();

    if (formData.passcode !== formData.confirmPasscode) {
      setError('Passcodes do not match.');
      setLoading(false);
      return;
    }

    if (cleanUid.length < 3) {
      setError('UID must be at least 3 characters.');
      setLoading(false);
      return;
    }

    if (cleanUid === 'admin') {
      setError('This UID is reserved for system use.');
      setLoading(false);
      return;
    }

    try {
      const authEmail = `${cleanUid}@onecrack.internal`;
      const userCredential = await createUserWithEmailAndPassword(auth, authEmail, formData.passcode);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        name: formData.name,
        email: formData.email || null,
        loginUid: cleanUid,
        classLevel: formData.classLevel,
        subjectPreference: formData.subjectPreference || 'General',
        registrationDate: new Date().toISOString(),
      });

      if (formData.email) {
        try {
          await sendWelcomeEmail(
            formData.email, 
            formData.name, 
            cleanUid, 
            formData.classLevel, 
            formData.subjectPreference || 'General'
          );
        } catch (emailErr) {
          console.warn("Welcome email could not be sent.", emailErr);
        }
      }

      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This UID is already assigned. Please choose another unique identifier.');
      } else {
        setError(err.message || 'Identity verification failed.');
      }
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="ID VERIFIED" subtitle="Redirecting to central command">
        <div className="flex flex-col items-center justify-center space-y-6 py-12 text-center">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary border-4 border-primary/20 shadow-neon animate-pulse">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <p className="text-2xl font-headline font-bold neon-text">Profile Synced</p>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Initialising Dashboard...</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="ESTABLISH IDENTITY" subtitle="Create your professional testing credentials">
      <form onSubmit={handleRegister} className="space-y-6">
        {error && (
          <Alert variant="destructive" className="rounded-2xl border-destructive/50 bg-destructive/10">
            <AlertDescription className="font-bold text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-black tracking-widest text-primary">Full Legal Name</Label>
            <Input
              placeholder="Ex: Alexander Pierce"
              className="rounded-xl h-12 bg-muted/20 border-border focus:border-primary/50 transition-all"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-black tracking-widest text-primary">Custom Unique ID (UID)</Label>
            <div className="relative">
              <UserCircle className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Ex: onecrack_pioneer"
                className="pl-12 rounded-xl h-12 bg-muted/20 border-border font-mono font-bold"
                value={formData.loginUid}
                onChange={(e) => setFormData({...formData, loginUid: e.target.value.replace(/\s/g, '')})}
                required
              />
            </div>
            <p className="text-[9px] text-muted-foreground mt-2 px-1 font-bold">Choosing a permanent, memorable ID is crucial for login access.</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase font-black tracking-widest text-primary">Personal Email</Label>
              <Badge variant="outline" className="text-[8px] h-5 py-0 border-primary/30 text-primary uppercase font-black">Highly Recommended</Badge>
            </div>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="you@example.com"
                className="pl-12 rounded-xl h-12 bg-muted/20 border-border"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-primary/5 border border-primary/20 mt-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[9px] text-muted-foreground leading-relaxed font-medium">
                Email is required to dispatch <span className="text-white">Professional Performance Reports</span> and <span className="text-white">AI Study Roadmaps</span>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-primary">Academic Class</Label>
              <Select onValueChange={(v) => setFormData({...formData, classLevel: v as ClassLevel})} required>
                <SelectTrigger className="rounded-xl h-12 bg-muted/20 border-border">
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
             <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-primary">Subject Stream</Label>
              <Select onValueChange={(v) => setFormData({...formData, subjectPreference: v as Subject})}>
                <SelectTrigger className="rounded-xl h-12 bg-muted/20 border-border">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Biology">Biology</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Both">Both (PCM/B)</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-primary">Secure Passcode</Label>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  placeholder="6+ characters"
                  className="rounded-xl h-12 bg-muted/20 border-border pr-12 font-mono"
                  value={formData.passcode}
                  onChange={(e) => setFormData({...formData, passcode: e.target.value})}
                  required
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1.5 top-1.5 h-9 w-9 text-muted-foreground hover:bg-transparent"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-primary">Verify Code</Label>
              <Input
                type={showPass ? "text" : "password"}
                className="rounded-xl h-12 bg-muted/20 border-border font-mono"
                value={formData.confirmPasscode}
                onChange={(e) => setFormData({...formData, confirmPasscode: e.target.value})}
                required
              />
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full h-14 text-sm font-black uppercase tracking-[0.2em] rounded-2xl mt-4 bg-primary text-black shadow-neon transition-transform active:scale-95" disabled={loading}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <ShieldCheck className="w-5 h-5 mr-3" />}
          ESTABLISH IDENTITY
        </Button>

        <p className="text-center text-xs text-muted-foreground font-bold uppercase tracking-widest">
          SYNCED ALREADY?{' '}
          <Link href="/auth/login" className="text-primary hover:underline">
            ACCESS COMMAND
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}