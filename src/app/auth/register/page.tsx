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
import { store } from '@/lib/store';
import { ClassLevel, Subject, User } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { User as UserIcon, Lock, Mail, GraduationCap, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    uid: '',
    passcode: '',
    confirmPasscode: '',
    classLevel: '' as ClassLevel,
    subjectPreference: '' as Subject,
    email: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.passcode !== formData.confirmPasscode) {
      setError('Passcodes do not match.');
      setLoading(false);
      return;
    }

    const users = store.getUsers();
    if (users.some(u => u.uid === formData.uid)) {
      setError('This UID is already taken. Please choose another.');
      setLoading(false);
      return;
    }

    const newUser: User = {
      id: uuidv4(),
      name: formData.name,
      uid: formData.uid,
      passcode: formData.passcode,
      classLevel: formData.classLevel,
      subjectPreference: (formData.classLevel === '11' || formData.classLevel === '12') ? formData.subjectPreference : undefined,
      email: formData.email || undefined,
      isAdmin: false
    };

    store.saveUser(newUser);
    setSuccess(true);
    setTimeout(() => {
      router.push('/auth/login');
    }, 2000);
  };

  if (success) {
    return (
      <AuthLayout title="Registration Successful">
        <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <p className="text-lg font-body text-muted-foreground">
            Data stored successfully in the database. 
            {formData.email && " A confirmation email from OneCrack TestPortal has been sent to you."}
          </p>
          <p className="text-sm text-muted-foreground italic">Redirecting to login...</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create Account" subtitle="Register for the OneCrack Test Portal">
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="uid" className="text-xs uppercase font-bold text-muted-foreground">Test Login UID</Label>
              <Input
                id="uid"
                placeholder="Choose UID"
                className="rounded-xl h-10 bg-muted/30"
                value={formData.uid}
                onChange={(e) => setFormData({...formData, uid: e.target.value})}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="class" className="text-xs uppercase font-bold text-muted-foreground">Current Class</Label>
              <Select onValueChange={(v) => setFormData({...formData, classLevel: v as ClassLevel})}>
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
          </div>

          {(formData.classLevel === '11' || formData.classLevel === '12') && (
            <div className="space-y-1">
              <Label className="text-xs uppercase font-bold text-muted-foreground">Subject Stream</Label>
              <Select onValueChange={(v) => setFormData({...formData, subjectPreference: v as Subject})}>
                <SelectTrigger className="rounded-xl h-10 bg-muted/30">
                  <SelectValue placeholder="Select Stream" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Biology">Biology</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Both">Both (Math & Bio)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="pass" className="text-xs uppercase font-bold text-muted-foreground">Passcode</Label>
              <Input
                id="pass"
                type="password"
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

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="email" className="text-xs uppercase font-bold text-muted-foreground">Email (Recommended)</Label>
              <span className="text-[10px] text-accent">Optional</span>
            </div>
            <Input
              id="email"
              type="email"
              placeholder="For recovery and results"
              className="rounded-xl h-10 bg-muted/30"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Without email, data recovery requires contacting the admin.
            </p>
          </div>
        </div>

        <Button type="submit" className="w-full h-11 text-lg font-semibold rounded-xl mt-4" disabled={loading}>
          {loading ? 'Processing...' : 'Complete Registration'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary font-semibold hover:underline">
            Login here
          </Link>
        </p>

        <div className="pt-4 border-t border-border text-[9px] text-center text-muted-foreground uppercase tracking-widest leading-relaxed">
          Autogenerated • Copyright Reserved • Privacy Guaranteed
        </div>
      </form>
    </AuthLayout>
  );
}
