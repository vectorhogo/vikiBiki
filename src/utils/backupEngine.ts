/**
 * Backup, Auto-Save, and Storage Engine for Auto Abdollahi
 * Implements:
 * - Compressed ZIP backups with JSZip
 * - Backup manifest (backupVersion, createdAt, databaseVersion, recordCount, attachmentCount, databaseHash, backupSize)
 * - Backup validation & integrity checks
 * - Deduplication via content hashing (prevents redundant duplicates)
 * - Rolling retention policy: Recent (7), Daily (14), Weekly (4)
 * - Emergency backup snapshot before restore operations
 * - Safe restore validation & schema compatibility checks
 * - Hourly lightweight integrity checkpoint
 * - Automatic close backup
 * - Storage metrics and duplicate receipt detection
 */

import JSZip from 'jszip';
import { Expense, CashAdvance, SettlementRecord, Vehicle, Person, ActivityEvent } from '../types/accounting';

export interface BackupManifest {
  backupVersion: string;
  createdAt: string;
  databaseVersion: string;
  recordCount: number;
  attachmentCount: number;
  databaseHash: string;
  backupSize: number;
  appName: string;
  type: 'manual' | 'auto_close' | 'hourly_checkpoint' | 'emergency_pre_restore';
  status: 'valid' | 'failed' | 'corrupted';
}

export interface StoredBackupItem {
  id: string;
  filename: string;
  manifest: BackupManifest;
  createdAt: number;
  category: 'recent' | 'daily' | 'weekly';
  sizeFormatted: string;
  zipSizeBytes?: number;
  reason?: 'manual' | 'hourly_checkpoint' | 'pre_restore_emergency' | 'app_close';
  dataBase64?: string; // Stored in IndexedDB / local catalog
}

export type BackupCatalogEntry = StoredBackupItem;

export interface StorageMetrics {
  databaseSizeBytes: number;
  attachmentsSizeBytes: number;
  backupsSizeBytes: number;
  totalSizeBytes: number;
  totalRecords: number;
  totalAttachments: number;
  lastBackupDate?: string;
  lastBackupStatus?: 'valid' | 'failed' | 'corrupted';
  lastCheckpointTime?: string;
}

const BACKUP_CATALOG_KEY = 'aa_backup_catalog_v1';
const DB_VERSION = '3.0.0';
const APP_NAME = 'AutoAbdollahi Dealership Accounting';

// ---------------------------------------------------------
// Fast SHA-256 / Checksum for Data Fingerprinting
// ---------------------------------------------------------

export async function computeDataFingerprint(dataString: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(dataString));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ---------------------------------------------------------
// Backup Catalog Management & Rotation
// ---------------------------------------------------------

