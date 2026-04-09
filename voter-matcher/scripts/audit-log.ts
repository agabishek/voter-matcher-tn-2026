/**
 * Audit Log Writer — appends timestamped entries on config changes
 *
 * Each entry records: timestamp, action, previousVersion, newVersion,
 * changedFields, and optional operator.
 *
 * The audit log is an append-only JSON array stored at config/audit-log.json.
 *
 * @module scripts/audit-log
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface AuditLogEntry {
  timestamp: string;
  action: string;
  previousVersion: string;
  newVersion: string;
  changedFields: string[];
  operator?: string;
}

const AUDIT_LOG_PATH = join(process.cwd(), 'config', 'audit-log.json');

/**
 * Read the current audit log from disk, or return an empty array if none exists.
 */
export function readAuditLog(logPath: string = AUDIT_LOG_PATH): AuditLogEntry[] {
  if (!existsSync(logPath)) {
    return [];
  }
  const raw = readFileSync(logPath, 'utf-8');
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error('audit-log.json is not an array');
  }
  return parsed as AuditLogEntry[];
}

/**
 * Append a single entry to the audit log and write it back to disk.
 */
export function appendAuditLog(
  entry: Omit<AuditLogEntry, 'timestamp'>,
  logPath: string = AUDIT_LOG_PATH,
): AuditLogEntry {
  const entries = readAuditLog(logPath);
  const full: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    ...entry,
  };
  entries.push(full);
  writeFileSync(logPath, JSON.stringify(entries, null, 2) + '\n', 'utf-8');
  return full;
}
