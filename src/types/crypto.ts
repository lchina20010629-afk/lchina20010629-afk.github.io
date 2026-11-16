/**
 * 加密包络格式
 */
export interface EncryptedEnvelope {
  version: 'v1';
  algorithm: 'AES-256-GCM';
  kdf: 'PBKDF2-SHA256';
  salt: string; // hex encoded
  iv: string; // hex encoded
  iterations: number;
  ciphertext: string; // hex encoded
  authTag: string; // hex encoded
}

/**
 * 密码验证器（用于验证密码是否正确，无需解密实际数据）
 */
export interface PasswordVerifier {
  salt: string;
  iterations: number;
  verifierCiphertext: string; // 加密后的固定字符串
}

/**
 * 加密配置
 */
export interface CryptoConfig {
  iterations: number; // PBKDF2 迭代次数
  saltLength: number; // salt 字节长度
  ivLength: number; // IV 字节长度
}

/**
 * 数据清单条目
 */
export interface ManifestEntry {
  id: string;
  type: 'diary' | 'course' | 'weekly' | 'monthly' | 'yearly';
  date: string; // ISO 8601 格式
  period?: string; // 例如 "2026-W46", "2026-11", "2026"
  encryptedPath: string;
  encryptedImages?: string[];
  created: string;
  modified: string;
  cryptoVersion: 'v1';
  status?: 'draft' | 'published'; // 发布状态
}

/**
 * 数据清单
 */
export interface Manifest {
  version: string;
  entries: ManifestEntry[];
  verifier?: PasswordVerifier;
}

/**
 * 日记条目（解密后）
 */
export interface DiaryEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood?: string;
  weather?: string;
  images?: ImageAttachment[];
  tags?: string[];
  created: string;
  modified: string;
}

/**
 * 图片附件
 */
export interface ImageAttachment {
  id: string;
  caption?: string;
  encryptedPath?: string; // 如果已发布
  blob?: Blob; // 本地草稿
}

/**
 * 课程记录（解密后）
 */
export interface CourseRecord {
  id: string;
  date: string;
  courses: CourseItem[];
  totalMinutes: number;
  notes?: string;
  created: string;
  modified: string;
}

/**
 * 课程项目
 */
export interface CourseItem {
  name: string; // "英语", "泰语", "修身养性", "生财有道"
  targetMinutes: number;
  actualMinutes: number;
  completed: boolean;
  materials?: string[]; // 课程材料/来源
  reflection?: string; // 反思笔记
}

/**
 * 周总结（解密后）
 */
export interface WeeklyReview {
  id: string;
  period: string; // "2026-W46"
  weekStart: string; // 周一日期
  weekEnd: string; // 周日日期
  summary: string;
  achievements: string[];
  challenges: string[];
  nextWeekGoals: string[];
  created: string;
  modified: string;
}

/**
 * 月总结（解密后）
 */
export interface MonthlyReview {
  id: string;
  period: string; // "2026-11"
  summary: string;
  achievements: string[];
  challenges: string[];
  nextMonthGoals: string[];
  statistics?: MonthStatistics;
  created: string;
  modified: string;
}

/**
 * 月度统计
 */
export interface MonthStatistics {
  totalDiaryEntries: number;
  totalCourseMinutes: number;
  courseBreakdown: Record<string, number>; // 各课程分钟数
}

/**
 * 年终总结（解密后）
 */
export interface YearlyReview {
  id: string;
  period: string; // "2026"
  summary: string;
  achievements: string[];
  challenges: string[];
  nextYearGoals: string[];
  statistics?: YearStatistics;
  created: string;
  modified: string;
}

/**
 * 年度统计
 */
export interface YearStatistics {
  totalDiaryEntries: number;
  totalCourseMinutes: number;
  courseBreakdown: Record<string, number>;
  monthlyProgress: Record<string, number>; // 每月总分钟数
}
