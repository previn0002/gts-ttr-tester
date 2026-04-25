
"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { TTRCalculator } from '@/components/calculator/ttr-calculator';
import { getTestById, TTRTest } from '@/services/ttr-service';
import { Loader2 } from 'lucide-react';

export default function EditTestPage() {
  const params = useParams();
  const [test, setTest] = useState<TTRTest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchTest(params.id as string);
    }
  }, [params.id]);

  const fetchTest = async (id: string) => {
    try {
      const data = await getTestById(id);
      setTest(data);
    } catch (error) {
      console.error("Error fetching test:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-20">
      <TTRCalculator initialData={test} />
    </main>
  );
}
