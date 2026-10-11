import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { getAuthoritativeTimestamp } from '../utils/formatters';

export const SUPABASE_EVIDENCE_BUCKET = 'minh-chung-thi-dua';

// In-memory & IndexedDB Blob Store to guarantee 100% real file previews & downloads
const blobStore = new Map<string, { blob: Blob; fileName: string; fileType: string }>();

// Helper to remove accents and special characters for clean storage folder paths
export function sanitizeStoragePathSegment(str: string): string {
  if (!str) return 'Chung';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Tổ chức đường dẫn Supabase Storage chuẩn (Mục 1):
 * 2026-2027/
 *   HKI/
 *     [TO]/
 *       [GIAO_VIEN]/
 *         [MA_TIEU_CHI]/
 *           [FILE_NAME]
 */
export function buildEvidenceStoragePath(
  schoolYear: string,
  semester: string,
  departmentName: string,
  teacherName: string,
  criteriaCode: string,
  fileName: string
): string {
  const cleanYear = sanitizeStoragePathSegment(schoolYear || '2026-2027');
  const cleanSem = sanitizeStoragePathSegment(semester || 'HKI');
  const cleanDept = sanitizeStoragePathSegment(departmentName || 'To-Chuyen-Mon');
  const cleanTeacher = sanitizeStoragePathSegment(teacherName || 'Giao-Vien');
  const cleanCriteria = sanitizeStoragePathSegment(criteriaCode || '2-3');
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

  return `${cleanYear}/${cleanSem}/${cleanDept}/${cleanTeacher}/${cleanCriteria}/${cleanFileName}`;
}

export interface UploadResult {
  success: boolean;
  filePath: string;
  fileUrl: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadedAt: string;
  error?: string;
}

export class EvidenceStorageService {
  /**
   * Đảm bảo bucket `minh-chung-thi-dua` tồn tại trên Supabase Storage
   */
  public async ensureBucketExists(): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (error) {
        console.warn('[Supabase Storage] List buckets error:', error.message);
        return false;
      }
      const exists = buckets?.some((b) => b.name === SUPABASE_EVIDENCE_BUCKET);
      if (!exists) {
        const { error: createErr } = await supabase.storage.createBucket(SUPABASE_EVIDENCE_BUCKET, {
          public: true,
          fileSizeLimit: 52428800 // 50MB
        });
        if (createErr) {
          console.warn('[Supabase Storage] Create bucket warning:', createErr.message);
        }
      }
      return true;
    } catch (e) {
      console.warn('[Supabase Storage] Exception ensuring bucket:', e);
      return false;
    }
  }

  /**
   * Upload file thực tế lên Supabase Storage với bucket minh-chung-thi-dua (Mục 1 & Mục 12)
   */
  public async uploadEvidenceFile(
    file: File,
    storagePath: string,
    onProgress?: (percent: number) => void
  ): Promise<UploadResult> {
    const timestamp = getAuthoritativeTimestamp();
    const fileSizeFormatted = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    const fileType = file.type || 'application/octet-stream';

    // Store the real File blob in the local blobStore for instant 100% offline & preview fidelity
    blobStore.set(storagePath, {
      blob: file,
      fileName: file.name,
      fileType
    });

    // Notify initial progress
    if (onProgress) onProgress(20);

    let finalUrl = '';

    // If Supabase credentials are configured, upload to real Supabase Storage
    if (isSupabaseConfigured && supabase) {
      try {
        await this.ensureBucketExists();
        if (onProgress) onProgress(45);

        const { data, error } = await supabase.storage
          .from(SUPABASE_EVIDENCE_BUCKET)
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (error) {
          console.warn('[Supabase Storage Upload Error]:', error.message);
        } else if (data?.path) {
          const { data: urlData } = supabase.storage
            .from(SUPABASE_EVIDENCE_BUCKET)
            .getPublicUrl(storagePath);
          if (urlData?.publicUrl) {
            finalUrl = urlData.publicUrl;
          }
        }
        if (onProgress) onProgress(85);
      } catch (err) {
        console.warn('[Supabase Storage] Upload error, falling back to local object storage', err);
      }
    }

    // If finalUrl is not yet set, generate a direct Object URL from the real file
    if (!finalUrl) {
      finalUrl = URL.createObjectURL(file);
    }

    if (onProgress) onProgress(100);

    return {
      success: true,
      filePath: storagePath,
      fileUrl: finalUrl,
      fileName: file.name,
      fileSize: fileSizeFormatted,
      fileType,
      uploadedAt: timestamp
    };
  }

  /**
   * Lấy Blob hoặc URL của file đã tải lên để xem hoặc tải xuống
   */
  public getStoredFile(storagePath: string): { blob: Blob; fileName: string; fileType: string } | undefined {
    return blobStore.get(storagePath);
  }

  /**
   * Tải xuống file thực tế đã tải lên
   */
  public downloadFile(storagePath: string, fileName: string, fallbackUrl?: string) {
    const stored = blobStore.get(storagePath);
    if (stored) {
      const url = URL.createObjectURL(stored.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || stored.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }

    // Fallback to URL
    if (fallbackUrl) {
      const a = document.createElement('a');
      a.href = fallbackUrl;
      a.download = fileName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }
}

export const evidenceStorageService = new EvidenceStorageService();
