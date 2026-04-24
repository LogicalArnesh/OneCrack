import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, GraduationCap, ClipboardList } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
            <ShieldCheck className="w-4 h-4" />
            Secure Test Portal
          </div>
          <h1 className="text-6xl md:text-7xl font-headline font-bold tracking-tight text-foreground">
            OneCrack <span className="text-primary">Test Portal</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-body">
            Empowering students with precise evaluation, real-time analytics, and AI-driven insights for competitive exam success.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-headline font-semibold">Dynamic Tests</h3>
            <p className="text-sm text-muted-foreground">Comprehensive test platform with real-time tracking and navigation.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-headline font-semibold">Secure Authentication</h3>
            <p className="text-sm text-muted-foreground">Login with your unique Test UID and passcode. No email required to start.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-headline font-semibold">Detailed Reports</h3>
            <p className="text-sm text-muted-foreground">Professional performance analysis with subject-wise breakdown and charts.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="h-14 px-8 text-lg font-semibold rounded-xl">
            <Link href="/auth/login">Access Portal</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg font-semibold rounded-xl border-primary/20 hover:bg-primary/5">
            <Link href="/auth/register">New Registration</Link>
          </Button>
        </div>

        <footer className="pt-12 text-sm text-muted-foreground space-y-2">
          <p>&copy; {new Date().getFullYear()} OneCrack Test Portal. All rights reserved.</p>
          <p className="text-xs">This is an automatically generated platform for educational purposes.</p>
        </footer>
      </div>
    </div>
  );
}
