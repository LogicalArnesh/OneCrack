"use client";

import React, { useState, useRef } from 'react';
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
  FileX,
  CheckCircle2,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Question, ClassLevel, Test, QuestionType, Subject } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  
  const qInputRef = useRef<HTMLInputElement>(null);
  const aInputRef = useRef<HTMLInputElement>(null);

  const [importing, setImporting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [importedQuestions, setImportedQuestions] = useState<Question[]>([]);
  
  const [testConfig, setTestConfig] = useState({
    title: '',
    subject: 'Biology' as Subject,
    classLevel: '12' as ClassLevel,
    time: 60,
    marks: 4,
    neg: 1,
    skip: 0
  });

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

    if (file.size > 8 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Source documents must be under 8MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSourceFiles(prev => ({
        ...prev,
        [type]: { file, dataUri: reader.result as string }
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (type: 'questions' | 'answerKey') => {
    setSourceFiles(prev => ({
      ...prev,
      [type]: { file: null, dataUri: null }
    }));
    if (type === 'questions' && qInputRef.current) qInputRef.current.value = '';
    if (type === 'answerKey' && aInputRef.current) aInputRef.current.value = '';
    toast({ title: "Source Modified", description: "File successfully removed from forge." });
  };

  const addManualQuestion = () => {
    if (!manualQ.questionText || !manualQ.correctAnswer) {
      toast({ variant: "destructive", title: "Validation Error", description: "Content and solution are required." });
      return;
    }
    const newQ: Question = {
      id: uuidv4(),
      questionText: manualQ.questionText!,
      questionType: manualQ.questionType as QuestionType,
      options: manualQ.options,
      optionCodes: Array.from({length: 4}, () => Math.floor(1000 + Math.random() * 9000).toString()),
      correctAnswer: manualQ.correctAnswer!,
      explanation: manualQ.explanation,
      subject: testConfig.subject,
      classLevel: testConfig.classLevel
    };
    setImportedQuestions(prev => [...prev, newQ]);
    setManualQ({ ...manualQ, questionText: '', correctAnswer: '', explanation: '', options: ['', '', '', ''] });
    toast({ title: "Entry Verified", description: "Manual item added to staging bank." });
  };

  const runAIImport = async () => {
    if (!sourceFiles.questions.dataUri) {
      toast({ variant: "destructive", title: "Source Missing", description: "Upload a question document to proceed." });
      return;
    }
    setImporting(true);
    try {
      const result = await adminAutoImportQuestions({
        fileDataUri: sourceFiles.questions.dataUri,
        answerKeyDataUri: sourceFiles.answerKey.dataUri || undefined,
        fileName: sourceFiles.questions.file?.name || 'source.pdf',
        adminInstructions: `Subject Preference: ${testConfig.subject}, Class: ${testConfig.classLevel}. Extract all options and generate 4-digit codes.`
      });
      
      const formatted = result.map(q => ({
        ...q,
        classLevel: testConfig.classLevel as ClassLevel
      }));
      
      setImportedQuestions(prev => [...prev, ...formatted]);
      toast({ title: "Neural Extraction Complete", description: `Successfully analyzed ${result.length} forensic items.` });
    } catch (err: any) {
      console.error(err);
      toast({ 
        variant: "destructive", 
        title: "AI Extraction Error", 
        description: err.message || "Failed to parse document. Ensure the file is a clear PDF/DOCX." 
      });
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
      title: testConfig.title || "Elite Academic Evaluation",
      description: `${testConfig.subject} High-Integrity Test - Class ${testConfig.classLevel}`,
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
      toast({ title: "Portal Synchronized", description: "Evaluation is now live for all eligible students." });
      setImportedQuestions([]);
      setTestConfig({ ...testConfig, title: '' });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failure", description: "Failed to finalize database transaction." });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-10 pb-20 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-headline font-black tracking-tighter neon-text">Evaluation Forge</h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" /> High-precision academic portal management
            </p>
          </div>
          <Button onClick={publishTest} disabled={isPublishing || importedQuestions.length === 0} className="rounded-2xl h-16 px-10 font-black bg-primary text-black shadow-neon transition-transform active:scale-95 uppercase tracking-widest text-xs">
            {isPublishing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Plus className="w-5 h-5 mr-2" />}
            Finalize & Sync Portal
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-8">
            <Card className="rounded-[2.5rem] border-border bg-card/40 backdrop-blur-xl shadow-2xl">
              <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-primary" /> Global Matrix
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Test Identifier</Label>
                  <input placeholder="E.g. JEE-Adv Phase 01" className="flex h-12 w-full rounded-xl border border-input bg-muted/20 px-4 py-2 text-sm focus:ring-1 focus:ring-primary" value={testConfig.title} onChange={e => setTestConfig({...testConfig, title: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Subject</Label>
                    <Select value={testConfig.subject} onValueChange={v => setTestConfig({...testConfig, subject: v as Subject})}>
                      <SelectTrigger className="rounded-xl h-12 bg-muted/20">
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
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Class Level</Label>
                    <Select value={testConfig.classLevel} onValueChange={v => setTestConfig({...testConfig, classLevel: v as ClassLevel})}>
                      <SelectTrigger className="rounded-xl h-12 bg-muted/20">
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
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Duration (Minutes)</Label>
                  <input type="number" className="flex h-12 w-full rounded-xl border border-input bg-muted/20 px-4 py-2 text-sm" value={testConfig.time} onChange={e => setTestConfig({...testConfig, time: parseInt(e.target.value) || 0})} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2 text-center">
                    <Label className="text-[9px] font-black text-primary">VALID (+)</Label>
                    <input type="number" className="flex h-12 w-full rounded-xl border border-primary/20 bg-muted/20 text-center font-bold" value={testConfig.marks} onChange={e => setTestConfig({...testConfig, marks: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2 text-center">
                    <Label className="text-[9px] font-black text-destructive">FAIL (-)</Label>
                    <input type="number" className="flex h-12 w-full rounded-xl border border-destructive/20 bg-muted/20 text-center font-bold" value={testConfig.neg} onChange={e => setTestConfig({...testConfig, neg: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2 text-center">
                    <Label className="text-[9px] font-black text-muted-foreground">SKIP</Label>
                    <input type="number" className="flex h-12 w-full rounded-xl border border-white/5 bg-muted/20 text-center font-bold" value={testConfig.skip} onChange={e => setTestConfig({...testConfig, skip: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-border bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                  <FileUp className="w-5 h-5 text-accent" /> Source Vault
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase text-accent tracking-widest">Question Repository</Label>
                    {sourceFiles.questions.file && (
                      <button onClick={() => removeFile('questions')} className="text-[9px] font-black text-destructive hover:underline flex items-center gap-1 transition-all hover:scale-105">
                        <FileX className="w-3 h-3" /> REMOVE
                      </button>
                    )}
                  </div>
                  <div className="relative group/file">
                    <Input ref={qInputRef} type="file" onChange={handleFileChange('questions')} accept=".pdf,.docx" className="rounded-xl h-12 bg-muted/20 cursor-pointer border-dashed border-accent/30" />
                    {sourceFiles.questions.file && <div className="absolute inset-0 bg-background/95 rounded-xl flex items-center px-4 gap-3 border border-accent/40 shadow-inner">
                      <FileText className="w-5 h-5 text-accent" />
                      <span className="text-xs font-bold truncate flex-1">{sourceFiles.questions.file.name}</span>
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                    </div>}
                  </div>
                </div>

                <div className="space-y-3">
                   <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase text-accent tracking-widest">Answer Integrity Key</Label>
                    {sourceFiles.answerKey.file && (
                      <button onClick={() => removeFile('answerKey')} className="text-[9px] font-black text-destructive hover:underline flex items-center gap-1 transition-all hover:scale-105">
                        <FileX className="w-3 h-3" /> REMOVE
                      </button>
                    )}
                  </div>
                  <div className="relative group/file">
                    <Input ref={aInputRef} type="file" onChange={handleFileChange('answerKey')} accept=".pdf,.docx" className="rounded-xl h-12 bg-muted/20 cursor-pointer border-dashed border-accent/30" />
                    {sourceFiles.answerKey.file && <div className="absolute inset-0 bg-background/95 rounded-xl flex items-center px-4 gap-3 border border-accent/40 shadow-inner">
                      <FileText className="w-5 h-5 text-accent" />
                      <span className="text-xs font-bold truncate flex-1">{sourceFiles.answerKey.file.name}</span>
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                    </div>}
                  </div>
                </div>

                <Button onClick={runAIImport} disabled={importing || !sourceFiles.questions.dataUri} className="w-full h-14 rounded-2xl font-black bg-accent/10 text-accent hover:bg-accent hover:text-black border border-accent/30 shadow-neon-sm transition-all uppercase tracking-widest text-[10px]">
                  {importing ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Wand2 className="w-5 h-5 mr-3" />}
                  {importing ? 'Neural Extraction Active...' : 'Initialize Forensic Extraction'}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-8 space-y-8">
            <Tabs defaultValue="bank" className="w-full">
              <TabsList className="bg-card/40 p-1.5 rounded-2xl border border-border mb-8 shadow-inner">
                <TabsTrigger value="bank" className="rounded-xl px-12 h-11 font-black uppercase tracking-widest text-[10px]">Staging Bank ({importedQuestions.length})</TabsTrigger>
                <TabsTrigger value="manual" className="rounded-xl px-12 h-11 font-black uppercase tracking-widest text-[10px]">Manual Entry</TabsTrigger>
              </TabsList>

              <TabsContent value="bank" className="space-y-5">
                <div className="max-h-[1000px] overflow-y-auto space-y-5 pr-2 custom-scrollbar">
                  {importedQuestions.map((q, idx) => (
                    <Card key={idx} className="rounded-[2rem] border-border bg-card/20 hover:bg-card/40 transition-all group overflow-hidden relative">
                      <div className="p-8 flex flex-col md:flex-row gap-8">
                        <div className="w-14 h-14 rounded-2xl bg-muted/30 border border-white/5 flex items-center justify-center font-black text-xl shrink-0 text-primary shadow-inner">
                          {(idx + 1).toString().padStart(2, '0')}
                        </div>
                        <div className="flex-1 space-y-4">
                          <h4 className="font-bold text-xl leading-snug text-white/90">{q.questionText}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {q.options?.map((opt, i) => (
                              <div key={i} className={`p-4 rounded-xl border text-sm font-bold flex items-center gap-3 transition-all ${opt === q.correctAnswer ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-muted/10 border-white/5 text-muted-foreground'}`}>
                                <span className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black", opt === q.correctAnswer ? "bg-primary text-black" : "bg-white/5")}>
                                  {String.fromCharCode(65 + i)}
                                </span>
                                <div className="flex-1 truncate">{opt}</div>
                                {q.optionCodes?.[i] && <span className="text-[9px] opacity-60 font-mono tracking-widest">[{q.optionCodes[i]}]</span>}
                              </div>
                            ))}
                          </div>
                          {q.explanation && (
                             <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-[11px] font-medium text-muted-foreground italic">
                               <span className="text-primary font-black uppercase tracking-widest mr-2 underline decoration-dotted">EXPLANATION:</span> "{q.explanation}"
                             </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                           <Button variant="ghost" size="icon" className="text-destructive h-12 w-12 rounded-xl hover:bg-destructive/10" onClick={() => setImportedQuestions(prev => prev.filter((_, i) => i !== idx))}>
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {importedQuestions.length === 0 && (
                    <div className="py-40 text-center border-2 border-dashed rounded-[3rem] border-white/10 text-muted-foreground flex flex-col items-center gap-6 opacity-40">
                      <Database className="w-20 h-20" />
                      <div className="space-y-2">
                        <p className="font-black uppercase tracking-[0.3em] text-sm">Forge Is Idle</p>
                        <p className="text-xs font-medium">Synchronize questions via Neural Import or Manual Protocol.</p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="manual" className="space-y-6">
                <Card className="rounded-[3rem] border-border bg-card/40 p-12 shadow-3xl">
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Question Body</Label>
                      <Textarea 
                        placeholder="Type question content..." 
                        className="rounded-2xl min-h-[150px] bg-muted/20 text-lg font-medium border-primary/20" 
                        value={manualQ.questionText}
                        onChange={e => setManualQ({...manualQ, questionText: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {manualQ.options?.map((opt, i) => (
                        <div key={i} className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Option {String.fromCharCode(65 + i)}</Label>
                          <Input 
                            value={opt} 
                            onChange={e => {
                              const newOpts = [...(manualQ.options || [])];
                              newOpts[i] = e.target.value;
                              setManualQ({...manualQ, options: newOpts});
                            }}
                            className="rounded-xl h-12 bg-muted/20"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Correct Answer Reference</Label>
                        <Input 
                          placeholder="Exact match of option text" 
                          className="rounded-xl h-12 bg-muted/20 border-primary/20"
                          value={manualQ.correctAnswer}
                          onChange={e => setManualQ({...manualQ, correctAnswer: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Forensic Explanation</Label>
                        <Input 
                          placeholder="Internal logic reference" 
                          className="rounded-xl h-12 bg-muted/20"
                          value={manualQ.explanation}
                          onChange={e => setManualQ({...manualQ, explanation: e.target.value})}
                        />
                      </div>
                    </div>
                    <Button onClick={addManualQuestion} className="w-full h-16 rounded-2xl font-black bg-primary text-black shadow-neon transition-all hover:scale-[1.02] uppercase tracking-widest text-xs">
                      <Plus className="w-5 h-5 mr-3" /> Insert into Staging
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
