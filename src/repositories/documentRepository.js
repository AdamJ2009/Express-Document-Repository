import { db } from '../db.js';
/**
 * Insert a document into the database
 */
export const createDocument = (doc) => {
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
        db.run(sql, [
            doc.file_name,
            doc.file_reference,
            doc.history_reference,
            doc.importance_flag,
            doc.archive_flag,
            doc.access_flag
        ], function (err) {
            if (err)
                reject(err);
            else
                resolve(this.lastID); // Returns the iterating primary key ID
        });
    });
};
/**
 * Fetch all documents from the database
 */
export const getAllDocuments = () => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM documents WHERE archive_flag = 0`;
        db.all(sql, [], (err, rows) => {
            if (err)
                return reject(err);
            resolve(rows);
        });
    });
};
/**
 * Fetch a single document by ID
 */
export const getDocumentById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM documents WHERE id = ?`;
        db.get(sql, [id], (err, row) => {
            if (err)
                return reject(err);
            resolve(row || null);
        });
    });
};
export const archiveDocument = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
      UPDATE documents 
      SET archive_flag = 1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
        db.run(sql, [id], function (err) {
            if (err) {
                reject(err);
            }
            else if (this.changes === 0) {
                reject(new Error('Document not found'));
            }
            else {
                resolve();
            }
        });
    });
};
export const getAllArchive = () => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM documents WHERE archive_flag = 1`;
        db.all(sql, [], (err, rows) => {
            if (err)
                return reject(err);
            resolve(rows);
        });
    });
};
export const restoreDocument = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
      UPDATE documents 
      SET archive_flag = 0, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
        db.run(sql, [id], function (err) {
            if (err) {
                reject(err);
            }
            else if (this.changes === 0) {
                reject(new Error('Archived document not found'));
            }
            else {
                resolve();
            }
        });
    });
};
