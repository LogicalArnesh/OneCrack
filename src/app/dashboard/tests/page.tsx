
"use client";

import React from 'react';
import PortalLayout from '@/components/dashboard/PortalLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Test } from '@/lib/types';
import { ClipboardList, Clock, Info, Play, Calendar, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function TestsListPage() {
  const { user } = useUser();
  const db = useFirestore();

  // Memoized query for tests based on user's class level
  const testsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'tests'));
  }, [db, user]);

  const { data: tests, isLoading } = useCollection<Test>(testsQuery);

  return (
    <PortalLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-headline font-bold">Available Tests</h1>
            <p className="text-muted-foreground">Evaluations tailored for your academic level</p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-muted-foreground font-medium">Syncing with portal bank...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests && tests.length > 0 ? tests.map(test => (
              <Card key={test.id} className="rounded-3xl border-border bg-card hover:border-primary/40 transition-all flex flex-col overflow-hidden group shadow-xl hover:shadow-primary/5">
                <div className="h-2 bg-primary group-hover:h-3 transition-all" />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="rounded-lg bg-primary/10 text-primary border-none font-bold">
                      {test.subject}
                    </Badge>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(test.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <CardTitle className="font-headline text-xl leading-tight">{test.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{test.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="p-3 rounded-2xl bg-muted/30 space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Duration
                      </p>
                      <p className="font-bold">{test.totalTimeMinutes} Mins</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-muted/30 space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                        <ClipboardList className="w-3 h-3" /> Questions
                      </p>
                      <p className="font-bold">{test.questions?.length || 0} items</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button asChild className="w-full rounded-xl h-11 font-bold">
                    <Link href={`/dashboard/tests/${test.id}`} className="flex items-center justify-center gap-2">
                      <Play className="w-4 h-4 fill-current" /> Start Evaluation
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )) : (
              <div className="col-span-full py-24 text-center space-y-4 rounded-3xl border border-dashed border-border bg-muted/10">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center text-muted-foreground mx-auto">
                  <Info className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-bold">No Tests Found</p>
                  <p className="text-muted-foreground max-w-xs mx-auto">Check back later or contact your administrator for assigned tests.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
