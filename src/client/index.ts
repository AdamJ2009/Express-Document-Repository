interface DocumentRecord {
  id: number;
  file_name: string;
  importance_flag: number;
}

async function fetchDocuments(): Promise<void> {
  const tbody = document.getElementById('documentsTableBody') as HTMLTableSectionElement | null;
  if (!tbody) return;

  try {
    const response = await fetch('/documents');
    const documents: DocumentRecord[] = await response.json();

    if (documents.length === 0) {
      tbody.innerHTML = '<tr><td colspan="2">No documents uploaded yet.</td></tr>';
      return;
    }

    tbody.innerHTML = documents.map(doc => `
      <tr>
        <td>
          <a href="/document/${doc.id}">${doc.file_name}</a>
        </td>
        <td>${doc.importance_flag === 1 ? 'Important' : 'Not Important'}</td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="2" style="color:red;">Failed to load documents.</td></tr>';
  }
}

document.addEventListener('DOMContentLoaded', fetchDocuments);