
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
import { FileUp, Plus, Database, Wand2, Loader2, Trash2, CheckCircle2 } from 'lucide-react';
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
    neg: 1,
    skip: 0
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUri = reader.result as string;
        try {
          const result = await adminAutoImportQuestions({
            fileDataUri: dataUri,
            fileName: file.name,
            adminInstructions: `Import ${testData.subject} questions. Ensure class level is ${testData.classLevel}.`
          });
          
          const newQuestions: Question[] = result.map(q => ({
            ...q,
            classLevel: q.classLevel as ClassLevel
          }));

          setImportedQuestions(prev => [...prev, ...newQuestions]);
          toast({ title: "AI Import Success", description: `Parsed ${newQuestions.length} items.` });
        } catch (err) {
          toast({ variant: "destructive", title: "AI Parsing Failed", description: "The document could not be processed." });
        } finally {
          setImporting(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast({ variant: "destructive", title: "Upload Error", description: "File could not be read." });
      setImporting(false);
    }
  };

  const createTest = async () => {
    if (!user) return;
    if (importedQuestions.length === 0) {
      toast({ variant: "destructive", title: "Empty Bank", description: "Add questions first." });
      return;
    }

    setIsPublishing(true);
    const testId = uuidv4();
    const newTest: Test = {
      id: testId,
      title: testData.title || "Periodic Evaluation",
      description: `Evaluation for Class ${testData.classLevel}`,
      subject: testData.subject || "General",
      classLevel: testData.classLevel,
      questions: importedQuestions,
      totalTimeMinutes: testData.time,
      createdAt: new Date().toISOString(),
      marksPerQuestion: testData.marks,
      negativeMarks: testData.neg,
      skippedMarks: testData.skip,
      isReleased: true,
      adminId: user.uid
    };

    try {
      await setDoc(doc(db, 'tests', testId), newTest);
      toast({ title: "Test Published", description: "The test is now live for students." });
      setImportedQuestions([]);
    } catch (error) {
      toast({ variant: "destructive", title: "Database Error", description: "Could not sync test data." });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-10 pb-20">
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-bold">Admin Console</h1>
          <p className="text-muted-foreground font-medium">System configuration and evaluation management.</p>
        </div>

        <Tabs defaultValue="create" className="space-y-8">
          <TabsList className="bg-muted/50 p-1.5 rounded-2xl border border-border">
            <TabsTrigger value="create" className="rounded-xl px-10 font-bold">Build Test</TabsTrigger>
            <TabsTrigger value="bank" className="rounded-xl px-10 font-bold">Question Bank</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-8 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-6">
                <Card className="rounded-[2rem] border-border bg-card shadow-xl shadow-muted/5">
                  <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                      <Wand2 className="w-5 h-5 text-primary" /> Smart Question Importer
                    </CardTitle>
                    <CardDescription>AI-powered document parsing for PDF and DOCX files.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="relative group">
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-[2rem] py-16 px-10 text-center space-y-4 hover:border-primary/50 transition-all bg-muted/20">
                        {importing && (
                          <div className="absolute inset-0 bg-background/90 backdrop-blur-md z-10 flex flex-col items-center justify-center space-y-4 rounded-[2rem]">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            <p className="font-bold text-primary animate-pulse tracking-widest">AI NEURAL PARSING IN PROGRESS...</p>
                          </div>
                        )}
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <FileUp className="w-10 h-10" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-xl">Upload Source Material</p>
                          <p className="text-xs text-muted-foreground font-medium">Drag & drop PDF or Word documents (Max 15MB)</p>
                        </div>
                        <Input type="file" className="hidden" id="file-upload" onChange={handleFileUpload} accept=".pdf,.docx" />
                        <Button asChild variant="secondary" className="rounded-xl h-12 px-8 font-bold">
                          <label htmlFor="file-upload" className="cursor-pointer">Select File</label>
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Staging Area ({importedQuestions.length})</h4>
                      <div className="max-h-[400px] overflow-y-auto space-y-3 pr-3">
                        {importedQuestions.map((q, idx) => (
                          <div key={idx} className="p-4 bg-muted/30 border border-border rounded-2xl flex justify-between items-center group">
                             <div>
                               <p className="text-sm font-bold line-clamp-1">{q.questionText}</p>
                               <div className="flex gap-3 text-[9px] font-black uppercase tracking-tighter mt-1">
                                 <span className="text-primary">{q.questionType}</span>
                                 <span className="text-muted-foreground">{q.subject}</span>
                               </div>
                             </div>
                             <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-8 w-8 text-destructive" onClick={() => setImportedQuestions(prev => prev.filter((_, i) => i !== idx))}>
                               <Trash2 className="w-4 h-4" />
                             </Button>
                          </div>
                        ))}
                        {importedQuestions.length === 0 && <div className="text-center py-10 border border-dashed rounded-2xl text-muted-foreground italic text-sm">No items staged. Use the AI importer above.</div>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-8">
                <Card className="rounded-[2rem] border-border bg-card shadow-xl shadow-muted/5">
                  <CardHeader>
                    <CardTitle className="font-headline text-xl">Control Matrix</CardTitle>
                    <CardDescription>Global test parameters and settings.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Test Title</Label>
                      <Input placeholder="Periodic Assessment I" className="rounded-xl h-11 bg-muted/30" value={testData.title} onChange={e => setTestData({...testData, title: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Subject</Label>
                        <Input placeholder="Biology" className="rounded-xl h-11 bg-muted/30" value={testData.subject} onChange={e => setTestData({...testData, subject: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Class</Label>
                        <Select value={testData.classLevel} onValueChange={v => setTestData({...testData, classLevel: v as ClassLevel})}>
                          <SelectTrigger className="rounded-xl h-11 bg-muted/30">
                            <SelectValue placeholder="12" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">Class 10</SelectItem>
                            <SelectItem value="11">Class 11</SelectItem>
                            <SelectItem value="12">Class 12</SelectItem>
                            <SelectItem value="Dropper">Dropper</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Duration (Minutes)</Label>
                      <Input type="number" className="rounded-xl h-11 bg-muted/30" value={testData.time} onChange={e => setTestData({...testData, time: parseInt(e.target.value)})} />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Correct</Label>
                        <Input type="number" className="rounded-xl h-11 bg-muted/30 text-center font-bold" value={testData.marks} onChange={e => setTestData({...testData, marks: parseInt(e.target.value)})} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Wrong</Label>
                        <Input type="number" className="rounded-xl h-11 bg-muted/30 text-center font-bold text-destructive" value={testData.neg} onChange={e => setTestData({...testData, neg: parseInt(e.target.value)})} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Left</Label>
                        <Input type="number" className="rounded-xl h-11 bg-muted/30 text-center font-bold" value={testData.skip} onChange={e => setTestData({...testData, skip: parseInt(e.target.value)})} />
                      </div>
                    </div>

                    <Button onClick={createTest} disabled={isPublishing} className="w-full h-14 rounded-2xl font-black mt-4 shadow-2xl shadow-primary/20 bg-primary text-white hover:bg-primary/90">
                      {isPublishing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Plus className="w-5 h-5 mr-2" />}
                      Publish to Portal
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bank">
            <Card className="rounded-[2.5rem] border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline">Question Repository</CardTitle>
                  <CardDescription>Centralized bank for all evaluation items.</CardDescription>
                </div>
                <Button variant="outline" className="rounded-xl border-primary/20 text-primary font-bold">
                  <Database className="w-4 h-4 mr-2" /> Synced to Firestore
                </Button>
              </CardHeader>
              <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground font-medium flex-col gap-4">
                 <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
                   <CheckCircle2 className="w-10 h-10 opacity-30" />
                 </div>
                 <p>Repository syncing with global cluster...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PortalLayout>
  );
}
