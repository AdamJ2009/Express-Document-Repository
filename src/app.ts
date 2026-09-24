import express, { type Express, type Request, type Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { initDb } from './db.js';
import { createDocument, getAllDocuments, getDocumentById, archiveDocument, getAllArchive, restoreDocument, updateDocument } from './repositories/documentRepository.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();
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
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Serve new.html for document upload page
app.get('/new.html', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/new.html'));
});

// Serve document.html for single document detail view
app.get('/document/:id', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/document.html'));
});

// Serve the actual raw file stored on disk for a document ID
app.get('/document/:id/file', async (req: Request, res: Response) => {
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
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve file' });
  }
});

app.get('/archive', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/archive.html'));
});

app.get('/document/:id/edit', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/edit.html'));
});

// --- API Endpoints ---

// Get all documents
app.get('/documents', async (req: Request, res: Response) => {
  try {
    const docs = await getAllDocuments();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get a single document's metadata by ID
app.get('/api/documents/:id', async (req: Request, res: Response) => {
  try {
    const doc = await getDocumentById(Number(req.params.id));
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve document details' });
  }
});

// Archive document endpoint
app.patch('/api/documents/:id/archive', async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid document ID' });
  }

  try {
    const doc = await getDocumentById(id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Call repository archive function
    await archiveDocument(id);

    // Update history HTML log if present
    if (doc.history_reference) {
      const filePath = path.resolve(process.cwd(), doc.history_reference);
      if (fs.existsSync(filePath)) {
        let existingHtml = fs.readFileSync(filePath, 'utf8');
        const newDivHtml = `<div class="Archive">
    <h3>Archived at: ${new Date().toISOString()}</h3>
    </div>`;

        const updatedHtml = existingHtml.includes('</body>')
          ? existingHtml.replace('</body>', `${newDivHtml}\n</body>`)
          : `${existingHtml}\n${newDivHtml}`;

        fs.writeFileSync(filePath, updatedHtml, 'utf8');
      }
    }

    return res.status(200).json({ message: 'Document archived successfully' });
  } catch (error) {
    console.error('Error archiving document:', error);
    return res.status(500).json({ error: 'Failed to archive document' });
  }
});

// Generic patch handler fallback
app.patch('/api/documents/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid document ID' });
  }

  try {
    await archiveDocument(id);
    return res.status(200).json({ message: 'Document archived successfully' });
  } catch (error) {
    console.error('Error archiving document:', error);
    return res.status(500).json({ error: 'Failed to archive document' });
  }
});

app.put('/api/documents/:id', upload.single('documentFile'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { fileName, importanceFlag, accessFlag } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid document ID' });
  }

  try {
    const doc = await getDocumentById(id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const newImportance = parseInt(importanceFlag, 10) || 0;
    const newAccessLevel = parseInt(accessFlag, 10) || 0;
    const newFilePath = req.file ? req.file.path : undefined;

    const updateData: {
      file_name: string;
      importance_flag: number;
      access_flag: number;
      file_reference?: string;
      history_reference?: string;
    } = {
      file_name: fileName,
      importance_flag: newImportance,
      access_flag: newAccessLevel,
    };

    if (newFilePath) {
      updateData.file_reference = newFilePath;
    }

    // Append edit history to the existing HTML file if history_reference exists
    if (doc.history_reference) {
      const filePath = path.resolve(process.cwd(), doc.history_reference);

      if (fs.existsSync(filePath)) {
        // Collect <p> lines only for fields that have changed
        const historyLines: string[] = [];

        if (fileName !== undefined && fileName !== doc.file_name) {
          historyLines.push(`<p>New Name: ${fileName}</p>`);
        }

        if (newImportance !== Number(doc.importance_flag)) {
          historyLines.push(`<p>New importance: ${newImportance}</p>`);
        }

        if (newAccessLevel !== Number(doc.access_flag)) {
          historyLines.push(`<p>New access level: ${newAccessLevel}</p>`);
        }

        if (newFilePath && newFilePath !== doc.file_reference) {
          historyLines.push(`<p>New reference: ${newFilePath}</p>`);
        }

        // Only append to history if at least one field changed
        if (historyLines.length > 0) {
          let existingHtml = fs.readFileSync(filePath, 'utf8');

          const newDivHtml = `<h3>Edited at ${new Date().toISOString()}</h3>
        <div class="History edit">
        ${historyLines.join('\n        ')}
        </div>`;

          const updatedHtml = existingHtml.includes('</body>')
            ? existingHtml.replace('</body>', `${newDivHtml}\n</body>`)
            : `${existingHtml}\n${newDivHtml}`;

          fs.writeFileSync(filePath, updatedHtml, 'utf8');
        }
      }
    }

    await updateDocument(id, updateData);
    return res.status(200).json({ message: 'Document updated successfully' });
  } catch (error) {
    console.error('Error updating document:', error);
    return res.status(500).json({ error: 'Failed to update document' });
  }
});

