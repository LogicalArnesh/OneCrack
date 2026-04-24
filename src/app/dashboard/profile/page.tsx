
"use client";

import React, { useState } from 'react';
import PortalLayout from '@/components/dashboard/PortalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFirestore, useUser, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { User as PortalUser } from '@/lib/types';
import { Lock, User as UserIcon, ShieldCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  
  const profileRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile, isLoading } = useDoc<PortalUser>(profileRef);

  const [passData, setPassData] = useState({ new: '', confirm: '' });
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const handlePassChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setError('');

    if (passData.new.length < 6) {
      setError('Passcode must be at least 6 characters.');
      return;
    }
    if (passData.new !== passData.confirm) {
      setError('Passcodes do not match.');
      return;
    }

    setUpdating(true);
    try {
      await updatePassword(auth.currentUser, passData.new);
      toast({
        title: "Passcode Updated",
        description: "Your security credentials have been successfully updated.",
      });
      setPassData({ new: '', confirm: '' });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update passcode. You may need to log in again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleProfileUpdate = async (name: string) => {
    if (!user || !profileRef) return;
    setUpdating(true);
    try {
      await updateDoc(profileRef, { name });
      toast({ title: "Profile Updated", description: "Your details have been saved." });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Update Failed", description: "Database error." });
    } finally {
      setUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PortalLayout>
    );
  }

  if (!profile) return null;

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-headline font-bold">Profile & Security</h1>
          <p className="text-muted-foreground">Manage your credentials and view your portal profile.</p>
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="rounded-3xl border-border bg-card">
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary mb-2">
                <Lock className="w-5 h-5" />
              </div>
              <CardTitle className="font-headline">Update Passcode</CardTitle>
              <CardDescription>Secure your account with a new 6+ digit code</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePassChange} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-muted-foreground">New Passcode</Label>
                  <Input 
                    type="password" 
                    className="rounded-xl bg-muted/30"
                    value={passData.new}
                    onChange={(e) => setPassData({...passData, new: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-muted-foreground">Confirm New Passcode</Label>
                  <Input 
                    type="password" 
                    className="rounded-xl bg-muted/30"
                    value={passData.confirm}
                    onChange={(e) => setPassData({...passData, confirm: e.target.value})}
                    required
                  />
                </div>
                <Button type="submit" disabled={updating} className="w-full rounded-xl mt-2 font-bold">
                  {updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Update Passcode
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border bg-card">
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent mb-2">
                <UserIcon className="w-5 h-5" />
              </div>
              <CardTitle className="font-headline">Identity Info</CardTitle>
              <CardDescription>Your unique portal login identifier</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Test Login UID</p>
                <div className="p-3 rounded-xl bg-muted/50 border border-border font-mono font-bold text-accent">
                  {profile.loginUid}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Display Name</p>
                <Input 
                  defaultValue={profile.name} 
                  className="rounded-xl bg-muted/30"
                  onBlur={(e) => {
                    if (e.target.value !== profile.name) handleProfileUpdate(e.target.value);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-3xl border-border bg-card/50">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="font-headline">Identity Verified</CardTitle>
              <CardDescription>Information registered with the portal</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6">
             <div className="space-y-1">
               <p className="text-[10px] uppercase font-bold text-muted-foreground">Class Level</p>
               <p className="font-bold">Class {profile.classLevel}</p>
             </div>
             <div className="space-y-1">
               <p className="text-[10px] uppercase font-bold text-muted-foreground">Stream</p>
               <p className="font-bold">{profile.subjectPreference || 'General'}</p>
             </div>
             <div className="space-y-1">
               <p className="text-[10px] uppercase font-bold text-muted-foreground">Registered Email</p>
               <p className="font-bold">{profile.email || 'Not Provided'}</p>
             </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
