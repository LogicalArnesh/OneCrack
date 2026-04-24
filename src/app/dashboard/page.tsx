"use client";

import React, { useEffect, useState } from 'react';
import PortalLayout from '@/components/dashboard/PortalLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { store } from '@/lib/store';
import { Test, TestResult } from '@/lib/types';
import { ClipboardList, Award, TrendingUp, Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [availableTests, setAvailableTests] = useState<Test[]>([]);
  const [recentResults, setRecentResults] = useState<TestResult[]>([]);
  const user = store.getCurrentUser();

  useEffect(() => {
    // For demo, if no tests, create a sample one
    const tests = store.getTests();
    if (tests.length === 0) {
      const sampleTest: Test = {
        id: '1',
        title: 'NEET Foundation - Mock Test 1',
        description: 'Comprehensive evaluation for medical aspirants.',
        subject: 'Biology',
        classLevel: '12',
        questions: [], // In real app, this would be populated
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
            <h3 className="text-xl font-headline font-bold">Recent Results</h3>
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
