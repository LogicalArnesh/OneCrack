
"use client";

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, addDoc, collection } from 'firebase/firestore';
import { Test, Question, Attempt, TestResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Timer, 
  User as UserIcon, 
  Bookmark, 
  AlertCircle,
  HelpCircle,
  SendHorizontal,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2
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

  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [attempts, setAttempts] = useState<Record<string, Attempt>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showConsent, setShowConsent] = useState(true);

  useEffect(() => {
    if (test) {
      setTimeLeft(test.totalTimeMinutes * 60);
      const initialAttempts: Record<string, Attempt> = {};
      test.questions.forEach(q => {
        initialAttempts[q.id] = {
          questionId: q.id,
          status: 'not-visited',
          timeTakenSeconds: 0
        };
      });
      setAttempts(initialAttempts);
    }
  }, [test]);

  useEffect(() => {
    if (!hasStarted) return;
    if (timeLeft <= 0) {
      finishTest();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, hasStarted]);

  const handleOptionSelect = (option: string) => {
    if (!test) return;
    const qId = test.questions[currentIdx].id;
    setAttempts(prev => ({
      ...prev,
      [qId]: { ...prev[qId], selectedOption: option, status: 'attempted' }
    }));
  };

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

    const result: Omit<TestResult, 'id'> = {
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
      const docRef = await addDoc(resultsCol, result);
      toast({ title: "Evaluation Finalized", description: "Your answers have been cryptographically verified." });
      router.push(`/dashboard/results/${docRef.id}`);
    } catch (err) {
      toast({ variant: "destructive", title: "Persistence Error", description: "Cloud sync failed." });
      setIsSubmitting(false);
    }
  }, [test, attempts, timeLeft, user, router, db, isSubmitting]);

  if (isTestLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  if (!test) return <div className="h-screen flex flex-col items-center justify-center gap-4"><AlertCircle className="text-destructive" /><p>Test not found.</p></div>;

  const currentQ = test.questions[currentIdx];
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Malpractice Consent Modal */}
      <AlertDialog open={showConsent} onOpenChange={setShowConsent}>
        <AlertDialogContent className="rounded-[2rem] max-w-xl p-10 border-destructive/20 bg-card">
          <AlertDialogHeader>
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mx-auto mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <AlertDialogTitle className="text-center text-2xl font-headline font-bold">Anti-Malpractice Agreement</AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-4 pt-2">
              <p className="font-medium text-foreground">
                By clicking "Agree & Proceed", you confirm that you will not use any unfair means, including but not limited to:
              </p>
              <ul className="text-xs text-left space-y-2 list-disc pl-8">
                <li>Referring to external documents, books, or web pages.</li>
                <li>Communicating with anyone during the session.</li>
                <li>Using mobile devices or calculators unless authorized.</li>
              </ul>
              <p className="text-xs font-bold text-destructive uppercase tracking-widest mt-4">
                Any violation will result in immediate disqualification and permanent ban from OneCrack.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center mt-6">
            <AlertDialogAction onClick={() => { setHasStarted(true); setShowConsent(false); }} className="w-full h-12 rounded-xl font-bold bg-destructive hover:bg-destructive/90 text-white">
              Agree & Start Evaluation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center font-bold text-white shadow-lg">O</div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold uppercase tracking-widest">{test.title}</h1>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold">
              <Badge variant="secondary" className="px-1.5 h-4 text-[8px] bg-primary/10 text-primary">{test.subject}</Badge>
              <span>Class {test.classLevel}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all font-mono",
            timeLeft < 300 ? "border-destructive/50 bg-destructive/10 text-destructive animate-pulse" : "border-primary/20 bg-primary/5 text-primary"
          )}>
            <Timer className="w-5 h-5" />
            <span className="text-lg font-black">{formatTime(timeLeft)}</span>
          </div>
          <Button 
            onClick={() => { if(confirm("Confirm test finalization? All answers will be locked.")) finishTest(); }} 
            disabled={isSubmitting}
            className="rounded-xl font-bold bg-foreground text-background hover:bg-foreground/90 px-6 gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
            Finalize
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-10 relative">
          <div className="max-w-3xl mx-auto space-y-10">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="rounded-xl px-4 py-1 font-bold text-primary border-primary/20 bg-primary/5">
                Item {currentIdx + 1} of {test.questions.length}
              </Badge>
              <div className="flex gap-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Correct: <span className="text-primary">+{test.marksPerQuestion}</span></span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Wrong: <span className="text-destructive">-{Math.abs(test.negativeMarks)}</span></span>
              </div>
            </div>

            <div className="space-y-8">
              <h2 className="text-2xl font-headline font-bold leading-snug text-foreground/90">
                {currentQ.questionText}
              </h2>

              {currentQ.imageIncluded && (
                <div className="aspect-video w-full rounded-[2rem] bg-muted/30 border border-border flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent z-10" />
                  <img src={`https://picsum.photos/seed/${currentQ.id}/800/450`} alt="Question reference" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="z-20 p-4 absolute bottom-0 right-0">
                    <Badge className="bg-black/60 backdrop-blur-md text-[8px] font-bold uppercase">Fig Ref: {currentQ.id.slice(0,4)}</Badge>
                  </div>
                </div>
              )}

              {currentQ.options && (
                <RadioGroup 
                  value={attempts[currentQ.id]?.selectedOption || ""} 
                  onValueChange={handleOptionSelect}
                  className="grid grid-cols-1 gap-4"
                >
                  {currentQ.options.map((option, i) => (
                    <Label
                      key={i}
                      className={cn(
                        "flex items-center gap-4 p-6 rounded-[1.5rem] border-2 transition-all cursor-pointer group shadow-sm",
                        attempts[currentQ.id]?.selectedOption === option
                          ? "border-primary bg-primary/5 shadow-primary/5"
                          : "border-border bg-card/50 hover:border-primary/20 hover:bg-muted/30"
                      )}
                    >
                      <RadioGroupItem value={option} className="sr-only" />
                      <div className={cn(
                        "w-10 h-10 rounded-xl border-2 flex items-center justify-center font-black text-sm transition-all",
                        attempts[currentQ.id]?.selectedOption === option
                          ? "bg-primary border-primary text-white"
                          : "border-border text-muted-foreground group-hover:border-primary/50 group-hover:text-primary"
                      )}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span className="text-lg font-semibold">{option}</span>
                      {attempts[currentQ.id]?.selectedOption === option && <CheckCircle2 className="w-5 h-5 ml-auto text-primary" />}
                    </Label>
                  ))}
                </RadioGroup>
              )}
            </div>

            <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-border">
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                  disabled={currentIdx === 0}
                  className="rounded-xl px-6 h-12 font-bold"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    const qId = currentQ.id;
                    setAttempts(prev => ({
                      ...prev,
                      [qId]: { ...prev[qId], status: prev[qId].status === 'marked-for-review' ? 'visited' : 'marked-for-review' }
                    }));
                  }}
                  className={cn(
                    "rounded-xl px-6 h-12 font-bold",
                    attempts[currentQ.id]?.status === 'marked-for-review' ? "text-accent bg-accent/10" : "text-muted-foreground"
                  )}
                >
                  <Bookmark className="w-4 h-4 mr-2" /> 
                  {attempts[currentQ.id]?.status === 'marked-for-review' ? 'Marked' : 'Review Later'}
                </Button>
              </div>
              
              <Button 
                onClick={() => {
                  if (currentIdx < test.questions.length - 1) {
                    setCurrentIdx(currentIdx + 1);
                  } else {
                    if(confirm("Confirm session end?")) finishTest();
                  }
                }}
                className="w-full sm:w-auto rounded-xl px-10 h-12 font-black bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20"
              >
                {currentIdx < test.questions.length - 1 ? 'Save & Proceed' : 'Lock & Finalize'} <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        <aside className="w-80 border-l border-border bg-card/50 backdrop-blur-sm hidden lg:flex flex-col p-6 space-y-8">
           <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
               <ShieldCheck className="w-6 h-6" />
             </div>
             <div>
               <p className="text-[10px] font-black uppercase text-primary tracking-widest">Integrity Mode</p>
               <p className="text-xs font-bold text-muted-foreground">Monitoring Active</p>
             </div>
           </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Evaluation Matrix</h3>
            <div className="grid grid-cols-4 gap-2">
              {test.questions.map((q, i) => {
                const status = attempts[q.id]?.status;
                const isSelected = i === currentIdx;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(i)}
                    className={cn(
                      "aspect-square rounded-xl flex items-center justify-center text-xs font-black transition-all border-2",
                      isSelected ? "border-primary scale-110 z-10" : "border-transparent",
                      status === 'attempted' ? "bg-primary text-white" :
                      status === 'marked-for-review' ? "bg-accent text-accent-foreground" :
                      status === 'visited' ? "bg-muted/50 text-foreground" :
                      "bg-muted/10 text-muted-foreground"
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-border space-y-4">
             <div className="grid grid-cols-2 gap-3">
               <div className="flex items-center gap-2 text-[10px] font-bold text-primary">
                 <div className="w-2 h-2 rounded-full bg-primary" /> Attempted
               </div>
               <div className="flex items-center gap-2 text-[10px] font-bold text-accent">
                 <div className="w-2 h-2 rounded-full bg-accent" /> Review
               </div>
             </div>
             <p className="text-[9px] text-muted-foreground/60 leading-relaxed font-medium">
               This session is being recorded for security audits. Use of forbidden resources will invalidate results automatically.
             </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
