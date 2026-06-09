"use client";

import React, { useState, useRef } from 'react';
import PortalLayout from '@/components/dashboard/PortalLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  BrainCircuit,
  FileSearch,
  Activity,
  Link2,
  Save,
  Cpu,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Question, ClassLevel, Test, QuestionType, Subject, ExamStream } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';

export default function AdminForge() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  
  const qInputRef = useRef<HTMLInputElement>(null);

  const [importing, setImporting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [importedQuestions, setImportedQuestions] = useState<Question[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adminInstructions, setAdminInstructions] = useState('Extract all questions with 4 options. Use forensic codes.');
  const [sourceUrl, setSourceUrl] = useState('');
  
  const [testConfig, setTestConfig] = useState({
    title: '',
    examStream: 'JEE' as ExamStream,
    subject: 'General' as Subject,
    classLevel: '12' as ClassLevel,
    time: 60,
    marks: 4,
    neg: 1,
    skip: 0,
    answerKeyUrl: ''
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
      toast({ variant: "destructive", title: "File Limit Exceeded", description: "Source documents must be under 10MB." });
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

  const generateOptionCodes = () => {
    return Array.from({length: 4}, () => Math.floor(1000 + Math.random() * 9000).toString());
  };

  const addManualQuestion = () => {
    if (!manualQ.questionText || !manualQ.correctAnswer) {
      toast({ variant: "destructive", title: "Validation Failed", description: "Question content and valid answer required." });
      return;
    }
    const newQ: Question = {
      id: uuidv4(),
      questionText: manualQ.questionText!,
      questionType: manualQ.questionType as QuestionType,
      options: manualQ.options || ['', '', '', ''],
      optionCodes: generateOptionCodes(),
      correctAnswer: manualQ.correctAnswer!,
      explanation: manualQ.explanation,
      subject: testConfig.subject,
      classLevel: testConfig.classLevel
    };
    setImportedQuestions(prev => [...prev, newQ]);
    setManualQ({ ...manualQ, questionText: '', correctAnswer: '', explanation: '', options: ['', '', '', ''] });
    toast({ title: "Matrix Updated", description: "Manual item injected into staging bank." });
  };

  const runAIImport = async () => {
    if (!sourceFiles.questions.dataUri && !sourceUrl) {
      toast({ variant: "destructive", title: "Source Missing", description: "Upload a document or provide a Drive URL to initialize extraction." });
      return;
    }
    setImporting(true);
    try {
      const result = await adminAutoImportQuestions({
        fileDataUri: sourceFiles.questions.dataUri || undefined,
        sourceUrl: sourceUrl || undefined,
        fileName: sourceFiles.questions.file?.name || 'source.pdf',
        adminInstructions: `Target Stream: ${testConfig.examStream}, Class Level: ${testConfig.classLevel}. Custom Prompt: ${adminInstructions}`
      });
      
      const sanitized = result.map(q => ({
        ...q,
        optionCodes: q.optionCodes && q.optionCodes.length === 4 ? q.optionCodes : generateOptionCodes()
      }));

      setImportedQuestions(prev => [...prev, ...sanitized]);
      toast({ title: "Neural Success", description: `Injected ${result.length} questions into the bank.` });
    } catch (err: any) {
      console.error("Extraction Error:", err);
      toast({ 
        variant: "destructive", 
        title: "Neural Pipeline Error", 
        description: err.message || "Failed to parse document. Check instructions or format." 
      });
    } finally {
      setImporting(false);
    }
  };

  const publishTest = async () => {
    if (!user || importedQuestions.length === 0) {
      toast({ variant: "destructive", title: "Forge Empty", description: "No questions detected." });
      return;
    }
    setIsPublishing(true);
    const testId = uuidv4();
    const finalTest: Test = {
      id: testId,
      title: testConfig.title || "Portal Evaluation",
      description: `${testConfig.examStream} Academic Audit - Class ${testConfig.classLevel}`,
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
      adminId: user.uid,
      answerKeyUrl: testConfig.answerKeyUrl
    };

    try {
      await setDoc(doc(db, 'tests', testId), finalTest);
      toast({ title: "Evaluation Live", description: "Sync Complete." });
      setImportedQuestions([]);
      setTestConfig({ ...testConfig, title: '', answerKeyUrl: '' });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed", description: "Database error." });
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
              <Cpu className="w-4 h-4 text-primary" /> SYSTEM ADMINISTRATOR • Matrix Control
            </p>
          </div>
          <Button onClick={publishTest} disabled={isPublishing || importedQuestions.length === 0} className="rounded-2xl h-16 px-10 font-black bg-primary text-black shadow-neon transition-all hover:scale-105 uppercase tracking-widest text-xs">
            {isPublishing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <ShieldCheck className="w-5 h-5 mr-2" />}
            Sync To Portal
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-8">
            <Card className="rounded-[3rem] border-border bg-card/40 backdrop-blur-xl shadow-2xl">
              <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-primary" /> Matrix Config
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Test Identifier</Label>
                  <input placeholder="E.g. JEE Advanced Mock 01" className="flex h-14 w-full rounded-2xl border border-input bg-muted/20 px-5 text-sm font-bold" value={testConfig.title} onChange={e => setTestConfig({...testConfig, title: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Answer Key Reference URL</Label>
                  <div className="relative">
                    <Link2 className="absolute left-4 top-4.5 h-4 w-4 text-muted-foreground" />
                    <input placeholder="https://drive.google.com/..." className="flex h-14 w-full rounded-2xl border border-input bg-muted/20 pl-12 pr-5 text-sm font-medium" value={testConfig.answerKeyUrl} onChange={e => setTestConfig({...testConfig, answerKeyUrl: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Stream</Label>
                    <Select value={testConfig.examStream} onValueChange={v => setTestConfig({...testConfig, examStream: v as ExamStream})}>
                      <SelectTrigger className="rounded-2xl h-14 bg-muted/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="JEE">JEE (Phy, Chem, Math)</SelectItem>
                        <SelectItem value="NEET">NEET (Phy, Chem, Bio)</SelectItem>
                        <SelectItem value="General">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Class</Label>
                    <Select value={testConfig.classLevel} onValueChange={v => setTestConfig({...testConfig, classLevel: v as ClassLevel})}>
                      <SelectTrigger className="rounded-2xl h-14 bg-muted/20">
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
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2 text-center">
                    <Label className="text-[9px] font-black text-primary">VALID</Label>
                    <input type="number" className="flex h-14 w-full rounded-2xl border border-primary/20 bg-muted/20 text-center font-black" value={testConfig.marks} onChange={e => setTestConfig({...testConfig, marks: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2 text-center">
                    <Label className="text-[9px] font-black text-destructive">FAIL</Label>
                    <input type="number" className="flex h-14 w-full rounded-2xl border border-destructive/20 bg-muted/20 text-center font-black" value={testConfig.neg} onChange={e => setTestConfig({...testConfig, neg: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2 text-center">
                    <Label className="text-[9px] font-black text-muted-foreground">SKIP</Label>
                    <input type="number" className="flex h-14 w-full rounded-2xl border border-white/5 bg-muted/20 text-center font-black" value={testConfig.skip} onChange={e => setTestConfig({...testConfig, skip: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[3rem] border-border bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-accent" /> Neural Source
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase text-accent tracking-widest">Source Document (PDF)</Label>
                    {sourceFiles.questions.file && (
                      <button onClick={removeFile} className="text-[9px] font-black text-destructive hover:underline flex items-center gap-1">
                        <FileX className="w-3 h-3" /> CLEAR
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input ref={qInputRef} type="file" onChange={handleFileChange} accept=".pdf,.docx" className="rounded-2xl h-14 bg-muted/20 border-dashed border-accent/30" />
                    {sourceFiles.questions.file && <div className="absolute inset-0 bg-background rounded-2xl flex items-center px-5 gap-3 border border-accent/40 shadow-inner">
                      <FileText className="w-6 h-6 text-accent" />
                      <span className="text-xs font-black truncate flex-1">{sourceFiles.questions.file.name}</span>
                      <CheckCircle2 className="w-5 h-5 text-accent" />
                    </div>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-accent/70 tracking-widest">Drive / Source URL</Label>
                  <div className="relative">
                    <Link2 className="absolute left-4 top-4.5 h-4 w-4 text-muted-foreground" />
                    <input 
                      placeholder="Paste Drive link for AI reference..." 
                      className="flex h-14 w-full rounded-2xl border border-input bg-muted/10 pl-12 pr-5 text-sm font-medium" 
                      value={sourceUrl} 
                      onChange={e => setSourceUrl(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-accent/70 tracking-widest">Neural Instructions</Label>
                   <Textarea 
                     placeholder="E.g. Focus on Physics section only..." 
                     className="rounded-xl h-24 bg-muted/10 border-accent/20 text-xs"
                     value={adminInstructions}
                     onChange={e => setAdminInstructions(e.target.value)}
                   />
                </div>
                <Button onClick={runAIImport} disabled={importing || (!sourceFiles.questions.dataUri && !sourceUrl)} className="w-full h-16 rounded-[2rem] font-black bg-accent/10 text-accent hover:bg-accent hover:text-black border border-accent/30 uppercase tracking-widest text-[10px]">
                  {importing ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Zap className="w-5 h-5 mr-3" />}
                  {importing ? "EXTRACTING..." : "RUN NEURAL EXTRACTION"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-8 space-y-8">
            <Tabs defaultValue="bank" className="w-full">
              <div className="flex items-center justify-between mb-8">
                <TabsList className="bg-card/40 p-1.5 rounded-[2rem] border border-border">
                  <TabsTrigger value="bank" className="rounded-[1.5rem] px-12 h-12 font-black uppercase tracking-widest text-[10px]">Staging Bank</TabsTrigger>
                  <TabsTrigger value="manual" className="rounded-[1.5rem] px-12 h-12 font-black uppercase tracking-widest text-[10px]">Manual Entry</TabsTrigger>
                </TabsList>
                {importedQuestions.length > 0 && (
                  <div className="px-8 py-3 rounded-[1.5rem] bg-primary/10 border border-primary/20 flex items-center gap-4">
                    <Activity className="w-5 h-5 text-primary animate-pulse" />
                    <span className="text-xs font-black text-primary uppercase tracking-widest">{importedQuestions.length} Items Indexed</span>
                  </div>
                )}
              </div>

              <TabsContent value="bank" className="space-y-6">
                <div className="max-h-[1200px] overflow-y-auto space-y-6 pr-3 custom-scrollbar">
                  {importedQuestions.map((q, idx) => (
                    <Card key={q.id} className="rounded-[3rem] border-border bg-card/20 hover:bg-card/40 transition-all group overflow-hidden shadow-xl">
                      {editingId === q.id ? (
                        <div className="p-10 space-y-8">
                           <div className="space-y-3">
                              <Label className="text-[10px] font-black uppercase text-primary">Edit Question</Label>
                              <Textarea className="rounded-2xl bg-muted/40 font-medium text-lg min-h-[150px]" defaultValue={q.questionText} onBlur={(e) => {
                                const updated = { ...q, questionText: e.target.value };
                                setImportedQuestions(prev => prev.map(item => item.id === q.id ? updated : item));
                              }} />
                           </div>
                           <div className="grid grid-cols-2 gap-6">
                              {q.options?.map((opt, i) => (
                                <div key={i} className="space-y-2">
                                  <Label className="text-[9px] font-black uppercase text-muted-foreground">Option {String.fromCharCode(65+i)}</Label>
                                  <Input className="rounded-xl h-12 bg-muted/40 font-bold" defaultValue={opt} onBlur={(e) => {
                                    const newOpts = [...(q.options || [])];
                                    newOpts[i] = e.target.value;
                                    setImportedQuestions(prev => prev.map(item => item.id === q.id ? { ...item, options: newOpts } : item));
                                  }} />
                                </div>
                              ))}
                           </div>
                           <div className="flex items-center justify-between gap-6 pt-6">
                             <div className="flex-1 space-y-2">
                                <Label className="text-[10px] font-black uppercase text-primary">Correct Selection</Label>
                                <Select value={q.correctAnswer} onValueChange={v => {
                                  setImportedQuestions(prev => prev.map(item => item.id === q.id ? { ...item, correctAnswer: v } : item));
                                }}>
                                  <SelectTrigger className="rounded-xl h-12 bg-muted/40">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {q.options?.map((opt, i) => (
                                      <SelectItem key={i} value={opt}>Option {String.fromCharCode(65 + i)}: {opt}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                             </div>
                             <Button size="lg" onClick={() => setEditingId(null)} className="rounded-xl bg-primary text-black font-black px-10 h-12">
                               <Save className="w-5 h-5 mr-3" /> Save Item
                             </Button>
                           </div>
                        </div>
                      ) : (
                        <div className="p-10 flex items-start gap-10">
                          <div className="w-16 h-16 rounded-[1.5rem] bg-muted/30 border border-white/5 flex items-center justify-center font-black text-2xl shrink-0 text-primary shadow-inner">
                            {(idx + 1).toString().padStart(2, '0')}
                          </div>
                          <div className="flex-1 space-y-6">
                            <h4 className="font-headline font-black text-2xl leading-snug text-white/95">{q.questionText}</h4>
                            <div className="grid grid-cols-2 gap-4">
                              {q.options?.map((opt, i) => (
                                <div key={i} className={cn(
                                  "p-5 rounded-2xl border-2 text-sm font-bold flex items-center gap-4 transition-all",
                                  opt === q.correctAnswer ? "bg-primary/10 border-primary/40 text-primary" : "bg-white/2 border-white/5 text-muted-foreground/50"
                                )}>
                                  <span className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[10px] font-black">{String.fromCharCode(65 + i)}</span>
                                  <div className="flex-1 truncate">{opt}</div>
                                  <span className="text-[9px] opacity-40 font-mono">[{q.optionCodes?.[i]}]</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-3">
                             <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-primary hover:bg-primary/10" onClick={() => setEditingId(q.id)}><Edit3 className="w-6 h-6" /></Button>
                             <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-destructive hover:bg-destructive/10" onClick={() => setImportedQuestions(prev => prev.filter(item => item.id !== q.id))}><Trash2 className="w-6 h-6" /></Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                  {importedQuestions.length === 0 && (
                    <div className="py-60 text-center border-4 border-dashed rounded-[4rem] border-white/5 text-muted-foreground opacity-30">
                      <FileSearch className="w-24 h-24 mx-auto mb-8" />
                      <p className="font-black uppercase tracking-widest text-lg">Staging Bank Empty</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="manual" className="space-y-8">
                <Card className="rounded-[4rem] border-border bg-card/40 p-16 shadow-3xl">
                  <div className="space-y-10">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Question Body</Label>
                      <Textarea 
                        placeholder="Type manual question here..." 
                        className="rounded-3xl min-h-[200px] bg-muted/20 text-xl font-medium border-primary/20 p-8" 
                        value={manualQ.questionText}
                        onChange={e => setManualQ({...manualQ, questionText: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      {(manualQ.options || ['', '', '', '']).map((opt, i) => (
                        <div key={i} className="space-y-3">
                          <Label className="text-[9px] font-black text-muted-foreground uppercase">Option {String.fromCharCode(65 + i)}</Label>
                          <Input className="rounded-2xl h-14 bg-muted/20 border-white/10 font-bold" value={opt} onChange={e => {
                            const newOpts = [...(manualQ.options || ['', '', '', ''])];
                            newOpts[i] = e.target.value;
                            setManualQ({...manualQ, options: newOpts});
                          }} />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-4 pt-6">
                       <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Mark Correct Answer</Label>
                       <RadioGroup value={manualQ.correctAnswer} onValueChange={v => setManualQ({...manualQ, correctAnswer: v})} className="grid grid-cols-4 gap-6">
                          {(manualQ.options || []).map((opt, i) => (
                            <Label key={i} className={cn(
                              "flex items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all cursor-pointer font-black uppercase tracking-widest text-[10px]",
                              manualQ.correctAnswer === opt ? "bg-primary border-primary text-black" : "bg-white/5 border-white/10 text-muted-foreground"
                            )}>
                              <RadioGroupItem value={opt} className="sr-only" />
                              {String.fromCharCode(65 + i)} {manualQ.correctAnswer === opt && <CheckCircle2 className="w-4 h-4" />}
                            </Label>
                          ))}
                       </RadioGroup>
                    </div>
                    <Button onClick={addManualQuestion} className="w-full h-20 rounded-[2.5rem] font-black bg-primary text-black uppercase tracking-[0.3em] text-sm hover:scale-[1.02] transition-transform shadow-neon">
                      Incorporate Into Bank
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