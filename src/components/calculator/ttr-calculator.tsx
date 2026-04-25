"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  RotateCcw, 
  ArrowRight,
  ArrowLeft,
  Settings2,
  Activity,
  Save,
  Loader2
} from "lucide-react";
import { 
  calculateExpectedRatio, 
  calculateErrorPercent, 
  getStatus, 
  VECTOR_GROUP_MAPPING,
  generateTaps,
  calculateLineCurrent
} from "@/lib/ttr-utils";
import { useFirestore, useAuth, useUser } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { collection, addDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type MeasuredValues = Record<string, { R: string; Y: string; B: string }>;

interface TTRCalculatorProps {
  initialData?: any | null;
}

export function TTRCalculator({ initialData }: TTRCalculatorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const auth = useAuth();
  const { user } = useUser();
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  
  const [workOrderNo, setWorkOrderNo] = useState<string>(initialData?.workOrderNo || '');
  const [hvLine, setHvLine] = useState<string>(initialData?.hvLine?.toString() || '11000');
  const [lvLine, setLvLine] = useState<string>(initialData?.lvLine?.toString() || '415');
  const [kvaRating, setKvaRating] = useState<string>(initialData?.kvaRating?.toString() || '1000');
  const [vectorGroup, setVectorGroup] = useState<string>(initialData?.vectorGroup || 'Dyn11');
  const [totalTaps, setTotalTaps] = useState<string>(initialData?.totalTaps?.toString() || '5');
  const [nominalTap, setNominalTap] = useState<string>(initialData?.nominalTap?.toString() || '3');
  const [tapStep, setTapStep] = useState<string>(initialData?.tapStep?.toString() || '2.5');
  const [transformerId, setTransformerId] = useState<string>(initialData?.transformerId || '');
  const [operatorName, setOperatorName] = useState<string>(initialData?.operatorName || '');
  const [authorizedAuthority, setAuthorizedAuthority] = useState<string>(initialData?.authorizedAuthority || '');
  const [testDate, setTestDate] = useState<string>(initialData?.testDate || new Date().toISOString().split('T')[0]);

  const [measurements, setMeasurements] = useState<MeasuredValues>(initialData?.initialMeasurements || {});

  useEffect(() => {
    if (!user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, auth]);

  const taps = useMemo(() => {
    return generateTaps(Number(totalTaps) || 0, Number(nominalTap) || 0, Number(tapStep) || 0);
  }, [totalTaps, nominalTap, tapStep]);

  const hvCurrent = useMemo(() => calculateLineCurrent(Number(kvaRating), Number(hvLine)), [kvaRating, hvLine]);
  const lvCurrent = useMemo(() => calculateLineCurrent(Number(kvaRating), Number(lvLine)), [kvaRating, lvLine]);

  const handleMeasuredChange = (tapPercent: number, phase: 'R' | 'Y' | 'B', value: string) => {
    const tapKey = tapPercent.toString();
    setMeasurements(prev => ({
      ...prev,
      [tapKey]: {
        ...(prev[tapKey] || { R: '', Y: '', B: '' }),
        [phase]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!user) {
      toast({ title: "Auth Required", description: "Waiting for anonymous session...", variant: "destructive" });
      return;
    }

    setSaving(true);
    const data = {
      workOrderNo,
      transformerId,
      operatorName,
      authorizedAuthority,
      testDate,
      hvLine: Number(hvLine),
      lvLine: Number(lvLine),
      kvaRating: Number(kvaRating),
      vectorGroup,
      totalTaps: Number(totalTaps),
      nominalTap: Number(nominalTap),
      tapStep: Number(tapStep),
      initialMeasurements: measurements,
      finalMeasurements: measurements,
      creatorId: user.uid,
      updatedAt: Timestamp.now(),
    };

    try {
      if (initialData?.id) {
        const docRef = doc(db, 'test_reports', initialData.id);
        await updateDoc(docRef, data);
        toast({ title: "Updated", description: "Report updated successfully." });
        router.push(`/report/${initialData.id}`);
      } else {
        const docRef = await addDoc(collection(db, 'test_reports'), {
          ...data,
          createdAt: Timestamp.now(),
        });
        toast({ title: "Saved", description: "New report created successfully." });
        router.push(`/report/${docRef.id}`);
      }
    } catch (error: any) {
      const permissionError = new FirestorePermissionError({
        path: initialData?.id ? `test_reports/${initialData.id}` : 'test_reports',
        operation: initialData?.id ? 'update' : 'create',
        requestResourceData: data,
      });
      errorEmitter.emit('permission-error', permissionError);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("Clear all data and start over?")) {
      window.location.href = '/';
    }
  };

  const isPage1Valid = hvLine && lvLine && kvaRating && vectorGroup && totalTaps && nominalTap && tapStep;

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-4 md:py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-xl md:text-3xl font-black tracking-tighter text-primary uppercase leading-tight">
            GTS TTR TEST SYSTEM
          </h1>
          <p className="text-muted-foreground font-black uppercase text-[9px] md:text-[10px] tracking-widest">Ratio Error Calculator</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={handleReset} className="font-bold flex-1 md:flex-none h-11 md:h-9">
            <RotateCcw className="h-4 w-4 mr-2" />
            New
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleSave} 
            disabled={saving || !isPage1Valid}
            className="font-bold flex-1 md:flex-none bg-primary h-11 md:h-9"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 md:gap-4 overflow-x-auto pb-2 scrollbar-hide">
        <button 
          onClick={() => setStep(1)}
          className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-full border transition-all whitespace-nowrap ${step === 1 ? 'bg-primary text-white border-primary shadow-lg' : 'bg-muted text-muted-foreground border-transparent'}`}
        >
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-[10px] font-bold">1</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Specs</span>
        </button>
        <div className="h-px w-6 md:w-16 bg-muted-foreground/20 shrink-0" />
        <button 
          disabled={!isPage1Valid}
          onClick={() => isPage1Valid && setStep(2)}
          className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-full border transition-all whitespace-nowrap ${step === 2 ? 'bg-primary text-white border-primary shadow-lg' : 'bg-muted text-muted-foreground border-transparent disabled:opacity-50'}`}
        >
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-[10px] font-bold">2</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Results</span>
        </button>
      </div>

      {step === 1 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-lg border-muted-foreground/10">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-[12px] md:text-[14px] font-black uppercase tracking-widest">Administrative Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-black text-[11px] uppercase text-muted-foreground">Work Order Number</Label>
                  <Input placeholder="e.g. WO-5521" value={workOrderNo} onChange={(e) => setWorkOrderNo(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-[11px] uppercase text-muted-foreground">Transformer Serial Number</Label>
                  <Input placeholder="e.g. TX-10042" value={transformerId} onChange={(e) => setTransformerId(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-[11px] uppercase text-muted-foreground">Testing Persons Name</Label>
                  <Input placeholder="Enter Name" value={operatorName} onChange={(e) => setOperatorName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-[11px] uppercase text-muted-foreground">Authorized Authority</Label>
                  <Input placeholder="Enter Authority" value={authorizedAuthority} onChange={(e) => setAuthorizedAuthority(e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="font-black text-[11px] uppercase text-muted-foreground">Test Date</Label>
                  <Input type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-muted-foreground/10">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-[12px] md:text-[14px] font-black uppercase tracking-widest flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                Technical Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
              <div className="space-y-2">
                <Label className="font-black text-[11px] uppercase text-muted-foreground">KVA Rating</Label>
                <Input type="number" inputMode="numeric" value={kvaRating} onChange={(e) => setKvaRating(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="font-black text-[11px] uppercase text-muted-foreground">Vector Group</Label>
                <Select value={vectorGroup} onValueChange={setVectorGroup}>
                  <SelectTrigger className="font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(VECTOR_GROUP_MAPPING).map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-black text-[11px] uppercase text-muted-foreground">HV Rating (V)</Label>
                <Input type="number" inputMode="numeric" value={hvLine} onChange={(e) => setHvLine(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="font-black text-[11px] uppercase text-muted-foreground">LV Rating (V)</Label>
                <Input type="number" inputMode="numeric" value={lvLine} onChange={(e) => setLvLine(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="font-black text-[11px] uppercase text-muted-foreground">HV Current (A)</Label>
                <Input type="text" readOnly value={hvCurrent.toFixed(2)} className="bg-muted font-black text-primary" />
              </div>
              <div className="space-y-2">
                <Label className="font-black text-[11px] uppercase text-muted-foreground">LV Current (A)</Label>
                <Input type="text" readOnly value={lvCurrent.toFixed(2)} className="bg-muted font-black text-primary" />
              </div>
              <div className="space-y-2">
                <Label className="font-black text-[11px] uppercase text-muted-foreground">Total Taps</Label>
                <Input type="number" inputMode="numeric" value={totalTaps} onChange={(e) => setTotalTaps(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="font-black text-[11px] uppercase text-muted-foreground">Nominal Tap</Label>
                <Input type="number" inputMode="numeric" value={nominalTap} onChange={(e) => setNominalTap(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="font-black text-[11px] uppercase text-muted-foreground">Tap Step (%)</Label>
                <Input type="number" inputMode="decimal" step="0.5" value={tapStep} onChange={(e) => setTapStep(e.target.value)} />
              </div>
              <div className="col-span-full pt-4">
                <Button 
                  className="w-full flex items-center justify-center gap-2 h-14 font-black uppercase tracking-widest shadow-md text-sm" 
                  disabled={!isPage1Valid}
                  onClick={() => setStep(2)}
                >
                  Enter Ratio Measurements
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="shadow-2xl border-muted-foreground/10 overflow-hidden">
            <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between p-4 md:p-6">
              <CardTitle className="text-base md:text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Ratio Verification
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="font-black uppercase text-[9px] md:text-[10px]">
                <ArrowLeft className="h-4 w-4 mr-1 md:mr-2" />
                Specs
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table className="min-w-[800px] md:min-w-full">
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-black w-[50px] md:w-[60px] text-center px-2">Tap</TableHead>
                    <TableHead className="font-black w-[80px] md:w-[90px] px-2 text-[10px] md:text-[11px] uppercase">Tap (%)</TableHead>
                    <TableHead className="font-black w-[100px] md:w-[120px] px-2 text-[10px] md:text-[11px] uppercase">Exp. Ratio</TableHead>
                    <TableHead className="font-black min-w-[100px] px-2 text-[10px] md:text-[11px] uppercase">R Phase</TableHead>
                    <TableHead className="font-black min-w-[100px] px-2 text-[10px] md:text-[11px] uppercase">Y Phase</TableHead>
                    <TableHead className="font-black min-w-[100px] px-2 text-[10px] md:text-[11px] uppercase">B Phase</TableHead>
                    <TableHead className="font-black text-center px-2 text-[10px] md:text-[11px] uppercase">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taps.map((tapPercent, index) => {
                    const tapNo = index + 1;
                    const isNominal = tapNo === Number(nominalTap);
                    const expected = calculateExpectedRatio(Number(hvLine), Number(lvLine), vectorGroup, tapPercent);
                    const tapKey = tapPercent.toString();
                    const m = measurements[tapKey] || { R: '', Y: '', B: '' };
                    
                    const errors = {
                      R: calculateErrorPercent(Number(m.R), expected),
                      Y: calculateErrorPercent(Number(m.Y), expected),
                      B: calculateErrorPercent(Number(m.B), expected)
                    };

                    const isAllMeasured = m.R && m.Y && m.B;
                    const allPass = isAllMeasured && 
                      getStatus(errors.R) === 'Pass' && 
                      getStatus(errors.Y) === 'Pass' && 
                      getStatus(errors.B) === 'Pass';

                    return (
                      <TableRow key={tapPercent} className={`hover:bg-muted/5 transition-colors ${isNominal ? 'bg-primary/5' : ''}`}>
                        <TableCell className="text-center font-black text-muted-foreground px-2">{tapNo}</TableCell>
                        <TableCell className="font-black text-[10px] md:text-xs px-2 whitespace-nowrap">
                          {tapPercent > 0 ? `+${tapPercent}` : tapPercent}%
                        </TableCell>
                        <TableCell className="font-mono text-[10px] md:text-xs text-primary font-black px-2">
                          {expected.toFixed(4)}
                        </TableCell>
                        <TableCell className="px-2">
                          <div className="space-y-1">
                            <Input 
                              type="number" inputMode="decimal" step="0.0001" placeholder="R" className="h-9 md:h-8 text-[11px] md:text-xs font-mono font-bold"
                              value={m.R} onChange={(e) => handleMeasuredChange(tapPercent, 'R', e.target.value)}
                            />
                            {m.R && <span className={`text-[9px] font-black block ${getStatus(errors.R) === 'Fail' ? 'text-destructive' : 'text-success'}`}>{errors.R.toFixed(3)}%</span>}
                          </div>
                        </TableCell>
                        <TableCell className="px-2">
                          <div className="space-y-1">
                            <Input 
                              type="number" inputMode="decimal" step="0.0001" placeholder="Y" className="h-9 md:h-8 text-[11px] md:text-xs font-mono font-bold"
                              value={m.Y} onChange={(e) => handleMeasuredChange(tapPercent, 'Y', e.target.value)}
                            />
                            {m.Y && <span className={`text-[9px] font-black block ${getStatus(errors.Y) === 'Fail' ? 'text-destructive' : 'text-success'}`}>{errors.Y.toFixed(3)}%</span>}
                          </div>
                        </TableCell>
                        <TableCell className="px-2">
                          <div className="space-y-1">
                            <Input 
                              type="number" inputMode="decimal" step="0.0001" placeholder="B" className="h-9 md:h-8 text-[11px] md:text-xs font-mono font-bold"
                              value={m.B} onChange={(e) => handleMeasuredChange(tapPercent, 'B', e.target.value)}
                            />
                            {m.B && <span className={`text-[9px] font-black block ${getStatus(errors.B) === 'Fail' ? 'text-destructive' : 'text-success'}`}>{errors.B.toFixed(3)}%</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-center px-2">
                          {isAllMeasured ? (
                            allPass ? (
                              <Badge variant="outline" className="bg-success/10 text-success border-success/30 px-2 py-0 text-[10px] font-black uppercase">Pass</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 px-2 py-0 text-[10px] font-black uppercase">Fail</Badge>
                            )
                          ) : (
                            <span className="text-[10px] text-muted-foreground font-black italic">...</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pb-10">
            <Button variant="ghost" onClick={() => setStep(1)} className="font-black uppercase text-xs w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Specs
            </Button>
            <div className="flex gap-4 w-full sm:w-auto">
              <Button 
                size="lg" 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-3 bg-primary hover:bg-primary/90 px-8 h-14 font-black uppercase text-sm tracking-widest shadow-xl flex-1 sm:flex-none"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} 
                {initialData?.id ? 'Update' : 'Generate'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}