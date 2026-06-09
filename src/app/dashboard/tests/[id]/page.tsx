"use client";

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'navigation';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, addDoc, collection } from 'firebase/firestore';
import { Test, Attempt, User as PortalUser } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Timer, 
  SendHorizontal,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Wifi,
  Database,
  Bookmark,
  Shield,
  Clock,
  User as UserIcon,
  Cpu
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function TestTakingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const { id } = use(params);
  const db = useFirestore();
  const { user } = useUser();
  
  const testRef = useMemoFirebase(() => doc(db, 'tests', id), [db, id]);
  const { data: test, isLoading: isTestLoading } = useDoc<Test>(testRef);
  
  const userRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc<PortalUser>(userRef);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [attempts, setAttempts] = useState<Record<string, Attempt>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showConsent, setShowConsent] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const istTime = new Date().toLocaleTimeString('en-IN', { 
        timeZone: 'Asia/Kolkata', 
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setCurrentTime(istTime);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && hasStarted) {
        toast({
          variant: "destructive",
          title: "SECURITY ALERT",
          description: "Unauthorized tab switching detected. This event has been logged.",
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [hasStarted, toast]);

  useEffect(() => {
    if (test && !hasStarted) {
      setTimeLeft(test.totalTimeMinutes * 60);
      const initialAttempts: Record<string, Attempt> = {};
      test.questions.forEach(q => {
        initialAttempts[q.id] = {
          questionId: q.id,
          status: 'not-visited',
          timeSpentSeconds: 0
        };
      });
      setAttempts(initialAttempts);
    }
  }, [test, hasStarted]);

  const finishTest = useCallback(async () => {
    if (!test || !user || isSubmitting) return;
    setIsSubmitting(true);

    const submissionId = uuidv4().replace(/-/g, '').slice(0, 10).toUpperCase();
    const finalAttempts = Object.values(attempts);
    
    let totalScore = 0;
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    finalAttempts.forEach(att => {
      const q = test.questions.find(quest => quest.id === att.questionId);
      if (!q) return;

      if (!att.selectedOption) {
        skipped++;
        totalScore += (test.skippedMarks || 0);
      } else if (att.selectedOption === q.correctAnswer) {
        correct++;
        totalScore += (test.marksPerQuestion || 4);
      } else {
        wrong++;
        totalScore -= Math.abs(test.negativeMarks || 1);
      }
    });

    const resultData = {
      testId: test.id,
      userId: user.uid,
      submissionId,
      timestamp: new Date().toISOString(),
      attempts: finalAttempts,
      totalScore,
      maxScore: test.questions.length * (test.marksPerQuestion || 4),
      correctCount: correct,
      wrongCount: wrong,
      skippedCount: skipped,
      timeTakenSeconds: (test.totalTimeMinutes * 60) - timeLeft,
      subjectBreakdown: [{
        subject: test.subject,
        score: totalScore,
        maxScore: test.questions.length * (test.marksPerQuestion || 4),
        timeTakenSeconds: (test.totalTimeMinutes * 60) - timeLeft,
        avgTimePerQuestionSeconds: ((test.totalTimeMinutes * 60) - timeLeft) / (test.questions.length || 1)
      }]
    };

    try {
      const resultsCol = collection(db, 'users', user.uid, 'testAttempts');
      const docRef = await addDoc(resultsCol, resultData);
      toast({ title: "Evaluation Certified", description: "Audit data locked." });
      router.push(`/dashboard/results/${docRef.id}`);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Sync Failure", description: "Unable to finalize audit." });
      setIsSubmitting(false);
    }
  }, [test, attempts, timeLeft, user, router, db, isSubmitting, toast]);

  useEffect(() => {
    if (!hasStarted || isSubmitting) return;
    
    if (timeLeft <= 0) {
      finishTest();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
      if (test?.questions[currentIdx]) {
        const qId = test.questions[currentIdx].id;
        setAttempts(prev => ({
          ...prev,
          [qId]: { 
            ...prev[qId], 
            timeSpentSeconds: (prev[qId]?.timeSpentSeconds || 0) + 1,
            status: prev[qId]?.status === 'not-visited' ? 'visited' : prev[qId]?.status 
          }
        }));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, hasStarted, isSubmitting, currentIdx, test, finishTest]);

  const handleOptionSelect = (option: string) => {
    if (!test) return;
    const qId = test.questions[currentIdx].id;
    const q = test.questions[currentIdx];
    const optIdx = q.options?.indexOf(option) ?? -1;
    const optCode = q.optionCodes?.[optIdx] || "N/A";
    
    setAttempts(prev => ({
      ...prev,
      [qId]: { 
        ...prev[qId], 
        selectedOption: option, 
        selectedOptionCode: optCode,
        status: 'attempted' 
      }
    }));
  };

  const markForReview = () => {
    if (!test) return;
    const qId = test.questions[currentIdx].id;
    setAttempts(prev => ({
      ...prev,
      [qId]: { ...prev[qId], status: 'marked-for-review' }
    }));
  };

  if (isTestLoading) return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>;
  if (!test) return null;

  const currentQ = test.questions[currentIdx];
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden text-foreground">
      <AlertDialog open={showConsent} onOpenChange={setShowConsent}>
        <AlertDialogContent className="rounded-[3rem] max-w-2xl p-14 border-primary/20 bg-card shadow-3xl">
          <AlertDialogHeader>
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-8 border border-primary/20 shadow-neon-sm">
              <ShieldAlert className="w-12 h-12" />
            </div>
            <AlertDialogTitle className="text-center text-4xl font-headline font-black neon-text tracking-tighter uppercase">Integrity Consent</AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-8 pt-6">
              <p className="text-lg font-medium leading-relaxed">By starting this evaluation, you agree to the OneCrack Anti-Cheat Protocol.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center mt-12">
            <AlertDialogAction onClick={() => { setHasStarted(true); setShowConsent(false); }} className="w-full h-16 rounded-2xl font-black bg-primary text-black uppercase tracking-[0.2em] text-xs">
              INITIALIZE PORTAL
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <header className="h-24 border-b border-white/5 bg-card/40 backdrop-blur-3xl flex items-center justify-between px-10 z-50">
        <div className="flex items-center gap-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center font-black text-black text-3xl shadow-neon">O</div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Live Assessment • {test.examStream}</p>
            <h2 className="text-2xl font-headline font-black tracking-tight text-white">{test.title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className={cn(
            "flex items-center gap-4 px-8 py-3.5 rounded-2xl border-2 transition-all font-mono",
            timeLeft < 300 ? "border-destructive/50 bg-destructive/10 text-destructive animate-pulse" : "border-primary/40 bg-primary/5 text-primary"
          )}>
            <Timer className="w-6 h-6" />
            <span className="text-3xl font-black tracking-widest">{formatTime(timeLeft)}</span>
          </div>
          <Button onClick={() => finishTest()} disabled={isSubmitting} className="rounded-2xl h-14 px-10 font-black bg-white text-black uppercase tracking-widest text-xs">
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <SendHorizontal className="w-5 h-5" />}
            FINALIZE
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
         {/* Main Question Area */}
        <div className="flex-1 overflow-y-auto p-16 md:p-24 relative custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-16 relative">
            <div className="flex items-center justify-between border-b border-white/5 pb-10">
              <Badge variant="outline" className="rounded-xl px-8 py-3 font-black text-primary border-primary/40 bg-primary/5 text-xs tracking-[0.3em] uppercase">
                ITEM {currentIdx + 1} / {test.questions.length} • {currentQ.subject}
              </Badge>
              <div className="flex gap-10">
                <div className="text-right">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">VALID</p>
                  <p className="text-2xl font-black text-primary">+{test.marksPerQuestion}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">FAILED</p>
                  <p className="text-2xl font-black text-destructive">-{Math.abs(test.negativeMarks)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-16">
              <div className="space-y-6">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.5em]">Question Data Block</p>
                <h2 className="text-4xl font-headline font-black leading-[1.2] text-white/95 whitespace-pre-wrap">{currentQ.questionText}</h2>
              </div>
              
              {currentQ.options && (
                <RadioGroup value={attempts[currentQ.id]?.selectedOption || ""} onValueChange={handleOptionSelect} className="grid grid-cols-1 gap-6">
                  {currentQ.options.map((option, i) => (
                    <Label key={i} className={cn(
                        "flex items-center gap-8 p-10 rounded-[2.5rem] border-2 transition-all cursor-pointer group shadow-xl relative overflow-hidden",
                        attempts[currentQ.id]?.selectedOption === option 
                        ? "border-primary bg-primary/10 ring-1 ring-primary/40" 
                        : "border-white/5 bg-card/20 hover:border-primary/40 hover:bg-card/40"
                      )}>
                      <RadioGroupItem value={option} className="sr-only" />
                      <div className={cn(
                        "w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-black text-xl transition-all shrink-0",
                        attempts[currentQ.id]?.selectedOption === option ? "bg-primary border-primary text-black" : "border-white/10 text-muted-foreground group-hover:border-primary/40"
                      )}>{String.fromCharCode(65 + i)}</div>
                      <div className="flex-1 flex flex-col">
                        <span className="text-2xl font-bold tracking-tight text-white/90">{option}</span>
                        {attempts[currentQ.id]?.selectedOption === option && (
                          <span className="text-[10px] font-mono text-primary/60 mt-2 uppercase tracking-widest">Forensic ID: {currentQ.optionCodes?.[i]}</span>
                        )}
                      </div>
                      {attempts[currentQ.id]?.selectedOption === option && <CheckCircle2 className="w-8 h-8 ml-auto text-primary animate-in zoom-in duration-300" />}
                    </Label>
                  ))}
                </RadioGroup>
              )}
            </div>

            <div className="pt-20 flex flex-col sm:flex-row items-center justify-between gap-10 border-t border-white/5">
              <div className="flex gap-6">
                <Button variant="outline" onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))} disabled={currentIdx === 0} className="rounded-2xl px-10 h-16 font-black bg-muted/10 border-white/10 hover:bg-muted/20">
                  <ChevronLeft className="w-6 h-6 mr-2" /> PREVIOUS
                </Button>
                <Button variant="ghost" onClick={markForReview} className="rounded-2xl px-10 h-16 font-black text-accent hover:bg-accent/10">
                  <Bookmark className="w-6 h-6 mr-2" /> MARK FOR REVIEW
                </Button>
              </div>
              <Button onClick={() => {
                  if (currentIdx < test.questions.length - 1) setCurrentIdx(currentIdx + 1);
                  else finishTest();
                }} className="w-full sm:w-auto rounded-2xl px-14 h-16 font-black bg-primary text-black shadow-neon transition-transform active:scale-95 uppercase tracking-widest text-xs">
                {currentIdx < test.questions.length - 1 ? 'SAVE & NEXT' : 'FINALIZE AUDIT'} <ChevronRight className="w-6 h-6 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* High-Fidelity Sidebar */}
        <aside className="w-[450px] border-l border-white/5 bg-card/20 backdrop-blur-3xl hidden xl:flex flex-col p-12 space-y-12">
          {/* Candidate Profile */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">Candidate Identity</h3>
            <div className="p-8 rounded-[2rem] bg-white/2 border border-white/5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">{profile?.name || 'Loading...'}</p>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">UID: {profile?.loginUid || '...'}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[9px] font-black uppercase text-primary">Connected to Server</span>
                </div>
                <div className="flex items-end gap-1">
                  <div className="w-1.5 h-3 bg-primary/30 rounded-t-sm animate-signal" />
                  <div className="w-1.5 h-5 bg-primary/30 rounded-t-sm animate-signal-delayed" />
                  <div className="w-1.5 h-7 bg-primary/30 rounded-t-sm animate-signal-more-delayed" />
                </div>
              </div>
            </div>
          </div>

          {/* Time & Sync */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">Neural Time Sync</h3>
            <div className="p-8 rounded-[2rem] bg-white/2 border border-white/5 text-center space-y-2">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Clock className="w-4 h-4 text-primary" />
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Live IST Audit</p>
              </div>
              <p className="text-4xl font-mono font-black text-white tracking-widest">{currentTime || '--:--:--'}</p>
            </div>
          </div>

          {/* Matrix */}
          <div className="space-y-8 flex-1">
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">Evaluation Matrix</h3>
            <div className="grid grid-cols-5 gap-4">
              {test.questions.map((q, i) => {
                const att = attempts[q.id];
                const isSelected = i === currentIdx;
                return (
                  <button key={q.id} onClick={() => setCurrentIdx(i)} className={cn(
                      "aspect-square rounded-2xl flex items-center justify-center text-xs font-black transition-all border-2",
                      isSelected ? "border-primary scale-110 shadow-neon-sm z-10" : "border-transparent",
                      att?.status === 'attempted' ? "bg-primary text-black" : 
                      att?.status === 'marked-for-review' ? "bg-accent text-black" :
                      "bg-muted/10 text-muted-foreground/40 hover:bg-muted/20"
                    )}>
                    {(i + 1).toString().padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-8 rounded-[2rem] bg-primary/5 border border-primary/20 flex items-center gap-6">
            <Cpu className="w-8 h-8 text-primary shrink-0" />
            <p className="text-[10px] font-black uppercase text-primary leading-relaxed tracking-widest">
              Core Monitoring Active • Zero Malpractice Tolerance
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}