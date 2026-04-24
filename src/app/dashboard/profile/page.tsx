"use client";

import React, { useState } from 'react';
import PortalLayout from '@/components/dashboard/PortalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { store } from '@/lib/store';
import { Lock, User as UserIcon, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const user = store.getCurrentUser();
  const { toast } = useToast();
  
  const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });
  const [uidData, setUidData] = useState({ currentPass: '', newUid: '' });
  const [error, setError] = useState('');

  const handlePassChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');

    if (passData.current !== user.passcode) {
      setError('Current passcode is incorrect.');
      return;
    }
    if (passData.new !== passData.confirm) {
      setError('New passcodes do not match.');
      return;
    }

    const updated = { ...user, passcode: passData.new };
    store.updateUser(updated);
    store.setCurrentUser(updated);
    
    toast({
      title: "Passcode Updated",
      description: "Your security credentials have been successfully updated.",
    });
    setPassData({ current: '', new: '', confirm: '' });
  };

  const handleUidChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');

    if (uidData.currentPass !== user.passcode) {
      setError('Incorrect passcode to verify UID change.');
      return;
    }

    const updated = { ...user, uid: uidData.newUid };
    store.updateUser(updated);
    store.setCurrentUser(updated);

    toast({
      title: "UID Updated",
      description: "Your Test Login UID has been changed.",
    });
    setUidData({ currentPass: '', newUid: '' });
  };

  if (!user) return null;

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
              <CardTitle className="font-headline">Change Passcode</CardTitle>
              <CardDescription>Update your secure 4-6 digit passcode</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePassChange} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-muted-foreground">Current Passcode</Label>
                  <Input 
                    type="password" 
                    className="rounded-xl bg-muted/30"
                    value={passData.current}
                    onChange={(e) => setPassData({...passData, current: e.target.value})}
                    required
                  />
                </div>
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
                <Button type="submit" className="w-full rounded-xl mt-2 font-bold">Update Passcode</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border bg-card">
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent mb-2">
                <UserIcon className="w-5 h-5" />
              </div>
              <CardTitle className="font-headline">Update Login UID</CardTitle>
              <CardDescription>Current UID: <span className="text-accent font-bold">{user.uid}</span></CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUidChange} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-muted-foreground">New Test UID</Label>
                  <Input 
                    className="rounded-xl bg-muted/30"
                    value={uidData.newUid}
                    onChange={(e) => setUidData({...uidData, newUid: e.target.value})}
                    placeholder="Enter new UID"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-muted-foreground">Verify with Passcode</Label>
                  <Input 
                    type="password" 
                    className="rounded-xl bg-muted/30"
                    value={uidData.currentPass}
                    onChange={(e) => setUidData({...uidData, currentPass: e.target.value})}
                    placeholder="Current passcode"
                    required
                  />
                </div>
                <Button type="submit" variant="outline" className="w-full rounded-xl border-accent/30 text-accent hover:bg-accent/5 mt-2 font-bold">Change UID</Button>
              </form>
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
               <p className="text-[10px] uppercase font-bold text-muted-foreground">Account Name</p>
               <p className="font-bold">{user.name}</p>
             </div>
             <div className="space-y-1">
               <p className="text-[10px] uppercase font-bold text-muted-foreground">Class Level</p>
               <p className="font-bold">Class {user.classLevel}</p>
             </div>
             <div className="space-y-1">
               <p className="text-[10px] uppercase font-bold text-muted-foreground">Registered Email</p>
               <p className="font-bold">{user.email || 'Not Provided'}</p>
             </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
