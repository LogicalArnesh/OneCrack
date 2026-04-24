"use client";

import React, { useEffect, useState } from 'react';
import PortalLayout from '@/components/dashboard/PortalLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { store } from '@/lib/store';
import { Test, TestResult } from '@/lib/types';
import { ClipboardList, Award, TrendingUp, Calendar, ChevronRight, Sparkles, Loader2, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { generateStudyPlan, StudyPlanOutput } from '@/ai/flows/generate-study-plan';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { toast } = useToast();
  const [availableTests, setAvailableTests] = useState<Test[]>([]);
  const [recentResults, setRecentResults] = useState<TestResult[]>([]);
  const [studyPlan, setStudyPlan] = useState<StudyPlanOutput | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const user = store.getCurrentUser();

  useEffect(() => {
    const tests = store.getTests();
    if (tests.length === 0) {
      const sampleTest: Test = {
        id: '1',
        title: 'NEET Foundation - Mock Test 1',
        description: 'Comprehensive evaluation for medical aspirants.',
        subject: 'Biology',
        classLevel: '12',
        questions: [],
        totalTimeMinutes: 60,
        createdAt: new Date().toISOString(),
        marksPerQuestion: 4,
        negativeMarks: 1,
        isReleased: true
      };
      store.saveTest(sampleTest);
      setAvailableTests([sampleTest]);
    } else {
      setAvailableTests(tests);
    }

    setRecentResults(store.getResults().filter(r => r.userId === user?.id).slice(0, 3));
  }, [user]);

  const handleGenerateStudyPlan = async () => {
    if (recentResults.length === 0) {
      toast({
        title: "No Test History",
        description: "Complete at least one test to generate a personalized study plan.",
      });
      return;
    }

    setIsGeneratingPlan(true);
    try {
      const tests = store.getTests();
      const enrichedResults = recentResults.map(r => {
        const test = tests.find(t => t.id === r.testId);
        return {
          testTitle: test?.title || 'Unknown Test',
          subject: test?.subject || 'General',
          score: r.totalScore,
          maxScore: r.maxScore,
        };
      });

      const plan = await generateStudyPlan({
        studentName: user?.name || 'Student',
        classLevel: user?.classLevel || '12',
        recentResults: enrichedResults,
        goals: `Improve overall accuracy and time management in ${user?.subjectPreference || 'all subjects'}.`
      });

      setStudyPlan(plan);
      toast({
        title: "Study Plan Ready",
        description: "AI has analyzed your performance and created a 7-day plan.",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not create study plan at this time.",
      });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-headline font-bold text-foreground">Hello, {user?.name}</h1>
            <p className="text-muted-foreground">Ready for your next evaluation? Choose a test to begin.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1 rounded-lg border-primary/30 text-primary font-bold">
              Class {user?.classLevel}
            </Badge>
            {user?.subjectPreference && (
              <Badge variant="outline" className="px-3 py-1 rounded-lg border-accent/30 text-accent font-bold">
                {user.subjectPreference}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-3xl bg-primary/5 border-primary/20 shadow-none">
            <CardHeader className="pb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary mb-2">
                <ClipboardList className="w-5 h-5" />
              </div>
              <CardTitle className="text-2xl font-headline">Available Tests</CardTitle>
              <CardDescription>New evaluations for your level</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-headline font-bold text-primary">{availableTests.length}</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl bg-accent/5 border-accent/20 shadow-none">
            <CardHeader className="pb-2">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent mb-2">
                <Award className="w-5 h-5" />
              </div>
              <CardTitle className="text-2xl font-headline">Average Score</CardTitle>
              <CardDescription>Your overall performance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-headline font-bold text-accent">
                {recentResults.length > 0 
                  ? `${Math.round(recentResults.reduce((acc, r) => acc + (r.totalScore/r.maxScore)*100, 0) / recentResults.length)}%`
                  : 'N/A'
                }
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl bg-secondary border-border shadow-none">
            <CardHeader className="pb-2">
              <div className="w-10 h-10 rounded-xl bg-foreground/10 flex items-center justify-center text-foreground mb-2">
                <TrendingUp className="w-5 h-5" />
              </div>
              <CardTitle className="text-2xl font-headline">Test History</CardTitle>
              <CardDescription>Evaluations completed</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-headline font-bold text-foreground">{recentResults.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Study Plan Section */}
        <Card className="rounded-3xl border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/5 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="font-headline flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> AI Personal Mentor
              </CardTitle>
              <CardDescription>Get a customized study plan based on your test history</CardDescription>
            </div>
            {!studyPlan && (
              <Button onClick={handleGenerateStudyPlan} disabled={isGeneratingPlan} className="rounded-xl font-bold">
                {isGeneratingPlan ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Generate Plan
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {studyPlan ? (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-card border border-border">
                  <p className="text-sm italic text-muted-foreground">"{studyPlan.motivationalQuote}"</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm uppercase text-primary">Priority Focus Areas</h4>
                    <div className="space-y-2">
                      {studyPlan.focusAreas.map((area, i) => (
                        <div key={i} className="p-3 rounded-xl bg-card border border-border flex items-start gap-3">
                          <Badge className={area.priority === 'High' ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'}>
                            {area.priority}
                          </Badge>
                          <div>
                            <p className="font-bold text-sm">{area.topic}</p>
                            <p className="text-xs text-muted-foreground">{area.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm uppercase text-accent">Weekly Roadmap</h4>
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                      {studyPlan.weeklySchedule.map((day, i) => (
                        <div key={i} className="p-3 rounded-xl bg-muted/30 border border-border">
                          <p className="font-bold text-xs uppercase text-accent">{day.day}</p>
                          <ul className="mt-1 space-y-1">
                            {day.tasks.map((task, j) => (
                              <li key={j} className="text-xs text-muted-foreground flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-accent" /> {task}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" className="w-full text-primary font-bold" onClick={() => setStudyPlan(null)}>
                  Regenerate Plan
                </Button>
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div className="max-w-md">
                  <p className="font-bold text-lg">No Active Study Plan</p>
                  <p className="text-sm text-muted-foreground">Use the "Generate Plan" button to have AI analyze your recent test attempts and create a custom schedule just for you.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-headline font-bold">Featured Tests</h3>
              <Button variant="link" asChild className="text-primary font-bold p-0 h-auto">
                <Link href="/dashboard/tests" className="flex items-center gap-1">View all <ChevronRight className="w-4 h-4" /></Link>
              </Button>
            </div>
            
            <div className="space-y-4">
              {availableTests.length > 0 ? availableTests.map(test => (
                <div key={test.id} className="group p-5 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{test.title}</h4>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(test.createdAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><ClipboardList className="w-3 h-3" /> {test.subject}</span>
                    </div>
                  </div>
                  <Button asChild size="sm" className="rounded-xl font-bold">
                    <Link href={`/dashboard/tests/${test.id}`}>Start</Link>
                  </Button>
                </div>
              )) : (
                <div className="text-center py-12 rounded-2xl border border-dashed border-border text-muted-foreground">
                  No active tests available for your class level.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-headline font-bold">Recent Results</h3>
              <Button variant="link" asChild className="text-primary font-bold p-0 h-auto">
                <Link href="/dashboard/results" className="flex items-center gap-1">View History <ChevronRight className="w-4 h-4" /></Link>
              </Button>
            </div>
            <div className="space-y-4">
              {recentResults.length > 0 ? recentResults.map(result => (
                <div key={result.id} className="p-5 rounded-2xl bg-card border border-border flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent font-bold text-lg">
                      {Math.round((result.totalScore / result.maxScore) * 100)}%
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">Mock Exam #{result.submissionId.slice(0, 4)}</h4>
                      <p className="text-xs text-muted-foreground">Submitted on {new Date(result.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl border-primary/20 text-primary hover:bg-primary/10">
                    <Link href={`/dashboard/results/${result.id}`}>View Analysis</Link>
                  </Button>
                </div>
              )) : (
                <div className="text-center py-12 rounded-2xl border border-dashed border-border text-muted-foreground">
                  You haven't completed any tests yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
