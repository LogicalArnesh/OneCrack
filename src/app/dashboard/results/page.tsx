"use client";

import React, { useEffect, useState } from 'react';
import PortalLayout from '@/components/dashboard/PortalLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { store } from '@/lib/store';
import { TestResult, Test } from '@/lib/types';
import { ClipboardList, Calendar, ArrowRight, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

export default function ResultsHistoryPage() {
  const [results, setResults] = useState<(TestResult & { test?: Test })[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const user = store.getCurrentUser();

  useEffect(() => {
    const allResults = store.getResults().filter(r => r.userId === user?.id);
    const tests = store.getTests();
    
    const enrichedResults = allResults.map(r => ({
      ...r,
      test: tests.find(t => t.id === r.testId)
    })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setResults(enrichedResults);
  }, [user]);

  const filteredResults = results.filter(r => 
    r.test?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.submissionId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PortalLayout>
      <div className="space-y-8 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-headline font-bold">Past Results</h1>
            <p className="text-muted-foreground">Track your progress and review previous attempts.</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by test name or submission ID..." 
              className="pl-10 rounded-xl bg-muted/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="rounded-xl border-border gap-2">
            <Filter className="w-4 h-4" /> Filter
          </Button>
        </div>

        <div className="space-y-4">
          {filteredResults.length > 0 ? filteredResults.map((result) => (
            <Card key={result.id} className="rounded-2xl border-border bg-card hover:border-primary/30 transition-all overflow-hidden">
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex flex-col items-center justify-center text-primary border border-primary/20">
                    <span className="text-xl font-black">{Math.round((result.totalScore / result.maxScore) * 100)}%</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg">{result.test?.title || 'Untitled Test'}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground uppercase font-medium">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(result.timestamp).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><ClipboardList className="w-3 h-3" /> {result.test?.subject || 'General'}</span>
                      <span className="text-accent font-bold">ID: {result.submissionId}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="hidden lg:grid grid-cols-3 gap-6 text-center">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Correct</p>
                      <p className="font-bold text-green-500">{result.correctCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Wrong</p>
                      <p className="font-bold text-red-500">{result.wrongCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Score</p>
                      <p className="font-bold">{result.totalScore}</p>
                    </div>
                  </div>
                  <Button asChild className="rounded-xl font-bold gap-2">
                    <Link href={`/dashboard/results/${result.id}`}>
                      View Analysis <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          )) : (
            <div className="text-center py-20 border border-dashed border-border rounded-3xl bg-muted/10">
              <p className="text-muted-foreground">No matching results found.</p>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
