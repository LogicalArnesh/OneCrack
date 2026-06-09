"use client";

import React, { useState, useRef } from 'react';
import PortalLayout from '@/components/dashboard/PortalLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/select';
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
  Edit3,
  Save,
  X,
  BrainCircuit,
  Terminal,
  FileSearch,
  Activity,
  Cpu
} from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Question, ClassLevel, Test, QuestionType, Subject, ExamStream } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  
  const qInputRef = useRef<HTMLInputElement>(null);

  const [importing, setImporting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [importedQuestions, setImportedQuestions] = useState<Question[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adminInstructions, setAdminInstructions] = useState('Detect subject automatically. Extract all questions and their 4 options. Identify correct answer from context.');
  
  const [testConfig, setTestConfig] = useState({
    title: '',
    examStream: 'JEE' as ExamStream,
    subject: 'General' as Subject,
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
  }>({
    questions: { file: null, dataUri: null }
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Source documents must be under 10MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSourceFiles({
        questions: { file, dataUri: reader.result as string }
      });
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setSourceFiles({ questions: { file: null, dataUri: null } });
    if (qInputRef.current) qInputRef.current.value = '';
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
      options: manualQ.options || ['', '', '', ''],
      optionCodes: Array.from({length: 4}, () => Math.floor(1000 + Math.random() * 9000).toString()),
      correctAnswer: manualQ.correctAnswer!,
      explanation: manualQ.explanation,
      subject: testConfig.subject,
      classLevel: testConfig.classLevel
    };
    setImportedQuestions(prev => [...prev, newQ]);
    setManualQ({ ...manualQ, questionText: '', correctAnswer: '', explanation: '', options: ['', '', '', ''] });
    toast({ title: "Entry Verified", description: "Question added to staging bank." });
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
        fileName: sourceFiles.questions.file?.name || 'source.pdf',
        adminInstructions: `Stream: ${testConfig.examStream}, Class: ${testConfig.classLevel}. ${adminInstructions}`
      });
      
      setImportedQuestions(prev => [...prev, ...result]);
      toast({ title: "Neural Extraction Complete", description: `Successfully analyzed ${result.length} items.` });
    } catch (err: any) {
      console.error(err);
      toast({ 
        variant: "destructive", 
        title: "AI Extraction Error", 
        description: err.message || "Failed to parse document." 
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
      description: `${testConfig.examStream} High-Integrity Test - Class ${testConfig.classLevel}`,
      subject: testConfig.subject,
      examStream: testConfig.examStream,
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
      toast({ title: "Portal Synchronized", description: "Evaluation is now live." });
      setImportedQuestions([]);
      setTestConfig({ ...testConfig, title: '' });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failure", description: "Database transaction failed." });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-10 pb-20 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-headline font-black tracking-tighter neon-text text-primary">Evaluation Forge</h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" /> High-precision academic portal management
            </p>
          </div>
          <Button onClick={publishTest} disabled={isPublishing || importedQuestions.length === 0} className="rounded-2xl h-16 px-10 font-black bg-primary text-black shadow-neon transition-transform active:scale-95 uppercase tracking-widest text-xs">
            {isPublishing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Plus className="w-5 h-5 mr-2" />}
            Finalize Evaluation
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-8">
            <Card className="rounded-[2.5rem] border-border bg-card/40 backdrop-blur-xl shadow-2xl">
              <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-primary" /> Matrix Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Test Title</Label>
                  <input placeholder="E.g. JEE-Adv Phase 01" className="flex h-12 w-full rounded-xl border border-input bg-muted/20 px-4 py-2 text-sm" value={testConfig.title} onChange={e => setTestConfig({...testConfig, title: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Exam Stream</Label>
                    <Select value={testConfig.examStream} onValueChange={v => setTestConfig({...testConfig, examStream: v as ExamStream})}>
                      <SelectTrigger className="rounded-xl h-12 bg-muted/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="JEE">JEE (PCM)</SelectItem>
                        <SelectItem value="NEET">NEET (PCB)</SelectItem>
                        <SelectItem value="General">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Target Class</Label>
                    <Select value={testConfig.classLevel} onValueChange={v => setTestConfig({...testConfig, classLevel: v as ClassLevel})}>
                      <SelectTrigger className="rounded-xl h-12 bg-muted/20">
                        <SelectValue />
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
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Primary Subject</Label>
                  <Select value={testConfig.subject} onValueChange={v => setTestConfig({...testConfig, subject: v as Subject})}>
                    <SelectTrigger className="rounded-xl h-12 bg-muted/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Physics">Physics</SelectItem>
                      <SelectItem value="Chemistry">Chemistry</SelectItem>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="Biology">Biology</SelectItem>
                      <SelectItem value="General">General</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <BrainCircuit className="w-5 h-5 text-accent" /> AI Neural Forge
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase text-accent tracking-widest">Source PDF/Doc</Label>
                    {sourceFiles.questions.file && (
                      <button onClick={removeFile} className="text-[9px] font-black text-destructive hover:underline flex items-center gap-1">
                        <FileX className="w-3 h-3" /> REMOVE
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input ref={qInputRef} type="file" onChange={handleFileChange} accept=".pdf,.docx" className="rounded-xl h-12 bg-muted/20 border-dashed border-accent/30" />
                    {sourceFiles.questions.file && <div className="absolute inset-0 bg-background rounded-xl flex items-center px-4 gap-3 border border-accent/40">
                      <FileText className="w-5 h-5 text-accent" />
                      <span className="text-xs font-bold truncate flex-1">{sourceFiles.questions.file.name}</span>
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                    </div>}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-accent tracking-widest">Neural Instructions</Label>
                  <Textarea 
                    placeholder="Give specific parsing rules (e.g. only extract chemistry section)..." 
                    className="rounded-xl bg-muted/20 border-accent/20 min-h-[100px] text-xs font-mono"
                    value={adminInstructions}
                    onChange={e => setAdminInstructions(e.target.value)}
                  />
                </div>

                <Button onClick={runAIImport} disabled={importing || !sourceFiles.questions.dataUri} className="w-full h-14 rounded-2xl font-black bg-accent/10 text-accent hover:bg-accent hover:text-black border border-accent/30 uppercase tracking-widest text-[10px]">
                  {importing ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Wand2 className="w-5 h-5 mr-3" />}
                  Initialize Extraction
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-8 space-y-8">
            <Tabs defaultValue="bank" className="w-full">
              <div className="flex items-center justify-between mb-8">
                <TabsList className="bg-card/40 p-1 rounded-2xl border border-border">
                  <TabsTrigger value="bank" className="rounded-xl px-10 h-11 font-black uppercase tracking-widest text-[10px]">Staging Bank</TabsTrigger>
                  <TabsTrigger value="manual" className="rounded-xl px-10 h-11 font-black uppercase tracking-widest text-[10px]">Manual Entry</TabsTrigger>
                </TabsList>
                {importedQuestions.length > 0 && (
                  <div className="px-6 py-2 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
                    <Activity className="w-4 h-4 text-primary animate-pulse" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">{importedQuestions.length} Items Indexed</span>
                  </div>
                )}
              </div>

              <TabsContent value="bank" className="space-y-5">
                <div className="max-h-[1000px] overflow-y-auto space-y-5 pr-2 custom-scrollbar">
                  {importedQuestions.map((q, idx) => (
                    <Card key={q.id} className="rounded-[2rem] border-border bg-card/20 hover:bg-card/40 transition-all group overflow-hidden">
                      {editingId === q.id ? (
                        <div className="p-8 space-y-6">
                           <Textarea className="rounded-xl bg-muted/30" defaultValue={q.questionText} onBlur={(e) => {
                             const updated = { ...q, questionText: e.target.value };
                             setImportedQuestions(prev => prev.map(item => item.id === q.id ? updated : item));
                           }} />
                           <div className="grid grid-cols-2 gap-4">
                              {q.options?.map((opt, i) => (
                                <Input key={i} className="rounded-xl bg-muted/30" defaultValue={opt} onBlur={(e) => {
                                  const newOpts = [...(q.options || [])];
                                  newOpts[i] = e.target.value;
                                  setImportedQuestions(prev => prev.map(item => item.id === q.id ? { ...item, options: newOpts } : item));
                                }} />
                              ))}
                           </div>
                           <Button size="sm" onClick={() => setEditingId(null)} className="rounded-xl bg-primary text-black font-bold">Save Changes</Button>
                        </div>
                      ) : (
                        <div className="p-8 flex items-start gap-8">
                          <div className="w-14 h-14 rounded-2xl bg-muted/30 border border-white/5 flex items-center justify-center font-black text-xl shrink-0 text-primary">
                            {(idx + 1).toString().padStart(2, '0')}
                          </div>
                          <div className="flex-1 space-y-4">
                            <h4 className="font-bold text-xl leading-snug text-white/90">{q.questionText}</h4>
                            <div className="grid grid-cols-2 gap-3">
                              {q.options?.map((opt, i) => (
                                <div key={i} className={`p-4 rounded-xl border text-sm font-bold flex items-center gap-3 ${opt === q.correctAnswer ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-muted/10 border-white/5 text-muted-foreground'}`}>
                                  <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px]">{String.fromCharCode(65 + i)}</span>
                                  <div className="flex-1 truncate">{opt}</div>
                                  <span className="text-[9px] opacity-40 font-mono">[{q.optionCodes?.[i]}]</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                             <Button variant="ghost" size="icon" className="text-primary" onClick={() => setEditingId(q.id)}><Edit3 className="w-5 h-5" /></Button>
                             <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setImportedQuestions(prev => prev.filter(item => item.id !== q.id))}><Trash2 className="w-5 h-5" /></Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                  {importedQuestions.length === 0 && (
                    <div className="py-40 text-center border-2 border-dashed rounded-[3rem] border-white/10 text-muted-foreground opacity-40">
                      <FileSearch className="w-20 h-20 mx-auto mb-6" />
                      <p className="font-black uppercase tracking-widest text-sm">Staging Bank Is Idle</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="manual" className="space-y-6">
                <Card className="rounded-[3rem] border-border bg-card/40 p-12">
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Question Content</Label>
                      <Textarea 
                        placeholder="Type question text..." 
                        className="rounded-2xl min-h-[150px] bg-muted/20 text-lg font-medium border-primary/20" 
                        value={manualQ.questionText}
                        onChange={e => setManualQ({...manualQ, questionText: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      {(manualQ.options || ['', '', '', '']).map((opt, i) => (
                        <Input key={i} placeholder={`Option ${String.fromCharCode(65 + i)}`} className="rounded-xl h-12 bg-muted/20" value={opt} onChange={e => {
                          const newOpts = [...(manualQ.options || ['', '', '', ''])];
                          newOpts[i] = e.target.value;
                          setManualQ({...manualQ, options: newOpts});
                        }} />
                      ))}
                    </div>
                    <Button onClick={addManualQuestion} className="w-full h-16 rounded-2xl font-black bg-primary text-black uppercase tracking-widest text-xs">
                      Insert Into Bank
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
