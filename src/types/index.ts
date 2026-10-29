export interface TeacherIdentity {
  teacherName: string;
  teacherNip: string;
  subject: string;
  vocation: string;
  grade: string;
  phase: string;
  semester: string;
  academicYear: string;
}

export interface LearningIdentity {
  topic: string;
  cp: string;
  tp: string;
  duration: string;
  studentCount: number;
  studentCharacteristics: string;
}

export interface LearningMethods {
  methods: string[];
  model: string;
  customModel?: string;
  dimensions: string[];
}

export interface AdditionalSettings {
  deepLearning: boolean;
  differentiation: boolean;
  digitalTech: boolean;
  literacy: boolean;
  numeracy: boolean;
  baliWisdom: boolean;
  characterEducation: boolean;
  vocationalPractice: boolean;
}

export interface AdminDocument {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  content: string;
  lastGenerated?: string;
  updatedAt?: string;
  status: 'draft' | 'ready' | 'printed';
}

export interface StudentScore {
  id: string;
  no: number;
  name: string;
  nisn?: string;
  tpScores: Record<string, number>; // key: TP1, TP2, etc.
  finalScore: number;
  isPassed: boolean;
  notes?: string;
}

export interface AssessmentData {
  tps: string[];
  passingScore: number; // default 75
  students: StudentScore[];
  aiSummary?: string;
}

export interface SavedRecord {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  teacher: TeacherIdentity;
  learning: LearningIdentity;
  methods: LearningMethods;
  settings: AdditionalSettings;
  documents: Record<string, string>; // docType -> HTML content
  assessment: AssessmentData;
}
