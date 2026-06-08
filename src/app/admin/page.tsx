"use client";

import React, { useState } from 'react';
import PortalLayout from '@/components/dashboard/PortalLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { adminAutoImportQuestions } from '@/ai/flows/admin-auto-import-questions';
import { useToast } from '@/hooks/use-toast';
import { 
  FileUp, 
  Plus, 
  Database, 
  Wand2, 
  Loader2, 
  Trash2, 
  Settings2,
} from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Question, ClassLevel, Test, QuestionType, Subject } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  
  const [importing, setImporting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [importedQuestions, setImportedQuestions] = useState<Question[]>([]);
  
  // Test Configuration
  const [testConfig, setTestConfig] = useState({
    title: '',
    subject: 'Biology' as Subject,
    classLevel: '12' as ClassLevel,
    time: 60,
    marks: 4,
    neg: 1,
    skip: 0
  });

  // Manual Question Entry
  const [manualQ, setManualQ] = useState<Partial<Question>>({
    questionText: '',
    questionType: 'MCQ',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    subject: 'General',
    classLevel: '12'
  });

  const [sourceFiles, setSourceFiles] = useState<{
    questions: { file: File | null; dataUri: string | null };
    answerKey: { file: File | null; dataUri: string | null };
  }>({
    questions: { file: null, dataUri: null },
    answerKey: { file: null, dataUri: null }
  });

  const handleFileChange = (type: 'questions' | 'answerKey') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSourceFiles(prev => ({
        ...prev,
        [type]: { file, dataUri: reader.result as string }
      }));
    };
    reader.readAsDataURL(file);
  };

  const addManualQuestion = () => {
    if (!manualQ.questionText || !manualQ.correctAnswer) {
      toast({ variant: "destructive", title: "Missing Data", description: "Question text and correct answer are required." });
      return;
    }
    const newQ: Question = {
      id: uuidv4(),
      questionText: manualQ.questionText!,
      questionType: manualQ.questionType as QuestionType,
      options: manualQ.options,
      correctAnswer: manualQ.correctAnswer!,
      explanation: manualQ.explanation,
      subject: testConfig.subject,
      classLevel: testConfig.classLevel
    };
    setImportedQuestions(prev => [...prev, newQ]);
    setManualQ({ ...manualQ, questionText: '', correctAnswer: '', explanation: '', options: ['', '', '', ''] });
    toast({ title: "Question Added", description: "Manual entry successful." });
  };

  const runAIImport = async () => {
    if (!sourceFiles.questions.dataUri) {
      toast({ variant: "destructive", title: "Missing Document", description: "Upload the Question sheet first." });
      return;
    }
    setImporting(true);
    try {
      const result = await adminAutoImportQuestions({
        fileDataUri: sourceFiles.questions.dataUri,
        answerKeyDataUri: sourceFiles.answerKey.dataUri || undefined,
        fileName: sourceFiles.questions.file?.name || 'document.pdf',
        adminInstructions: `Subject: ${testConfig.subject}, Class: ${testConfig.classLevel}`
      });
      setImportedQuestions(prev => [...prev, ...result.map(q => ({ ...q, classLevel: q.classLevel as ClassLevel }))]);
      toast({ title: "AI Sync Complete", description: `Extracted ${result.length} questions.` });
    } catch (err) {
      toast({ variant: "destructive", title: "AI Error", description: "Parsing failed." });
    } finally {
      setImporting(false);
    }
  };

  const publishTest = async () => {
    if (!user || importedQuestions.length === 0) return;
    setIsPublishing(true);
    const testId = uuidv4();
    const finalTest: Test = {
      id: testId,
      title: testConfig.title || "OneCrack Assessment",
      description: `${testConfig.subject} Test for Class ${testConfig.classLevel}`,
      subject: testConfig.subject,
      classLevel: testConfig.classLevel,
      questions: importedQuestions,
      totalTimeMinutes: testConfig.time,
      createdAt: new Date().toISOString(),
      marksPerQuestion: testConfig.marks,
      negativeMarks: testConfig.neg,
      skippedMarks: testConfig.skip,
      isReleased: true,
      adminId: user.uid
    };

    try {
      await setDoc(doc(db, 'tests', testId), finalTest);
      toast({ title: "Test Published", description: "Available for students immediately." });
      setImportedQuestions([]);
    } catch (e) {
      toast({ variant: "destructive", title: "Publish Error", description: "Database failure." });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-10 pb-20">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-headline font-bold">Evaluation Console</h1>
            <p className="text-muted-foreground font-medium">Manage evaluations, neural extraction, and question banking.</p>
          </div>
          <Button onClick={publishTest} disabled={isPublishing || importedQuestions.length === 0} className="rounded-2xl h-12 px-8 font-black bg-primary shadow-xl shadow-primary/20">
            {isPublishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Finalize & Release
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Config */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="rounded-[2rem] border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-primary" /> Test Matrix
                </CardTitle>
                <CardDescription>Global scoring and timing parameters.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Test Title</Label>
                  <Input placeholder="NEET Physics Trial" className="rounded-xl h-11" value={testConfig.title} onChange={e => setTestConfig({...testConfig, title: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Subject</Label>
                    <Select value={testConfig.subject} onValueChange={v => setTestConfig({...testConfig, subject: v as Subject})}>
                      <SelectTrigger className="rounded-xl h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Biology">Biology</SelectItem>
                        <SelectItem value="Physics">Physics</SelectItem>
                        <SelectItem value="Chemistry">Chemistry</SelectItem>
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                        <SelectItem value="General">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Class</Label>
                    <Select value={testConfig.classLevel} onValueChange={v => setTestConfig({...testConfig, classLevel: v as ClassLevel})}>
                      <SelectTrigger className="rounded-xl h-11">
                        <SelectValue />
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
                <div className="space-y-1.5">
                  <Label className="text-[10px) font-black uppercase text-muted-foreground">Duration (Mins)</Label>
                  <Input type="number" className="rounded-xl h-11" value={testConfig.time} onChange={e => setTestConfig({...testConfig, time: parseInt(e.target.value)})} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5 text-center">
                    <Label className="text-[9px] font-black text-green-500">CORRECT</Label>
                    <Input type="number" className="rounded-xl text-center h-11 font-bold" value={testConfig.marks} onChange={e => setTestConfig({...testConfig, marks: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-1.5 text-center">
                    <Label className="text-[9px] font-black text-destructive">WRONG</Label>
                    <Input type="number" className="rounded-xl text-center h-11 font-bold" value={testConfig.neg} onChange={e => setTestConfig({...testConfig, neg: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-1.5 text-center">
                    <Label className="text-[9px] font-black text-muted-foreground">LEFT</Label>
                    <Input type="number" className="rounded-xl text-center h-11 font-bold" value={testConfig.skip} onChange={e => setTestConfig({...testConfig, skip: parseInt(e.target.value)})} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                  <FileUp className="w-5 h-5 text-accent" /> Source Import
                </CardTitle>
                <CardDescription>Neural extraction from PDF/Word documents.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Question Sheet</Label>
                  <Input type="file" onChange={handleFileChange('questions')} accept=".pdf,.docx" className="rounded-xl" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Answer Key (Optional)</Label>
                  <Input type="file" onChange={handleFileChange('answerKey')} accept=".pdf,.docx" className="rounded-xl" />
                </div>
                <Button onClick={runAIImport} disabled={importing || !sourceFiles.questions.dataUri} className="w-full h-12 rounded-xl font-bold bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20">
                  {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                  Run Neural Extraction
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Question Editor */}
          <div className="lg:col-span-8 space-y-8">
            <Tabs defaultValue="bank" className="w-full">
              <TabsList className="bg-muted/50 p-1.5 rounded-2xl border border-border mb-6">
                <TabsTrigger value="bank" className="rounded-xl px-10 font-bold">Staging Bank ({importedQuestions.length})</TabsTrigger>
                <TabsTrigger value="manual" className="rounded-xl px-10 font-bold">Manual Entry</TabsTrigger>
              </TabsList>

              <TabsContent value="bank" className="space-y-4">
                <div className="max-h-[800px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {importedQuestions.map((q, idx) => (
                    <Card key={idx} className="rounded-3xl border-border bg-card/50 overflow-hidden group">
                      <div className="p-6 flex flex-col md:flex-row gap-6">
                        <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center font-black text-sm shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 space-y-3">
                          <h4 className="font-bold text-lg leading-tight">{q.questionText}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {q.options?.map((opt, i) => (
                              <div key={i} className={`p-2.5 rounded-xl border text-sm font-medium ${opt === q.correctAnswer ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-muted/30 border-border'}`}>
                                <span className="font-black mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
                              </div>
                            ))}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive h-10 w-10" onClick={() => setImportedQuestions(prev => prev.filter((_, i) => i !== idx))}>
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                  {importedQuestions.length === 0 && (
                    <div className="py-20 text-center border-2 border-dashed rounded-[3rem] text-muted-foreground flex flex-col items-center gap-4">
                      <Database className="w-12 h-12 opacity-20" />
                      <p className="font-medium">Evaluation matrix empty. Use Neural Import or Manual Entry.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="manual" className="space-y-6">
                <Card className="rounded-[2.5rem] border-border bg-card p-10">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Question Content</Label>
                      <Textarea 
                        placeholder="Type the question body here..." 
                        className="rounded-2xl min-h-[120px]" 
                        value={manualQ.questionText}
                        onChange={e => setManualQ({...manualQ, questionText: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {manualQ.options?.map((opt, i) => (
                        <div key={i} className="space-y-1.5">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">Option {String.fromCharCode(65 + i)}</Label>
                          <Input 
                            value={opt} 
                            onChange={e => {
                              const newOpts = [...(manualQ.options || [])];
                              newOpts[i] = e.target.value;
                              setManualQ({...manualQ, options: newOpts});
                            }}
                            className="rounded-xl"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Correct Option Text</Label>
                        <Input 
                          placeholder="Must match one of the options above exactly" 
                          className="rounded-xl h-11"
                          value={manualQ.correctAnswer}
                          onChange={e => setManualQ({...manualQ, correctAnswer: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Explanation (Optional)</Label>
                        <Input 
                          placeholder="Brief solution hint" 
                          className="rounded-xl h-11"
                          value={manualQ.explanation}
                          onChange={e => setManualQ({...manualQ, explanation: e.target.value})}
                        />
                      </div>
                    </div>
                    <Button onClick={addManualQuestion} className="w-full h-14 rounded-2xl font-black bg-primary text-white shadow-xl shadow-primary/10">
                      <Plus className="w-5 h-5 mr-2" /> Add to Evaluation Bank
                    </Button>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
