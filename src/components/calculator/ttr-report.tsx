
"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, CheckCircle2 } from "lucide-react";
import { 
  calculateExpectedRatio, 
  calculateErrorPercent, 
  generateTaps,
  formatDateToDDMMYYYY
} from "@/lib/ttr-utils";

interface TTRReportProps {
  data: {
    transformerId: string;
    operatorName: string;
    authorizedAuthority: string;
    testDate: string;
    hvLine: number;
    lvLine: number;
    kvaRating: number;
    hvCurrent: number;
    lvCurrent: number;
    vectorGroup: string;
    totalTaps: number;
    nominalTap: number;
    tapStep: number;
    measurements: Record<string, { R: string; Y: string; B: string }>;
  };
  onBack: () => void;
}

export function TTRReport({ data, onBack }: TTRReportProps) {
  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const taps = generateTaps(data.totalTaps, data.nominalTap, data.tapStep);
  const displayDate = formatDateToDDMMYYYY(data.testDate);

  return (
    <div className="min-h-screen bg-muted/30 pb-20 print:bg-white print:p-0 print:m-0">
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b mb-8 shadow-sm no-print">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="ghost" size="sm" className="font-bold gap-2 text-muted-foreground hover:text-primary transition-colors" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Edit Measurements
          </Button>
          <div className="flex items-center gap-4">
            <p className="text-[10px] font-black uppercase text-success flex items-center gap-1 hidden md:flex">
              <CheckCircle2 className="h-3 w-3" />
              Locked to A4 Single Page
            </p>
            <Button 
              variant="default" 
              className="bg-primary hover:bg-primary/90 font-black uppercase tracking-wider gap-2 shadow-lg px-6" 
              onClick={handlePrint}
            >
              <Download className="h-4 w-4" />
              Save PDF / Print
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto flex justify-center p-4 print:p-0 print:m-0">
        <div className="bg-white shadow-2xl print-container border overflow-hidden" style={{ width: '210mm', height: '297mm' }}>
          <div className="flex flex-col h-full p-[12mm]">
            {/* Professional Header */}
            <div className="flex justify-between items-start border-b-4 border-primary pb-4 mb-8">
              <div className="flex-1">
                <h1 className="text-[28px] font-black text-primary uppercase tracking-tighter leading-tight">GLOBAL TRANSFORMERS AND SWITCHGEAR FZE</h1>
                <p className="text-muted-foreground mt-1 text-[14px] font-black uppercase tracking-widest">TRANSFORMER FIRST RATIO TEST REPORT</p>
              </div>
              <div className="text-right ml-4">
                <p className="text-[18px] font-black text-muted-foreground whitespace-nowrap">DATE: {displayDate}</p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-10 mb-8">
              <div className="space-y-4">
                <h3 className="text-[14px] font-black text-muted-foreground uppercase tracking-widest border-b-2 pb-1">Equipment Identification</h3>
                <div className="grid grid-cols-2 gap-y-2 text-[15px]">
                  <span className="font-bold text-muted-foreground uppercase text-[12px]">Serial Number:</span>
                  <span className="font-black text-right uppercase tracking-tight">{data.transformerId || 'N/A'}</span>
                  <span className="font-bold text-muted-foreground uppercase text-[12px]">KVA Rating:</span>
                  <span className="font-black text-right tracking-tight">{data.kvaRating} kVA</span>
                  <span className="font-bold text-muted-foreground uppercase text-[12px]">HV Voltage:</span>
                  <span className="font-black text-right tracking-tight">{Math.round(data.hvLine)} V</span>
                  <span className="font-bold text-muted-foreground uppercase text-[12px]">LV Voltage:</span>
                  <span className="font-black text-right tracking-tight">{Math.round(data.lvLine)} V</span>
                  <span className="font-bold text-muted-foreground uppercase text-[12px]">HV Current:</span>
                  <span className="font-black text-right tracking-tight">{data.hvCurrent.toFixed(2)} A</span>
                  <span className="font-bold text-muted-foreground uppercase text-[12px]">LV Current:</span>
                  <span className="font-black text-right tracking-tight">{data.lvCurrent.toFixed(2)} A</span>
                  <span className="font-bold text-muted-foreground uppercase text-[12px]">Vector Group:</span>
                  <span className="font-black text-right tracking-tight">{data.vectorGroup}</span>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-[14px] font-black text-muted-foreground uppercase tracking-widest border-b-2 pb-1">Test Configuration</h3>
                <div className="grid grid-cols-2 gap-y-2 text-[15px]">
                  <span className="font-bold text-muted-foreground uppercase text-[12px]">Testing Persons Name:</span>
                  <span className="font-black text-right uppercase tracking-tight">{data.operatorName || 'N/A'}</span>
                  <span className="font-bold text-muted-foreground uppercase text-[12px]">Nominal Tap:</span>
                  <span className="font-black text-right tracking-tight">Tap {data.nominalTap}</span>
                  <span className="font-bold text-muted-foreground uppercase text-[12px]">Tap Step:</span>
                  <span className="font-black text-right tracking-tight">{data.tapStep}%</span>
                  <span className="font-bold text-muted-foreground uppercase text-[12px]">Tolerance:</span>
                  <span className="font-black text-right text-success tracking-tight">IEC60076 ± 0.5%</span>
                </div>
              </div>
            </div>

            {/* Results Table */}
            <div className="flex-grow">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-1 bg-primary" />
                <h3 className="text-[18px] font-black text-primary uppercase tracking-widest">VOLTAGE RATIO TEST</h3>
              </div>
              <table className="w-full border-collapse text-[13px] border border-black/10">
                <thead>
                  <tr className="bg-muted font-black border-2 border-black text-left">
                    <th className="p-2 border text-center w-10">Tap</th>
                    <th className="p-2 border text-center">HV Volt</th>
                    <th className="p-2 border text-center">LV Volt</th>
                    <th className="p-2 border text-center">Exp. Ratio</th>
                    <th className="p-2 border text-center">Meas. (R)</th>
                    <th className="p-2 border text-center">Meas. (Y)</th>
                    <th className="p-2 border text-center">Meas. (B)</th>
                    <th className="p-2 border text-center">Err R (%)</th>
                    <th className="p-2 border text-center">Err Y (%)</th>
                    <th className="p-2 border text-center">Err B (%)</th>
                    <th className="p-2 border text-center">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {taps.map((tapPercent, index) => {
                    const tapNo = index + 1;
                    const expected = calculateExpectedRatio(data.hvLine, data.lvLine, data.vectorGroup, tapPercent);
                    const hvVoltPerTap = data.hvLine * (1 + tapPercent / 100);
                    const m = data.measurements[tapPercent.toString()] || { R: '', Y: '', B: '' };
                    const errR = calculateErrorPercent(Number(m.R), expected);
                    const errY = calculateErrorPercent(Number(m.Y), expected);
                    const errB = calculateErrorPercent(Number(m.B), expected);
                    const maxErr = Math.max(Math.abs(errR), Math.abs(errY), Math.abs(errB));
                    const overallPass = m.R && m.Y && m.B && maxErr <= 0.5;
                    
                    return (
                      <tr key={tapPercent} className={`border border-black/10 ${tapNo === data.nominalTap ? 'bg-primary/5 font-bold' : ''}`}>
                        <td className="p-2 border text-center font-bold">{tapNo}</td>
                        <td className="p-2 border text-center">{Math.round(hvVoltPerTap)}</td>
                        <td className="p-2 border text-center">{Math.round(data.lvLine)}</td>
                        <td className="p-2 border text-center font-mono">{expected.toFixed(4)}</td>
                        <td className="p-2 border text-center">{m.R || '--'}</td>
                        <td className="p-2 border text-center">{m.Y || '--'}</td>
                        <td className="p-2 border text-center">{m.B || '--'}</td>
                        <td className={`p-2 border text-center font-mono ${Math.abs(errR) > 0.5 ? 'text-destructive font-bold' : 'text-success'}`}>{m.R ? `${errR.toFixed(3)}%` : '--'}</td>
                        <td className={`p-2 border text-center font-mono ${Math.abs(errY) > 0.5 ? 'text-destructive font-bold' : 'text-success'}`}>{m.Y ? `${errY.toFixed(3)}%` : '--'}</td>
                        <td className={`p-2 border text-center font-mono ${Math.abs(errB) > 0.5 ? 'text-destructive font-bold' : 'text-success'}`}>{m.B ? `${errB.toFixed(3)}%` : '--'}</td>
                        <td className={`p-2 border text-center font-black ${overallPass ? 'text-success' : 'text-destructive'}`}>{m.R ? (overallPass ? 'PASS' : 'FAIL') : '--'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Signature and Specific Footer */}
            <div className="mt-auto pt-6 border-t">
              <div className="grid grid-cols-2 gap-8 pb-10">
                <div className="border-t-2 border-black pt-2">
                  <p className="text-[12px] font-black uppercase mb-1">Testing Person Signature</p>
                  <p className="font-bold text-lg italic">{data.operatorName || '................................'}</p>
                </div>
                <div className="border-t-2 border-black pt-2">
                  <p className="text-[12px] font-black uppercase mb-1">Authorized Inspection Authority</p>
                  <p className="font-bold text-lg italic">{data.authorizedAuthority || '................................'}</p>
                </div>
              </div>

              <div className="text-center text-[11px] text-muted-foreground pt-4 border-t border-muted/30 space-y-1">
                <p className="font-black text-foreground text-[13px]">Global Transformers & SwitchGear FzE</p>
                <p className="font-medium">Factory- Tel:009714-88 33 951, fax: 009714-8833952</p>
                <p className="font-medium">Factory- P.O Box 17963, Plot No - MO 07106, Jabel Ali Free Zone, Dubai - UAE.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
