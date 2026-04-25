import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  orderBy, 
  Timestamp,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';

export interface TTRTest {
  id?: string;
  workOrderNo: string;
  transformerId: string;
  operatorName: string;
  authorizedAuthority: string;
  testDate: string;
  hvLine: number;
  lvLine: number;
  kvaRating: number;
  vectorGroup: string;
  totalTaps: number;
  nominalTap: number;
  tapStep: number;
  initialMeasurements: Record<string, { R: string; Y: string; B: string }>;
  finalMeasurements: Record<string, { R: string; Y: string; B: string }>;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  creatorId: string;
}

const COLLECTION_NAME = 'test_reports';

export const saveTTRTest = async (testData: Omit<TTRTest, 'id' | 'createdAt' | 'updatedAt'>) => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...testData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateTTRTest = async (id: string, testData: Partial<TTRTest>) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...testData,
    updatedAt: Timestamp.now(),
  });
  return id;
};

export const getAllTests = async (): Promise<TTRTest[]> => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('updatedAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as TTRTest[];
};

export const getTestById = async (id: string): Promise<TTRTest | null> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as TTRTest;
  }
  return null;
};

export const deleteTest = async (id: string) => {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};
