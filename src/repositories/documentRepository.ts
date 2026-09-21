import { db } from '../db.js';
import type { RunResult } from 'sqlite3';

export interface DocumentRecord {
  id?: number;
  file_name: string;
  file_reference: string;
  created_at?: string;
  updated_at?: string;
  history_reference: string;
  importance_flag: number; // Single digit enum, 0=not important, 1=important
  archive_flag: number;    // Single digit enum, 0=active, 1=archived
  access_flag: number;     // Single digit enum, 0=public, 1=logged in only, 2=admin only
}

/**
 * Insert a document into the database
 */
export const createDocument = (doc: Omit<DocumentRecord, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO documents (
        file_name, 
        file_reference, 
        history_reference, 
        importance_flag, 
        archive_flag,
        access_flag
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(
      sql,
      [
        doc.file_name,
        doc.file_reference,
        doc.history_reference,
        doc.importance_flag,
        doc.archive_flag,
        doc.access_flag
      ],
      function (this: RunResult, err: Error | null) {
        if (err) reject(err);
        else resolve(this.lastID); // Returns the iterating primary key ID
      }
    );
  });
};

/**
 * Fetch all documents from the database
 */
export const getAllDocuments = (): Promise<DocumentRecord[]> => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM documents WHERE archive_flag = 0 ORDER BY importance_flag DESC`;

    db.all(sql, [], (err: Error | null, rows: DocumentRecord[]) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

/**
 * Fetch a single document by ID
 */
export const getDocumentById = (id: number): Promise<DocumentRecord | null> => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM documents WHERE id = ?`;

    db.get(sql, [id], (err: Error | null, row: DocumentRecord) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
};

export const archiveDocument = (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE documents 
      SET archive_flag = 1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;

    db.run(sql, [id], function (this: RunResult, err: Error | null) {
      if (err) {
        reject(err);
      } else if (this.changes === 0) {
        reject(new Error('Document not found'));
      } else {
        resolve();
      }
    });
  });
};

export const getAllArchive = (): Promise<DocumentRecord[]> => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM documents WHERE archive_flag = 1`;

    db.all(sql, [], (err: Error | null, rows: DocumentRecord[]) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

export const restoreDocument = (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE documents 
      SET archive_flag = 0, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;

    db.run(sql, [id], function (this: RunResult, err: Error | null) {
      if (err) {
        reject(err);
      } else if (this.changes === 0) {
        reject(new Error('Archived document not found'));
      } else {
        resolve();
      }
    });
  });
};

export interface UpdateDocumentPayload {
  file_name: string;
  importance_flag: number;
  access_flag: number;
  file_reference?: string;
  history_reference?: string;
}

/**
 * Update document metadata and optionally replace the file reference
 */
export const updateDocument = (id: number, data: UpdateDocumentPayload): Promise<void> => {
  return new Promise((resolve, reject) => {
    let sql: string;
    let params: (string | number)[];

    if (data.file_reference && data.history_reference) {
      // New file uploaded -> Update file pointers too
      sql = `
        UPDATE documents 
        SET file_name = ?, 
            importance_flag = ?, 
            access_flag = ?, 
            file_reference = ?, 
            history_reference = ?, 
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND archive_flag = 0
      `;
      params = [
        data.file_name,
        data.importance_flag,
        data.access_flag,
        data.file_reference,
        data.history_reference,
        id,
      ];
    } else {
      // No file change -> Metadata update only
      sql = `
        UPDATE documents 
        SET file_name = ?, 
            importance_flag = ?, 
            access_flag = ?, 
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND archive_flag = 0
      `;
      params = [data.file_name, data.importance_flag, data.access_flag, id];
    }

    db.run(sql, params, function (this: RunResult, err: Error | null) {
      if (err) {
        reject(err);
      } else if (this.changes === 0) {
        reject(new Error('Document not found or is archived'));
      } else {
        resolve();
      }
    });
  });
};

