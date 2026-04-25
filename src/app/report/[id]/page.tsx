"use client";

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Printer } from "lucide-react";
import { 
  calculateExpectedRatio, 
  calculateErrorPercent, 
  generateTaps,
  formatDateToDDMMYYYY,
  calculateLineCurrent
} from "@/lib/ttr-utils";
import Link from 'next/link';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

const VerificationTable = ({ 
  measurements, 
  taps, 
  hvLine, 
  lvLine, 
  vectorGroup, 
  nominalTap 
}: { 
  measurements: Record<string, any>,
  taps: number[],
  hvLine: number,
  lvLine: number,
  vectorGroup: string,
  nominalTap: number
}) => {
  if (!measurements || Object.keys(measurements).length === 0) return null;
  
  return (
    <div className="mb-6 overflow-x-auto print:overflow-visible">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-6 w-1.5 bg-primary" />
        <h3 className="text-[16px] font-black text-primary uppercase tracking-widest">VOLTAGE RATIO TEST</h3>
      </div>
      <table className="w-full border-collapse text-[11px] border-2 border-black min-w-[700px] print:min-w-0">
        <thead>
          <tr className="bg-muted font-black border-b-2 border-black text-left">
            <th className="p-1.5 border border-black text-center w-8">Tap</th>
            <th className="p-1.5 border border-black text-center">HV Volt</th>
            <th className="p-1.5 border border-black text-center">LV Volt</th>
            <th className="p-1.5 border border-black text-center">Exp. Ratio</th>
            <th className="p-1.5 border border-black text-center">Meas. (R)</th>
            <th className="p-1.5 border border-black text-center">Meas. (Y)</th>
            <th className="p-1.5 border border-black text-center">Meas. (B)</th>
            <th className="p-1.5 border border-black text-center">Err R (%)</th>
            <th className="p-1.5 border border-black text-center">Err Y (%)</th>
            <th className="p-1.5 border border-black text-center">Err B (%)</th>
            <th className="p-1.5 border border-black text-center">Result</th>
          </tr>
        </thead>
        <tbody>
          {taps.map((tapPercent, index) => {
            const tapNo = index + 1;
            const expected = calculateExpectedRatio(hvLine, lvLine, vectorGroup, tapPercent);
            const hvVoltPerTap = hvLine * (1 + tapPercent / 100);
            const m = measurements[tapPercent.toString()] || { R: '', Y: '', B: '' };
            const errR = calculateErrorPercent(Number(m.R), expected);
            const errY = calculateErrorPercent(Number(m.Y), expected);
            const errB = calculateErrorPercent(Number(m.B), expected);
            const maxErr = Math.max(Math.abs(errR), Math.abs(errY), Math.abs(errB));
            const overallPass = m.R && m.Y && m.B && maxErr <= 0.5;
            
            return (
              <tr key={tapPercent} className={`border border-black ${tapNo === nominalTap ? 'bg-primary/5 font-bold' : ''}`}>
                <td className="p-1 border border-black text-center font-black">{tapNo}</td>
                <td className="p-1 border border-black text-center">{Math.round(hvVoltPerTap)}</td>
                <td className="p-1 border border-black text-center">{Math.round(lvLine)}</td>
                <td className="p-1 border border-black text-center font-mono">{expected.toFixed(4)}</td>
                <td className="p-1 border border-black text-center">{m.R || '--'}</td>
                <td className="p-1 border border-black text-center">{m.Y || '--'}</td>
                <td className="p-1 border border-black text-center">{m.B || '--'}</td>
                <td className={`p-1 border border-black text-center font-mono ${Math.abs(errR) > 0.5 ? 'text-destructive font-black' : 'text-success'}`}>{m.R ? `${errR.toFixed(3)}%` : '--'}</td>
                <td className={`p-1 border border-black text-center font-mono ${Math.abs(errY) > 0.5 ? 'text-destructive font-black' : 'text-success'}`}>{m.Y ? `${errY.toFixed(3)}%` : '--'}</td>
                <td className={`p-1 border border-black text-center font-mono ${Math.abs(errB) > 0.5 ? 'text-destructive font-black' : 'text-success'}`}>{m.B ? `${errB.toFixed(3)}%` : '--'}</td>
                <td className={`p-1 border border-black text-center font-black ${overallPass ? 'text-success' : 'text-destructive'}`}>{m.R ? (overallPass ? 'PASS' : 'FAIL') : '--'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default function ReportView() {
  const params = useParams();
  const router = useRouter();
  const db = useFirestore();

  const reportId = params.id as string;
  const docRef = useMemoFirebase(() => {
    if (!db || !reportId) return null;
    return doc(db, 'test_reports', reportId);
  }, [db, reportId]);

  const { data: test, isLoading } = useDoc(docRef);

  const handlePrint = () => {
    window.print();
  };

  const taps = useMemo(() => {
    if (!test) return [];
    return generateTaps(test.totalTaps, test.nominalTap, test.tapStep);
  }, [test]);

  const hvCurrent = useMemo(() => test ? calculateLineCurrent(test.kvaRating, test.hvLine) : 0, [test]);
  const lvCurrent = useMemo(() => test ? calculateLineCurrent(test.kvaRating, test.lvLine) : 0, [test]);

  const formattedVectorGroup = useMemo(() => {
    if (!test?.vectorGroup) return 'N/A';
    const vg = test.vectorGroup;
    // Primary capital, secondary small (e.g., Dyn11)
    return vg.charAt(0).toUpperCase() + vg.slice(1).toLowerCase();
  }, [test?.vectorGroup]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold">Report not found</h1>
        <Button onClick={() => router.push('/')}>New Test</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-20 print:bg-white print:p-0">
      <div className="no-print sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b mb-4 md:mb-8 shadow-sm">
        <div className="container max-w-5xl mx-auto px-4 py-3 md:py-4 flex justify-between items-center">
          <Button variant="ghost" size="sm" className="font-bold gap-2 text-muted-foreground hover:text-primary p-0 md:px-3" onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">New Test</span>
          </Button>
          <div className="flex items-center gap-2 md:gap-4">
             <Link href={`/edit-test/${test.id}`}>
              <Button variant="outline" size="sm" className="font-bold text-xs md:text-sm">Edit</Button>
            </Link>
            <Button 
              variant="default" 
              className="bg-primary hover:bg-primary/90 font-black uppercase tracking-wider gap-2 shadow-lg text-xs md:text-sm h-9 md:h-10 px-3 md:px-6" 
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4" />
              Print Report
            </Button>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-2 md:px-4 flex justify-center print:p-0 print:m-0 overflow-x-auto">
        <div className="bg-white shadow-xl rounded-xl p-4 md:p-10 w-full max-w-[210mm] min-h-[297mm] relative print:shadow-none print:rounded-none print-container flex flex-col">
          <div className="flex justify-between items-start border-b-4 border-primary pb-5 mb-6">
            <div className="flex-1">
              <h1 className="text-[20px] md:text-[28px] font-black text-primary uppercase tracking-tighter leading-tight">GLOBAL TRANSFORMERS AND SWITCHGEAR FZE</h1>
              <p className="text-muted-foreground mt-1 text-[11px] md:text-[15px] font-black uppercase tracking-widest">TRANSFORMER FIRST RATIO TEST REPORT</p>
            </div>
            <div className="text-right ml-4 whitespace-nowrap">
              <p className="font-black text-[12px] md:text-[16px] uppercase tracking-tight">DATE: {formatDateToDDMMYYYY(test.testDate)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-8 mb-6">
            <div className="space-y-3">
              <h3 className="text-[13px] font-black text-muted-foreground uppercase tracking-widest border-b-2 pb-1">Equipment Identification</h3>
              <div className="grid grid-cols-2 gap-y-1.5 text-[11px] md:text-[14px]">
                <span className="font-bold text-muted-foreground uppercase text-[10px] md:text-[11px]">Work Order No:</span>
                <span className="font-black text-right uppercase tracking-tight">{test.workOrderNo || 'N/A'}</span>
                <span className="font-bold text-muted-foreground uppercase text-[10px] md:text-[11px]">Serial Number:</span>
                <span className="font-black text-right uppercase tracking-tight">{test.transformerId || 'N/A'}</span>
                <span className="font-bold text-muted-foreground uppercase text-[10px] md:text-[11px]">KVA Rating:</span>
                <span className="font-black text-right tracking-tight">{test.kvaRating} kVA</span>
                <span className="font-bold text-muted-foreground uppercase text-[10px] md:text-[11px]">HV Voltage Rating:</span>
                <span className="font-black text-right tracking-tight">{Math.round(test.hvLine)} V</span>
                <span className="font-bold text-muted-foreground uppercase text-[10px] md:text-[11px]">LV Voltage Rating:</span>
                <span className="font-black text-right tracking-tight">{Math.round(test.lvLine)} V</span>
                <span className="font-bold text-muted-foreground uppercase text-[10px] md:text-[11px]">HV Line Current:</span>
                <span className="font-black text-right tracking-tight">{hvCurrent.toFixed(2)} A</span>
                <span className="font-bold text-muted-foreground uppercase text-[10px] md:text-[11px]">LV Line Current:</span>
                <span className="font-black text-right tracking-tight">{lvCurrent.toFixed(2)} A</span>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-[13px] font-black text-muted-foreground uppercase tracking-widest border-b-2 pb-1">Test Configuration</h3>
              <div className="grid grid-cols-2 gap-y-1.5 text-[11px] md:text-[14px]">
                <span className="font-bold text-muted-foreground uppercase text-[10px] md:text-[11px]">Testing Persons Name:</span>
                <span className="font-black text-right uppercase tracking-tight">{test.operatorName || 'N/A'}</span>
                <span className="font-bold text-muted-foreground uppercase text-[10px] md:text-[11px]">Vector Group:</span>
                <span className="font-black text-right tracking-tight">{formattedVectorGroup}</span>
                <span className="font-bold text-muted-foreground uppercase text-[10px] md:text-[11px]">Nominal Tap Position:</span>
                <span className="font-black text-right tracking-tight">Tap {test.nominalTap}</span>
                <span className="font-bold text-muted-foreground uppercase text-[10px] md:text-[11px]">Tap Percentage Step:</span>
                <span className="font-black text-right tracking-tight">{test.tapStep}%</span>
                <span className="font-bold text-muted-foreground uppercase text-[10px] md:text-[11px]">Tolerance Standard:</span>
                <span className="font-black text-right text-success tracking-tight">IEC60076 ± 0.5%</span>
                <span className="font-bold text-muted-foreground uppercase text-[10px] md:text-[11px]">Authorized Authority:</span>
                <span className="font-black text-right uppercase tracking-tight truncate">{test.authorizedAuthority || 'N/A'}</span>
              </div>
            </div>
          </div>

          <VerificationTable 
            measurements={test.initialMeasurements} 
            taps={taps}
            hvLine={test.hvLine}
            lvLine={test.lvLine}
            vectorGroup={test.vectorGroup}
            nominalTap={test.nominalTap}
          />

          <div className="grid grid-cols-2 gap-10 mt-auto pb-12 md:pb-20">
            <div className="border-t-2 border-black pt-2">
              <p className="text-[10px] md:text-[11px] font-black uppercase mb-1">Testing Person Signature</p>
              <p className="font-black text-sm md:text-md">{test.operatorName || '................................'}</p>
            </div>
            <div className="border-t-2 border-black pt-2">
              <p className="text-[10px] md:text-[11px] font-black uppercase mb-1">Authorized Inspection Authority</p>
              <p className="font-black text-sm md:text-md">{test.authorizedAuthority || '................................'}</p>
            </div>
          </div>

          <div className="mt-8 text-center text-[8px] md:text-[9px] text-muted-foreground border-t-2 pt-4 space-y-0.5 print:absolute print:bottom-[10mm] print:left-[10mm] print:right-[10mm]">
            <p className="font-black text-foreground text-[10px] md:text-[12px]">Global Transformers & SwitchGear FzE</p>
            <p className="font-bold">Factory- Tel:009714-88 33 951, fax: 009714-8833952</p>
            <p className="font-bold">Factory- P.O Box 17963, Plot No - MO 07106, Jabel Ali Free Zone, Dubai - UAE.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
