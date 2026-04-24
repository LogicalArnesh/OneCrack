
"use client";

import React, { useState } from 'react';
import PortalLayout from '@/components/dashboard/PortalLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { adminAutoImportQuestions } from '@/ai/flows/admin-auto-import-questions';
import { useToast } from '@/hooks/use-toast';
import { FileUp, Plus, Database, Wand2, Loader2, Trash2 } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Question, ClassLevel, Test } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  const [importing, setImporting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [importedQuestions, setImportedQuestions] = useState<Question[]>([]);
  
  const [testData, setTestData] = useState({
    title: '',
    subject: '',
    classLevel: '12' as ClassLevel,
    time: 60,
    marks: 4,
    neg: 1
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUri = reader.result as string;
        const result = await adminAutoImportQuestions({
          fileDataUri: dataUri,
          fileName: file.name,
          adminInstructions: "Extract all test questions with correct options and explanations."
        });
        
        const newQuestions: Question[] = result.map(q => ({
          ...q,
          classLevel: q.classLevel as ClassLevel
        }));

        setImportedQuestions(prev => [...prev, ...newQuestions]);
        toast({
          title: "AI Import Success",
          description: `Extracted ${newQuestions.length} questions from ${file.name}.`,
        });
        setImporting(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: "Could not process the file.",
      });
      setImporting(false);
    }
  };

  const createTest = async () => {
    if (!user) return;
    if (importedQuestions.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Add some questions first." });
      return;
    }

    setIsPublishing(true);
    const testId = uuidv4();
    const newTest: Test = {
      id: testId,
      title: testData.title || "Untitled Test",
      description: `Test for Class ${testData.classLevel}`,
      subject: testData.subject || "Mixed",
      classLevel: testData.classLevel,
      questions: importedQuestions,
      totalTimeMinutes: testData.time,
      createdAt: new Date().toISOString(),
      marksPerQuestion: testData.marks,
      negativeMarks: testData.neg,
      isReleased: true
    };

    try {
      await setDoc(doc(db, 'tests', testId), newTest);
      toast({ title: "Test Created", description: "Successfully published to the portal." });
      setImportedQuestions([]);
      setTestData({ title: '', subject: '', classLevel: '12', time: 60, marks: 4, neg: 1 });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Publish Failed", description: "Database error." });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-8 pb-20">
        <div className="space-y-2">
          <h1 className="text-3xl font-headline font-bold">Admin Console</h1>
          <p className="text-muted-foreground">Manage tests, import questions with AI, and view student analytics.</p>
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-2xl">
            <TabsTrigger value="create" className="rounded-xl px-8 font-bold">Create Test</TabsTrigger>
            <TabsTrigger value="database" className="rounded-xl px-8 font-bold">Question Bank</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card className="rounded-3xl border-border bg-card">
                  <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                      <Wand2 className="w-5 h-5 text-primary" /> AI Question Importer
                    </CardTitle>
                    <CardDescription>Upload PDF or Word documents to automatically extract questions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl py-12 px-4 text-center space-y-4 hover:border-primary/50 transition-colors bg-muted/10 relative overflow-hidden">
                      {importing && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center space-y-4">
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                          <p className="font-bold text-primary">AI is analyzing document...</p>
                        </div>
                      )}
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <FileUp className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-lg">Click to Upload</p>
                        <p className="text-xs text-muted-foreground">Supports PDF, DOCX (Max 10MB)</p>
                      </div>
                      <Input type="file" className="hidden" id="file-upload" onChange={handleFileUpload} accept=".pdf,.docx" />
                      <Button asChild variant="secondary" className="rounded-xl">
                        <label htmlFor="file-upload" className="cursor-pointer">Browse Files</label>
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Current Queue ({importedQuestions.length})</h4>
                        {importedQuestions.length > 0 && (
                          <Button variant="ghost" size="sm" onClick={() => setImportedQuestions([])} className="text-destructive text-xs gap-1">
                            <Trash2 className="w-3 h-3" /> Clear All
                          </Button>
                        )}
                      </div>
                      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                        {importedQuestions.map((q, idx) => (
                          <div key={q.id || idx} className="p-3 bg-muted/30 border border-border rounded-xl text-xs flex justify-between gap-4 group">
                             <div className="space-y-1">
                               <p className="font-semibold line-clamp-1">{q.questionText}</p>
                               <div className="flex gap-2 text-[10px] text-muted-foreground uppercase">
                                 <span className="text-primary font-bold">{q.questionType}</span>
                                 <span>{q.subject}</span>
                               </div>
                             </div>
                             <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setImportedQuestions(prev => prev.filter((_, i) => i !== idx))}>
                               <Trash2 className="w-3 h-3" />
                             </Button>
                          </div>
                        ))}
                        {importedQuestions.length === 0 && <p className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-xl">No questions imported yet.</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="rounded-3xl border-border bg-card">
                  <CardHeader>
                    <CardTitle className="font-headline">Test Details</CardTitle>
                    <CardDescription>Configure basic parameters</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Test Title</Label>
                      <Input placeholder="E.g. Unit Test 1" className="rounded-xl h-10 bg-muted/30" value={testData.title} onChange={e => setTestData({...testData, title: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Subject</Label>
                        <Input placeholder="Biology" className="rounded-xl h-10 bg-muted/30" value={testData.subject} onChange={e => setTestData({...testData, subject: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Class</Label>
                        <Select value={testData.classLevel} onValueChange={v => setTestData({...testData, classLevel: v as ClassLevel})}>
                          <SelectTrigger className="rounded-xl h-10 bg-muted/30">
                            <SelectValue placeholder="12" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="11">11</SelectItem>
                            <SelectItem value="12">12</SelectItem>
                            <SelectItem value="Dropper">Dropper</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Time (Mins)</Label>
                        <Input type="number" className="rounded-xl h-10 bg-muted/30" value={testData.time} onChange={e => setTestData({...testData, time: parseInt(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Marks (+/ -)</Label>
                        <div className="flex gap-1">
                          <Input type="number" className="rounded-xl h-10 bg-muted/30" value={testData.marks} onChange={e => setTestData({...testData, marks: parseInt(e.target.value)})} />
                          <Input type="number" className="rounded-xl h-10 bg-muted/30" value={testData.neg} onChange={e => setTestData({...testData, neg: parseInt(e.target.value)})} />
                        </div>
                      </div>
                    </div>
                    <Button onClick={createTest} disabled={isPublishing} className="w-full h-11 rounded-xl font-bold mt-4 shadow-lg shadow-primary/20">
                      {isPublishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                      Publish Test
                    </Button>
                  </CardContent>
                </Card>

                <div className="p-4 rounded-2xl bg-accent/5 border border-accent/20">
                  <h4 className="font-headline font-bold text-accent mb-2">Pro Tip</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    AI works best when the document has clear question numbers and options labeled A, B, C, D.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="database">
            <Card className="rounded-3xl border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline">Global Question Bank</CardTitle>
                  <CardDescription>Browse all questions available in the system</CardDescription>
                </div>
                <Button variant="outline" className="rounded-xl border-primary/20 text-primary">
                  <Database className="w-4 h-4 mr-2" /> Export Bank
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-center py-20 text-muted-foreground">
                  The central question repository is syncing with Firestore.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PortalLayout>
  );
}
