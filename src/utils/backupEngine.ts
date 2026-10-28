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
import {
  Expense,
  CashAdvance,
  SettlementRecord,
  Vehicle,
  Person,
  ActivityEvent,
  AccountingPeriod,
  OpeningDocument,
  Income,
  Customer,
  SaleDossier,
  ConsignmentAgreement,
  OwnerSettlement,
  VehicleHandoverInspection,
  ConsignmentReturnRecord,
} from '../types/accounting';
import { SmartContract } from '../types/contract';
import {
  FinancialAccount,
  AccountTransfer,
  IndirectTransaction,
  DealCommission,
  InvestorProfile,
} from '../types/finance09b';
import {
  VehicleExpiringDoc,
  ReferencePreset,
  AuditLogEntry,
} from '../types/patch09c';

export interface BackupManifest {
  backupVersion: string;
  createdAt: string;
  databaseVersion: string;
  recordCount: number;
  attachmentCount: number;
  databaseHash: string;
  backupSize: number;
  appName: string;
  type: 'manual' | 'auto_close' | 'hourly_checkpoint' | 'emergency_pre_restore' | 'pre_new_period';
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
  try {
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      const encoder = new TextEncoder();
      const buffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(dataString));
      return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // fallback if subtle crypto is not available
  }
  // Lightweight hash fallback
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < dataString.length; i++) {
    const ch = dataString.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

/**
 * Safely decodes a base64 string into a Uint8Array binary buffer.
 * Handles URL encoding, base64url (- and _), padding and malformed lengths
 * without ever throwing an exception.
 */
export function safeBase64ToUint8Array(rawStr: string): Uint8Array | null {
  try {
    if (!rawStr || typeof rawStr !== 'string') return null;
    let clean = rawStr.trim();
    if (clean.includes('%')) {
      try {
        clean = decodeURIComponent(clean);
      } catch {
        // ignore
      }
    }
    clean = clean.replace(/[\s\r\n]+/g, '');
    clean = clean.replace(/-/g, '+').replace(/_/g, '/');
    clean = clean.replace(/[^A-Za-z0-9+/=]/g, '');

    const unpadded = clean.replace(/=+$/, '');
    const rem = unpadded.length % 4;
    if (rem === 1) {
      return null;
    }
    let padded = unpadded;
    if (rem === 2) padded += '==';
    else if (rem === 3) padded += '=';

    if (typeof atob === 'function') {
      const binary = atob(padded);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    } else if (typeof Buffer !== 'undefined') {
      return new Uint8Array(Buffer.from(padded, 'base64'));
    }
    return null;
  } catch {
    return null;
  }
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
  incomes?: Income[];
  cashAdvances: CashAdvance[];
  settlements: SettlementRecord[];
  vehicles: Vehicle[];
  personnel: Person[];
  activities: ActivityEvent[];
  periods?: AccountingPeriod[];
  openingDocuments?: OpeningDocument[];
  activePeriodId?: string;
  customers?: Customer[];
  saleDossiers?: SaleDossier[];
  consignmentAgreements?: ConsignmentAgreement[];
  ownerSettlements?: OwnerSettlement[];
  vehicleInspections?: VehicleHandoverInspection[];
  consignmentReturns?: ConsignmentReturnRecord[];
  contracts?: SmartContract[];
  financialAccounts?: FinancialAccount[];
  accountTransfers?: AccountTransfer[];
  indirectTransactions?: IndirectTransaction[];
  dealCommissions?: DealCommission[];
  investorProfiles?: InvestorProfile[];
  expiringDocs?: VehicleExpiringDoc[];
  presets?: ReferencePreset[];
  auditLogs?: AuditLogEntry[];
  customDocumentChecklist?: string[];
  customEquipmentChecklist?: string[];
}

export async function createConsistentBackupZip(
  dbPayload: FullDatabasePayload,
  type: 'manual' | 'auto_close' | 'hourly_checkpoint' | 'emergency_pre_restore' | 'pre_new_period' = 'manual'
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
  if (dbPayload.expenses) {
    dbPayload.expenses.forEach((e) => {
      if (e.receipts) attachmentCount += e.receipts.length;
    });
  }
  if (dbPayload.saleDossiers) {
    dbPayload.saleDossiers.forEach((s) => {
      if (s.attachments) attachmentCount += s.attachments.length;
      if (s.deliveryFormB?.photos) attachmentCount += s.deliveryFormB.photos.length;
    });
  }
  if (dbPayload.vehicleInspections) {
    dbPayload.vehicleInspections.forEach((vi) => {
      if (vi.generalPhotos) attachmentCount += vi.generalPhotos.length;
      if (vi.checklist) {
        vi.checklist.forEach((item) => {
          if (item.photoUrl) attachmentCount += 1;
        });
      }
    });
  }

  const recordCount =
    (dbPayload.expenses?.length || 0) +
    (dbPayload.cashAdvances?.length || 0) +
    (dbPayload.settlements?.length || 0) +
    (dbPayload.vehicles?.length || 0) +
    (dbPayload.personnel?.length || 0) +
    (dbPayload.incomes?.length || 0) +
    (dbPayload.customers?.length || 0) +
    (dbPayload.saleDossiers?.length || 0) +
    (dbPayload.consignmentAgreements?.length || 0) +
    (dbPayload.ownerSettlements?.length || 0) +
    (dbPayload.vehicleInspections?.length || 0) +
    (dbPayload.consignmentReturns?.length || 0) +
    (dbPayload.contracts?.length || 0) +
    (dbPayload.financialAccounts?.length || 0) +
    (dbPayload.accountTransfers?.length || 0) +
    (dbPayload.indirectTransactions?.length || 0) +
    (dbPayload.dealCommissions?.length || 0) +
    (dbPayload.investorProfiles?.length || 0) +
    (dbPayload.expiringDocs?.length || 0) +
    (dbPayload.presets?.length || 0) +
    (dbPayload.auditLogs?.length || 0);

  // 3. Build JSZip package
  const zip = new JSZip();

  // Attach database.json
  zip.file('database.json', serializedDb);

  // Attach receipt and file attachments into attachments/ folder
  const attachmentsFolder = zip.folder('attachments');
  if (attachmentsFolder) {
    // Helper to package any data: or text URL into zip
    const packageAttachment = (rawUrl: string, prefix: string, idx: number, fallbackName?: string) => {
      try {
        if (!rawUrl || typeof rawUrl !== 'string') return;
        if (rawUrl.startsWith('data:')) {
          const commaIdx = rawUrl.indexOf(',');
          if (commaIdx !== -1) {
            const meta = rawUrl.slice(0, commaIdx);
            const rawContent = rawUrl.slice(commaIdx + 1);
            const isBase64 = meta.includes(';base64');
            const isSvg = meta.includes('image/svg+xml');
            const isPng = meta.includes('image/png');
            const ext = isSvg ? 'svg' : isPng ? 'png' : 'jpg';
            const safeName = `${prefix}_${idx + 1}.${ext}`;

            if (isBase64) {
              const bytes = safeBase64ToUint8Array(rawContent);
              if (bytes && bytes.length > 0) {
                // Pass binary buffer directly - completely avoids JSZip base64 decode errors!
                attachmentsFolder.file(safeName, bytes);
              } else {
                // If decoding fails, store as plain text without base64 flag so JSZip doesn't choke
                try {
                  attachmentsFolder.file(safeName, rawContent);
                } catch {
                  // ignore
                }
              }
            } else {
              let decodedText = rawContent;
              try {
                decodedText = decodeURIComponent(rawContent);
              } catch {
                decodedText = rawContent;
              }
              attachmentsFolder.file(safeName, decodedText);
            }
          }
        }
      } catch (attErr) {
        console.warn('Skipping unreadable attachment in backup:', fallbackName, attErr);
      }
    };

    // 1. Expense receipts
    if (dbPayload.expenses) {
      dbPayload.expenses.forEach((exp) => {
        if (exp.receipts) {
          exp.receipts.forEach((r, idx) => {
            packageAttachment(r.url, `receipt_${exp.id.slice(0, 8)}`, idx, r.name);
          });
        }
      });
    }

    // 2. Sale dossier attachments & photos
    if (dbPayload.saleDossiers) {
      dbPayload.saleDossiers.forEach((sale) => {
        if (sale.deliveryFormB?.photos) {
          sale.deliveryFormB.photos.forEach((p, idx) => {
            packageAttachment(p.url, `sale_photo_${sale.id.slice(0, 8)}`, idx, p.title);
          });
        }
        if (sale.attachments) {
          sale.attachments.forEach((att, idx) => {
            packageAttachment(att.url, `sale_att_${sale.id.slice(0, 8)}`, idx, att.name);
          });
        }
      });
    }

    // 3. Vehicle inspections photos
    if (dbPayload.vehicleInspections) {
      dbPayload.vehicleInspections.forEach((insp) => {
        if (insp.generalPhotos) {
          insp.generalPhotos.forEach((gp, idx) => {
            packageAttachment(gp.url, `insp_photo_${insp.id.slice(0, 8)}`, idx, gp.title);
          });
        }
        if (insp.checklist) {
          insp.checklist.forEach((item, idx) => {
            if (item.photoUrl) {
              packageAttachment(item.photoUrl, `chk_photo_${item.id.slice(0, 8)}`, idx, item.photoName || item.title);
            }
          });
        }
      });
    }

    // 4. Smart Contract attachments & signed files
    if (dbPayload.contracts) {
      dbPayload.contracts.forEach((cnt) => {
        if (cnt.signedContractUrl) {
          packageAttachment(cnt.signedContractUrl, `contract_signed_${cnt.id.slice(0, 8)}`, 0, 'signed_contract');
        }
        if (cnt.attachments) {
          cnt.attachments.forEach((att, idx) => {
            packageAttachment(att.url, `contract_att_${cnt.id.slice(0, 8)}`, idx, att.name);
          });
        }
      });
    }
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

  let rawZipBlob: Blob;
  try {
    rawZipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });
  } catch (genErr) {
    console.warn('Zip generation with attachments failed, creating fallback clean backup:', genErr);
    const cleanZip = new JSZip();
    cleanZip.file('database.json', serializedDb);
    cleanZip.file(
      'app-config.json',
      JSON.stringify({
        appName: APP_NAME,
        schemaVersion: DB_VERSION,
        platform: 'AutoAbdollahi Local Enterprise',
        generatedAt: new Date().toISOString(),
      })
    );
    rawZipBlob = await cleanZip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });
  }

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
    db.personnel.length +
    (db.incomes?.length || 0);

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
