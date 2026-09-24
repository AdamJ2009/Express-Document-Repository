interface DocumentRecord {
  id: number;
  file_name: string;
  updated_at: string;
  history_reference?: string;
}

async function fetchArchivedDocuments(): Promise<void> {
  const tbody = document.getElementById('documentsTableBody') as HTMLTableSectionElement | null;
  if (!tbody) return;

  try {
    const response = await fetch('/api/archive');

    if (!response.ok) {
      throw new Error('Failed to fetch archived documents');
    }

    const documents: DocumentRecord[] = await response.json();

    if (documents.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">No documents archived yet.</td></tr>';
      return;
    }

    tbody.innerHTML = documents.map(doc => `
      <tr id="doc-row-${doc.id}">
        <td>
          ${doc.file_name}
        </td>
        <td>${doc.updated_at ? new Date(doc.updated_at).toLocaleString() : 'N/A'}</td>
        <td>
          <button onclick="restoreDocument(${doc.id})">Restore</button>
        </td>
        <td>
          ${doc.history_reference ? `<a href="${doc.history_reference}">View History</a>` : 'N/A'}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="4" style="color:red;">Failed to load archived documents.</td></tr>';
  }
}

async function restoreDocument(id: number): Promise<void> {
  const confirmRestore = confirm('Are you sure you want to restore this document to active status?');
  if (!confirmRestore) return;
  console.log("Restoring")

  try {
    const response = await fetch(`/api/archive/${id}/restore`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to restore document AAAA');
    }

    // Remove row from table upon successful restore
    const row = document.getElementById(`doc-row-${id}`);
    if (row) {
      row.remove();
    }

    // Display empty state if last row was removed
    const tbody = document.getElementById('documentsTableBody') as HTMLTableSectionElement | null;
    if (tbody && tbody.children.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">No documents archived yet.</td></tr>';
    }

    alert('Document restored successfully!');
  } catch (err) {
    alert(err instanceof Error ? err.message : 'An error occurred while restoring.');
  }
}

// Make restoreDocument accessible globally for onclick attribute
(window as unknown as Record<string, unknown>).restoreDocument = restoreDocument;

document.addEventListener('DOMContentLoaded', fetchArchivedDocuments);