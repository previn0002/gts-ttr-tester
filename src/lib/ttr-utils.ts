export type VectorGroup = 
  | 'Dyn11' | 'Dyn1' | 'Dy0' | 'Dy5' | 'Dy11' 
  | 'Yyn0' | 'Yy0' | 'Yy6' 
  | 'Yd1' | 'Yd11' | 'Yd5' 
  | 'Dd0' | 'Dd6';

export type WindingType = 'Star' | 'Delta';

export interface VectorGroupConfig {
  hv: WindingType;
  lv: WindingType;
}

// Precision root 3 value as requested by the user
const ROOT_3 = 1.7321;

export const VECTOR_GROUP_MAPPING: Record<string, VectorGroupConfig> = {
  'Dyn11': { hv: 'Delta', lv: 'Star' },
  'Dyn1': { hv: 'Delta', lv: 'Star' },
  'Dy0': { hv: 'Delta', lv: 'Star' },
  'Dy5': { hv: 'Delta', lv: 'Star' },
  'Dy11': { hv: 'Delta', lv: 'Star' },
  'Yyn0': { hv: 'Star', lv: 'Star' },
  'Yy0': { hv: 'Star', lv: 'Star' },
  'Yy6': { hv: 'Star', lv: 'Star' },
  'Yd1': { hv: 'Star', lv: 'Delta' },
  'Yd11': { hv: 'Star', lv: 'Delta' },
  'Yd5': { hv: 'Star', lv: 'Delta' },
  'Dd0': { hv: 'Delta', lv: 'Delta' },
  'Dd6': { hv: 'Delta', lv: 'Delta' },
};

export const calculateExpectedRatio = (
  hvLine: number, 
  lvLine: number, 
  vectorGroup: string,
  tapPercent: number = 0
): number => {
  if (!hvLine || !lvLine || !vectorGroup) return 0;
  
  const config = VECTOR_GROUP_MAPPING[vectorGroup];
  if (!config) return 0;

  // Apply tap variation to HV side
  const hvLineWithTap = hvLine * (1 + tapPercent / 100);

  // Using ROOT_3 (1.7321) for phase conversion
  const hvPhase = config.hv === 'Star' ? hvLineWithTap / ROOT_3 : hvLineWithTap;
  const lvPhase = config.lv === 'Star' ? lvLine / ROOT_3 : lvLine;

  return hvPhase / lvPhase;
};

export const calculateLineCurrent = (kva: number, voltage: number): number => {
  if (!kva || !voltage) return 0;
  // Using ROOT_3 (1.7321) for line current calculation
  return (kva * 1000) / (ROOT_3 * voltage);
};

export const calculateErrorPercent = (measured: number, expected: number): number => {
  if (!expected || !measured) return 0;
  return ((measured - expected) / expected) * 100;
};

export const getStatus = (errorPercent: number): 'Pass' | 'Fail' => {
  return Math.abs(errorPercent) <= 0.5 ? 'Pass' : 'Fail';
};

export const generateTaps = (totalTaps: number, nominalTap: number, step: number): number[] => {
  if (totalTaps <= 0) return [];
  const taps: number[] = [];
  // Tap 1 is typically the highest voltage (+ variation)
  for (let i = 1; i <= totalTaps; i++) {
    const offset = nominalTap - i;
    const percent = offset * step;
    taps.push(Number(percent.toFixed(2)));
  }
  return taps;
};

export const formatDateToDDMMYYYY = (dateStr: string): string => {
  if (!dateStr) return 'N/A';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};