app.get('/api/archive', async (_req: Request, res: Response) => {
  try {
    const archivedDocs = await getAllArchive();
    return res.status(200).json(archivedDocs);
  } catch (error) {
    console.error('Error fetching archive:', error);
    return res.status(500).json({ error: 'Failed to fetch archived documents' });
  }
});

app.patch('/api/archive/:id/restore', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  console.log("Running restore")
  if (isNaN(id)) {
    console.log("No ID")
    return res.status(400).json({ error: 'Invalid document ID' });
  }

  try {
    const doc = await getDocumentById(id);
    if (!doc) {
      console.log("No ID")
      return res.status(404).json({ error: 'Document not found' });
    }

    // Perform database restoration
    console.log("Doing the restore")
    await restoreDocument(id);

    // Safely attempt file append without crashing the API request if disk write fails
    if (doc.history_reference) {
      console.log("Running the history")
      try {
        // Strip leading slashes to keep file path relative to working directory
        const safeRelativePath = doc.history_reference.replace(/^[\/\\]+/, '');
        const filePath = path.resolve(process.cwd(), safeRelativePath);

        if (fs.existsSync(filePath)) {
          const existingHtml = fs.readFileSync(filePath, 'utf8');
          const newDivHtml = `<div class="Restore">\n  <h3>Restored at: ${new Date().toISOString()}</h3>\n</div>`;

          const updatedHtml = existingHtml.includes('</body>')
            ? existingHtml.replace('</body>', `${newDivHtml}\n</body>`)
            : `${existingHtml}\n${newDivHtml}`;

          fs.writeFileSync(filePath, updatedHtml, 'utf8');
        } else {
          console.warn(`[History Update] File not found at path: ${filePath}`);
        }
      } catch (fileErr) {
        // Log file system issues without blowing up the 200 OK restore response
        console.error(`[History Update Failed] Could not update history file for doc ${id}:`, fileErr);
      }
    }

    // Return the updated document object
    const updatedDoc = { ...doc, archive_flag: 0 };
    return res.status(200).json({ message: 'Document restored successfully', doc: updatedDoc });

  } catch (error) {
    console.error(`Error restoring document ID ${id}:`, error);
    return res.status(500).json({ error: 'Failed to restore document' });
  }
});

// Handle document upload from new.html form
app.post('/upload', upload.single('document'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const { importance_flag, archive_flag, access_flag, custom_file_name, fileName } = req.body;

    const chosenName = custom_file_name || fileName;
    const fileNameToSave = (chosenName && chosenName.trim() !== '') 
      ? chosenName.trim() 
      : req.file.originalname;

    // 1. Generate filename using timestamp
    const timestampFileName = `${Date.now()}.html`;

    // 2. Target /app/history/ explicitly using relative path or process.cwd()
    const historyDir = path.resolve(process.cwd(), 'history');
    if (!fs.existsSync(historyDir)) {
      fs.mkdirSync(historyDir, { recursive: true });
    }

    // 3. Absolute path to /app/history/123456789.html
    const filePath = path.join(historyDir, timestampFileName);
    
    // Read template HTML
    let header = fs.readFileSync(path.join(process.cwd(), 'history', 'history_head.html'), 'utf8');

    // Create the HTML div string
    const newDivHtml = `<div class="History original">
    <h3>Created at: ${new Date().toISOString()}</h3>
    <p>Original Name: ${fileNameToSave}</p>
    <p>Original importance: ${parseInt(importance_flag, 10) || 0}</p>
    <p>Original access level: ${parseInt(access_flag, 10) || 0} </p>
    <p>Original file reference: ${req.file.path}</p>
    </div>`;

    // Append the div right before </body> (or at the end if </body> isn't present)
    const updatedHtml = header.includes('</body>')
      ? header.replace('</body>', `${newDivHtml}\n</body>`)
      : `${header}\n${newDivHtml}`;

    // Write updated HTML content to file
    fs.writeFileSync(filePath, updatedHtml, 'utf8');

    // 4. Save relative path in DB
    const newDocId = await createDocument({
      file_name: fileNameToSave,
      file_reference: req.file.path,
      history_reference: `history/${timestampFileName}`,
      importance_flag: parseInt(importance_flag, 10) || 0,
      archive_flag: parseInt(archive_flag, 10) || 0,
      access_flag: parseInt(access_flag, 10) || 0
    });

    res.status(201).json({
      message: 'Document added successfully',
      id: newDocId,
      file: fileNameToSave
    });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ error: 'Failed to process document upload.' });
  }
});

app.use('/history', express.static(path.join(process.cwd(), 'history')));

// Initialize database schema before listening
async function startServer() {
  await initDb();
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
}

startServer();

export {};