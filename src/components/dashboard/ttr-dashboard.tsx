"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Plus, 
  ClipboardList, 
  Trash2, 
  ChevronRight, 
  Calendar,
  User,
  Hash,
  FileText
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteTest, TTRTest } from '@/services/ttr-service';
import { useToast } from '@/hooks/use-toast';

export function TTRDashboard({ tests, onRefresh }: TTRDashboardProps) {
  const { toast } = useToast();

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this test?")) {
      try {
        await deleteTest(id);
        toast({ title: "Success", description: "Test deleted successfully." });
        onRefresh();
      } catch (error) {
        toast({ title: "Error", description: "Failed to delete test.", variant: "destructive" });
      }
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter text-primary">
            GTS TTR DASHBOARD
          </h1>
          <p className="text-muted-foreground font-black uppercase text-xs tracking-widest">Transformer Ratio Engineering Reports</p>
        </div>
        <Link href="/new-test">
          <Button size="lg" className="bg-primary hover:bg-primary/90 font-black uppercase tracking-widest shadow-xl h-14 px-8">
            <Plus className="h-5 w-5 mr-2" />
            New Ratio Test
          </Button>
        </Link>
      </div>

      {tests.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/20 py-20 flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-4 bg-background rounded-full shadow-inner">
            <ClipboardList className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black uppercase">No records found</h3>
            <p className="text-sm text-muted-foreground">Start by creating your first transformer test report.</p>
          </div>
          <Link href="/new-test">
            <Button variant="outline" className="font-bold uppercase tracking-widest text-xs">Create New Record</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <Link key={test.id} href={`/edit-test/${test.id}`} className="group">
              <Card className="h-full hover:shadow-2xl transition-all duration-300 overflow-hidden border-muted-foreground/10 group-hover:border-primary/50 relative">
                <div className="h-1 bg-primary/20 group-hover:bg-primary transition-colors" />
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-primary">
                        <Hash className="h-3 w-3" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Serial Number</span>
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-tight">{test.transformerId}</h3>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                      onClick={(e) => handleDelete(e, test.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-muted/50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span className="text-[8px] font-black uppercase">Test Date</span>
                      </div>
                      <p className="text-xs font-bold">{test.testDate}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span className="text-[8px] font-black uppercase">Engineer</span>
                      </div>
                      <p className="text-xs font-bold truncate">{test.operatorName || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black uppercase text-[8px] tracking-widest">
                      {test.vectorGroup} • {test.hvLine}/{test.lvLine}V
                    </Badge>
                    <div className="flex items-center gap-2">
                       <Link href={`/report/${test.id}`} onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase text-accent hover:text-accent hover:bg-accent/10">
                          <FileText className="h-3.5 w-3.5 mr-1" />
                          PDF
                        </Button>
                      </Link>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

interface TTRDashboardProps {
  tests: TTRTest[];
  onRefresh: () => void;
}