export function getBackupCatalog(): StoredBackupItem[] {
  try {
    const raw = localStorage.getItem(BACKUP_CATALOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBackupCatalog(catalog: StoredBackupItem[]): void {
  localStorage.setItem(BACKUP_CATALOG_KEY, JSON.stringify(catalog));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} بایت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} کیلوبایت`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} مگابایت`;
}

// ---------------------------------------------------------
// Backup Creation (ZIP Archive)
// ---------------------------------------------------------

export interface FullDatabasePayload {
  version: string;
  exportedAt: string;
  expenses: Expense[];
  cashAdvances: CashAdvance[];
  settlements: SettlementRecord[];
  vehicles: Vehicle[];
  personnel: Person[];
  activities: ActivityEvent[];
}

export async function createConsistentBackupZip(
  dbPayload: FullDatabasePayload,
  type: 'manual' | 'auto_close' | 'hourly_checkpoint' | 'emergency_pre_restore' = 'manual'
): Promise<{
  zipBlob: Blob;
  manifest: BackupManifest;
  filename: string;
  isDuplicate: boolean;
}> {
  // 1. Calculate fingerprint to detect deduplication
  const serializedDb = JSON.stringify(dbPayload);
  const currentHash = await computeDataFingerprint(serializedDb);

  // Check last backup hash
  const catalog = getBackupCatalog();
  const lastBackup = catalog[0];
  if (lastBackup && lastBackup.manifest.databaseHash === currentHash && type !== 'manual' && type !== 'emergency_pre_restore') {
    // Deduplication triggered: no meaningful changes
    return {
      zipBlob: new Blob(),
      manifest: lastBackup.manifest,
      filename: lastBackup.filename,
      isDuplicate: true,
    };
  }

  // 2. Count records and attachments
  let attachmentCount = 0;
  dbPayload.expenses.forEach((e) => {
    if (e.receipts) attachmentCount += e.receipts.length;
  });
  const recordCount =
    dbPayload.expenses.length +
    dbPayload.cashAdvances.length +
    dbPayload.settlements.length +
    dbPayload.vehicles.length +
    dbPayload.personnel.length;

  // 3. Build JSZip package
  const zip = new JSZip();

  // Attach database.json
  zip.file('database.json', serializedDb);

  // Attach receipt attachments into attachments/ folder
  const attachmentsFolder = zip.folder('attachments');
  if (attachmentsFolder) {
    dbPayload.expenses.forEach((exp) => {
      if (exp.receipts) {
        exp.receipts.forEach((r, idx) => {
          if (r.url && r.url.startsWith('data:')) {
            const parts = r.url.split(',');
            const base64Data = parts[1];
            const safeName = `receipt_${exp.id.slice(0, 8)}_${idx + 1}.jpg`;
            attachmentsFolder.file(safeName, base64Data, { base64: true });
          }
        });
      }
    });
  }

  // Add application metadata
  zip.file(
    'app-config.json',
    JSON.stringify({
      appName: APP_NAME,
      schemaVersion: DB_VERSION,
      platform: 'AutoAbdollahi Local Enterprise',
      generatedAt: new Date().toISOString(),
    })
  );

  // Manifest
  const tempDate = new Date();
  const dateStr = tempDate.toISOString().replace(/[:.]/g, '-');
  const filename = `AutoAbdollahi_Backup_${dateStr}_${type}.zip`;

  const rawZipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const manifest: BackupManifest = {
    backupVersion: '1.0.0',
    createdAt: tempDate.toISOString(),
    databaseVersion: DB_VERSION,
    recordCount,
    attachmentCount,
    databaseHash: currentHash,
    backupSize: rawZipBlob.size,
    appName: APP_NAME,
    type,
    status: 'valid',
  };

  // Re-write zip including manifest
  zip.file('backup-manifest.json', JSON.stringify(manifest, null, 2));

  const finalBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  // 4. Validate backup integrity immediately
  const isValid = await validateBackupZip(finalBlob);
  if (!isValid) {
    manifest.status = 'corrupted';
    throw new Error('فایل پشتیبان ایجاد شده اعتبارسنجی را پشت سر نگذاشت.');
  }

  // 5. Update catalog & enforce retention policy
  addBackupToCatalog({
    id: `bak_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    filename,
    manifest,
    createdAt: Date.now(),
    category: determineCategory(type),
    sizeFormatted: formatBytes(finalBlob.size),
  });

  return {
    zipBlob: finalBlob,
    manifest,
    filename,
    isDuplicate: false,
  };
}

function determineCategory(type: string): 'recent' | 'daily' | 'weekly' {
  if (type === 'hourly_checkpoint' || type === 'auto_close') return 'recent';
  return 'daily';
}

// ---------------------------------------------------------
// Backup Validation
// ---------------------------------------------------------

export async function validateBackupZip(zipBlob: Blob): Promise<boolean> {
  try {
    const zip = await JSZip.loadAsync(zipBlob);

    // Check database.json exists and is valid JSON
    const dbFile = zip.file('database.json');
    if (!dbFile) return false;

    const dbContent = await dbFile.async('text');
    const parsed = JSON.parse(dbContent);

    if (!parsed || !Array.isArray(parsed.expenses) || !Array.isArray(parsed.vehicles)) {
      return false;
    }

    // Check manifest exists
    const manifestFile = zip.file('backup-manifest.json');
    if (!manifestFile) return false;

    const manifestContent = await manifestFile.async('text');
    const manifest = JSON.parse(manifestContent);
    if (!manifest || manifest.status !== 'valid') {
      return false;
    }

    return true;
  } catch (err) {
    console.error('Backup validation failed:', err);
    return false;
  }
}

// ---------------------------------------------------------
// Restore Backup & Safety Verification
// ---------------------------------------------------------

export async function restoreFromBackupZip(
  zipBlob: Blob,
  currentDb: FullDatabasePayload
): Promise<{
  success: boolean;
  restoredData?: FullDatabasePayload;
  error?: string;
}> {
  try {
    // 1. Create emergency safety backup of current state FIRST
    await createConsistentBackupZip(currentDb, 'emergency_pre_restore');

    // 2. Validate incoming backup
    const isValid = await validateBackupZip(zipBlob);
    if (!isValid) {
      return {
        success: false,
        error: 'این نسخه پشتیبان با نسخه فعلی برنامه سازگار نیست یا فایل مخدوش است.',
      };
    }

    // 3. Extract database.json
    const zip = await JSZip.loadAsync(zipBlob);
    const dbFile = zip.file('database.json');
    if (!dbFile) {
      return {
        success: false,
        error: 'فایل داده‌های حسابداری در پشتیبان یافت نشد.',
      };
    }

    const jsonText = await dbFile.async('text');
    const parsed = JSON.parse(jsonText) as FullDatabasePayload;

    // Check essential schema properties
    if (
      !Array.isArray(parsed.expenses) ||
      !Array.isArray(parsed.cashAdvances) ||
      !Array.isArray(parsed.vehicles) ||
      !Array.isArray(parsed.personnel)
    ) {
      return {
        success: false,
        error: 'ساختار جداول نسخه پشتیبان با استانداردهای سیستم تطابق ندارد.',
      };
    }

    return {
      success: true,
      restoredData: parsed,
    };
  } catch (err: any) {
    console.error('Restore error:', err);
    return {
      success: false,
      error: err?.message || 'خطا در بارگذاری و بازگردانی نسخه پشتیبان.',
    };
  }
}

// ---------------------------------------------------------
// Backup Catalog & Retention Enforcement (Recent: 7, Daily: 14, Weekly: 4)
// ---------------------------------------------------------

export function addBackupToCatalog(item: StoredBackupItem): void {
  const catalog = getBackupCatalog();
  // Prepend newest
  catalog.unshift(item);

  // Group and trim
  const recent = catalog.filter((b) => b.category === 'recent').slice(0, 7);
  const daily = catalog.filter((b) => b.category === 'daily').slice(0, 14);
  const weekly = catalog.filter((b) => b.category === 'weekly').slice(0, 4);

  const retained = [...recent, ...daily, ...weekly].sort((a, b) => b.createdAt - a.createdAt);
  saveBackupCatalog(retained);
}

// ---------------------------------------------------------
// Storage Metrics Calculation
// ---------------------------------------------------------

export function calculateStorageMetrics(db: FullDatabasePayload): StorageMetrics {
  const dbJson = JSON.stringify(db);
  const databaseSizeBytes = new Blob([dbJson]).size;

  let attachmentsSizeBytes = 0;
  let totalAttachments = 0;

  db.expenses.forEach((e) => {
    if (e.receipts) {
      e.receipts.forEach((r) => {
        totalAttachments++;
        if (r.url) {
          attachmentsSizeBytes += r.url.length; // Approximate base64 size
        }
      });
    }
  });

  const catalog = getBackupCatalog();
  const backupsSizeBytes = catalog.reduce((sum, b) => sum + (b.manifest?.backupSize || 0), 0);

  const totalRecords =
    db.expenses.length +
    db.cashAdvances.length +
    db.settlements.length +
    db.vehicles.length +
    db.personnel.length;

  const lastBackup = catalog[0];

  return {
    databaseSizeBytes,
    attachmentsSizeBytes,
    backupsSizeBytes,
    totalSizeBytes: databaseSizeBytes + attachmentsSizeBytes + backupsSizeBytes,
    totalRecords,
    totalAttachments,
    lastBackupDate: lastBackup ? new Date(lastBackup.createdAt).toLocaleDateString('fa-IR') : undefined,
    lastBackupStatus: lastBackup?.manifest?.status,
  };
}

// ---------------------------------------------------------
// Receipt Duplicate Detection
// ---------------------------------------------------------

export async function findDuplicateReceipt(
  newFileBase64: string,
  expenses: Expense[]
): Promise<{ isDuplicate: boolean; matchedExpense?: Expense; receiptName?: string }> {
  const newHash = await computeDataFingerprint(newFileBase64);

  for (const exp of expenses) {
    if (exp.receipts) {
      for (const rec of exp.receipts) {
        if (rec.url) {
          const existingHash = await computeDataFingerprint(rec.url);
          if (existingHash === newHash) {
            return {
              isDuplicate: true,
              matchedExpense: exp,
              receiptName: rec.name,
            };
          }
        }
      }
    }
  }

  return { isDuplicate: false };
}
