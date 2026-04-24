
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
  ChevronLeft, 
  ChevronRight, 
  Timer, 
  User as UserIcon, 
  Bookmark, 
  CircleCheck,
  AlertCircle,
  HelpCircle,
  Clock,
  SendHorizontal,
  Loader2
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
    if (timeLeft <= 0 && test && timeLeft > 0) {
      finishTest();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, test]);

  useEffect(() => {
    if (!test || !test.questions[currentIdx]) return;
    const qId = test.questions[currentIdx].id;
    if (attempts[qId]?.status === 'not-visited') {
      setAttempts(prev => ({
        ...prev,
        [qId]: { ...prev[qId], status: 'visited' }
      }));
    }
  }, [currentIdx, test]);

  const handleOptionSelect = (option: string) => {
    if (!test) return;
    const qId = test.questions[currentIdx].id;
    setAttempts(prev => ({
      ...prev,
      [qId]: { 
        ...prev[qId], 
        selectedOption: option, 
        status: 'attempted' 
      }
    }));
  };

  const toggleReview = () => {
    if (!test) return;
    const qId = test.questions[currentIdx].id;
    setAttempts(prev => ({
      ...prev,
      [qId]: { 
        ...prev[qId], 
        status: prev[qId].status === 'marked-for-review' ? 'attempted' : 'marked-for-review' 
      }
    }));
  };

  const finishTest = useCallback(async () => {
    if (!test || !user || isSubmitting) return;
    setIsSubmitting(true);

    const submissionId = uuidv4().replace(/-/g, '').slice(0, 12).toUpperCase();
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
      } else if (att.selectedOption === q.correctAnswer) {
        correct++;
        totalScore += (test.marksPerQuestion || 4);
      } else {
        wrong++;
        totalScore -= (test.negativeMarks || 1);
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
      toast({ title: "Test Submitted", description: "Evaluation completed successfully." });
      router.push(`/dashboard/results/${docRef.id}`);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Submission Failed", description: "Check connection." });
      setIsSubmitting(false);
    }
  }, [test, attempts, timeLeft, user, router, db, isSubmitting]);

  if (isTestLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!test || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold">Test Not Found</h2>
        <Button variant="link" onClick={() => router.push('/dashboard/tests')}>Back to Tests</Button>
      </div>
    );
  }

  const currentQ = test.questions[currentIdx];
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-bold text-white text-xl">O</div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider">{test.title}</h1>
            <p className="text-[10px] text-muted-foreground uppercase font-medium">{test.subject} • Class {test.classLevel}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all",
            timeLeft < 300 ? "border-destructive/50 bg-destructive/10 text-destructive animate-pulse" : "border-primary/20 bg-primary/5 text-primary"
          )}>
            <Timer className="w-5 h-5" />
            <span className="text-lg font-headline font-bold">{formatTime(timeLeft)}</span>
          </div>
          <Button 
            onClick={() => { if(confirm("Are you sure you want to submit?")) finishTest(); }} 
            disabled={isSubmitting}
            className="rounded-xl font-bold bg-primary hover:bg-primary/90 px-6 gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
            Finish Test
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <Badge variant="outline" className="rounded-lg h-7 font-bold text-primary border-primary/20">
                Question {currentIdx + 1} of {test.questions.length}
              </Badge>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase">Marks: <span className="text-foreground">+{test.marksPerQuestion} / -{test.negativeMarks}</span></span>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-headline font-semibold leading-relaxed">
                {currentQ.questionText}
              </h2>

              {currentQ.imageIncluded && (
                <div className="aspect-video w-full rounded-2xl bg-muted/50 border border-border flex items-center justify-center relative overflow-hidden group">
                  <div className="text-muted-foreground flex flex-col items-center gap-2 opacity-60">
                    <HelpCircle className="w-10 h-10" />
                    <p className="text-xs font-medium uppercase tracking-widest">[ Question Image Component ]</p>
                  </div>
                  <img src={`https://picsum.photos/seed/${currentQ.id}/800/450`} alt="Question reference" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay group-hover:scale-105 transition-transform duration-500" />
                </div>
              )}

              {currentQ.options && (
                <RadioGroup 
                  value={attempts[currentQ.id]?.selectedOption || ""} 
                  onValueChange={handleOptionSelect}
                  className="space-y-3"
                >
                  {currentQ.options.map((option, i) => (
                    <Label
                      key={i}
                      className={cn(
                        "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer group",
                        attempts[currentQ.id]?.selectedOption === option
                          ? "border-primary bg-primary/5 shadow-lg shadow-primary/5"
                          : "border-border bg-card/50 hover:border-primary/20 hover:bg-primary/5"
                      )}
                    >
                      <RadioGroupItem value={option} className="sr-only" />
                      <div className={cn(
                        "w-8 h-8 rounded-lg border-2 flex items-center justify-center font-bold text-sm transition-all",
                        attempts[currentQ.id]?.selectedOption === option
                          ? "bg-primary border-primary text-white"
                          : "border-border text-muted-foreground group-hover:border-primary/50 group-hover:text-primary"
                      )}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span className="text-lg font-medium">{option}</span>
                    </Label>
                  ))}
                </RadioGroup>
              )}
            </div>

            <div className="pt-12 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                  disabled={currentIdx === 0}
                  className="rounded-xl px-6 border-border"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={toggleReview}
                  className={cn(
                    "rounded-xl px-6 font-bold",
                    attempts[currentQ.id]?.status === 'marked-for-review' ? "bg-accent text-accent-foreground" : "bg-muted/50"
                  )}
                >
                  <Bookmark className="w-4 h-4 mr-2" /> 
                  {attempts[currentQ.id]?.status === 'marked-for-review' ? 'Marked' : 'Mark for Review'}
                </Button>
              </div>
              <Button 
                onClick={() => {
                  if (currentIdx < test.questions.length - 1) {
                    setCurrentIdx(currentIdx + 1);
                  } else {
                    if(confirm("Reached end of test. Submit now?")) finishTest();
                  }
                }}
                className="rounded-xl px-8 font-bold bg-foreground text-background hover:bg-foreground/90"
              >
                {currentIdx < test.questions.length - 1 ? 'Save & Next' : 'Save & Submit'} <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        <aside className="w-80 border-l border-border bg-card flex flex-col p-6 space-y-6">
          <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate leading-tight">{user.displayName || 'Student'}</p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter mt-1">ID: {user.uid.slice(0, 8)}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
               <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Question Map</h3>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {test.questions.map((q, i) => {
                const status = attempts[q.id]?.status;
                const isSelected = i === currentIdx;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(i)}
                    className={cn(
                      "aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all relative border-2",
                      isSelected ? "border-primary scale-110 z-10" : "border-transparent",
                      status === 'attempted' ? "bg-primary text-white" :
                      status === 'visited' ? "bg-muted/50 text-foreground border-accent/30" :
                      status === 'marked-for-review' ? "bg-accent text-accent-foreground" :
                      "bg-muted/10 text-muted-foreground"
                    )}
                  >
                    {i + 1}
                    {status === 'marked-for-review' && <Bookmark className="w-2 h-2 absolute top-0.5 right-0.5 fill-current" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-auto space-y-3 pt-6 border-t border-border">
            <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-bold">
              <div className="flex items-center gap-2 text-primary">
                <div className="w-3 h-3 rounded-sm bg-primary" /> Attempted
              </div>
              <div className="flex items-center gap-2 text-accent">
                <div className="w-3 h-3 rounded-sm bg-accent" /> Review
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
