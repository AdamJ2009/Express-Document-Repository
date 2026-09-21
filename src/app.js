import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { initDb } from './db.js';
import { createDocument, getAllDocuments, getDocumentById, archiveDocument, getAllArchive, restoreDocument, updateDocument } from './repositories/documentRepository.js';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = 3000;
// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
// Multer storage engine configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});
const upload = multer({ storage });
// Express Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(uploadDir));
// --- HTML Page Routes ---
// Serve index.html on root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});
// Serve new.html for document upload page
app.get('/new.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/new.html'));
});
// Serve document.html for single document detail view
app.get('/document/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/document.html'));
});
// Serve the actual raw file stored on disk for a document ID
app.get('/document/:id/file', async (req, res) => {
    try {
        const doc = await getDocumentById(Number(req.params.id));
        if (!doc || !doc.file_reference) {
            return res.status(404).json({ error: 'Document or file not found' });
        }
        const filePath = path.resolve(doc.file_reference);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File missing on server storage' });
        }
        res.sendFile(filePath);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to retrieve file' });
    }
});
app.get('/archive', (_req, res) => {
    res.sendFile(path.join(__dirname, '../public/archive.html'));
});
app.get('/document/:id/edit', (_req, res) => {
    res.sendFile(path.join(__dirname, '../public/edit.html'));
});
// --- API Endpoints ---
// Get all documents
app.get('/documents', async (req, res) => {
    try {
        const docs = await getAllDocuments();
        res.json(docs);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});
// Get a single document's metadata by ID
app.get('/api/documents/:id', async (req, res) => {
    try {
        const doc = await getDocumentById(Number(req.params.id));
        if (!doc) {
            return res.status(404).json({ error: 'Document not found' });
        }
        res.json(doc);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to retrieve document details' });
    }
});
app.patch('/api/documents/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid document ID' });
    }
    try {
        await archiveDocument(id);
        return res.status(200).json({ message: 'Document archived successfully' });
    }
    catch (error) {
        console.error('Error archiving document:', error);
        return res.status(500).json({ error: 'Failed to archive document' });
    }
});
app.put('/api/documents/:id', upload.single('documentFile'), async (req, res) => {
    const id = Number(req.params.id);
    const { fileName, importanceFlag, accessFlag } = req.body;
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid document ID' });
    }
    try {
        const updateData = {
            file_name: fileName,
            importance_flag: Number(importanceFlag),
            access_flag: Number(accessFlag),
        };
        if (req.file) {
            updateData.file_reference = req.file.path;
            updateData.history_reference = `history_${Date.now()}-${req.file.originalname}`;
        }
        await updateDocument(id, updateData);
        return res.status(200).json({ message: 'Document updated successfully' });
    }
    catch (error) {
        console.error('Error updating document:', error);
        return res.status(500).json({ error: 'Failed to update document' });
    }
});
app.get('/api/archive', async (_req, res) => {
    try {
        const archivedDocs = await getAllArchive();
        return res.status(200).json(archivedDocs);
    }
    catch (error) {
        console.error('Error fetching archive:', error);
        return res.status(500).json({ error: 'Failed to fetch archived documents' });
    }
});
app.patch('/api/archive/:id/restore', async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid document ID' });
    }
    try {
        await restoreDocument(id);
        return res.status(200).json({ message: 'Document restored successfully' });
    }
    catch (error) {
        console.error('Error restoring document:', error);
        return res.status(500).json({ error: 'Failed to restore document' });
    }
});
// Handle document upload from new.html form
app.post('/upload', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }
        const { importance_flag, archive_flag, access_flag, custom_file_name, fileName } = req.body;
        const chosenName = custom_file_name || fileName;
        const fileNameToSave = (chosenName && chosenName.trim() !== '')
            ? chosenName.trim()
            : req.file.originalname;
        const newDocId = await createDocument({
            file_name: fileNameToSave,
            file_reference: req.file.path,
            history_reference: `history_${req.file.filename}`,
            importance_flag: parseInt(importance_flag, 10) || 0,
            archive_flag: parseInt(archive_flag, 10) || 0,
            access_flag: parseInt(access_flag, 10) || 0
        });
        res.status(201).json({
            message: 'Document added successfully',
            id: newDocId,
            file: fileNameToSave
        });
    }
    catch (err) {
        console.error('Upload Error:', err);
        res.status(500).json({ error: 'Failed to process document upload.' });
    }
});
// Initialize database schema before listening
async function startServer() {
    await initDb();
    app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`);
    });
}
startServer();
