import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, GraduationCap, ClipboardList, Activity, Zap, Cpu } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />
      
      <div className="max-w-6xl w-full text-center space-y-16 relative z-10">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-primary/5 border border-primary/20 text-primary text-xs font-black uppercase tracking-[0.3em] neon-glow">
            <ShieldCheck className="w-4 h-4" />
            High-Integrity Testing Environment
          </div>
          <h1 className="text-7xl md:text-9xl font-headline font-black tracking-tighter text-white leading-tight">
            OneCrack <br /> <span className="text-primary neon-text">Test Portal</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
            The professional standard for competitive evaluation. Real-time neural analytics, AI-driven study roadmaps, and JEE-Advanced standard simulation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Cpu, title: 'AI Neural Insights', desc: 'Automated extraction and pedagogical feedback powered by advanced LLM models.', color: 'text-primary' },
            { icon: Activity, title: 'Live Analytics', desc: 'Real-time precision tracking, temporal flow analysis, and global percentile ranking.', color: 'text-accent' },
            { icon: Zap, title: 'JEE-Adv Simulation', desc: 'Professional examination interface with strict integrity monitoring and anti-malpractice protocols.', color: 'text-white' }
          ].map((feature, i) => (
            <div key={i} className="p-10 rounded-[2.5rem] bg-card/40 border border-border space-y-6 text-left hover:border-primary/40 transition-all duration-500 group">
              <div className={cn("w-16 h-16 rounded-[1.5rem] bg-muted/20 flex items-center justify-center transition-transform group-hover:scale-110", feature.color)}>
                <feature.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-headline font-bold text-white tracking-tight">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
          <Button asChild size="lg" className="h-16 px-12 text-sm font-black uppercase tracking-[0.2em] rounded-2xl bg-primary text-black shadow-neon transition-transform active:scale-95">
            <Link href="/auth/login">ACCESS DASHBOARD</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-16 px-12 text-sm font-black uppercase tracking-[0.2em] rounded-2xl border-primary/20 hover:bg-primary/5 hover:border-primary/50 text-primary transition-all">
            <Link href="/auth/register">ESTABLISH IDENTITY</Link>
          </Button>
        </div>

        <footer className="pt-24 text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/50 space-y-4">
          <div className="flex items-center justify-center gap-6">
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> ENCRYPTED</span>
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> LIVE SYNC</span>
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> AI AUDIT</span>
          </div>
          <p>&copy; {new Date().getFullYear()} OneCrack Core System. Integrity Verified.</p>
        </footer>
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';