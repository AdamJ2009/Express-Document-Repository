async function fetchArchivedDocuments() {
    const tbody = document.getElementById('documentsTableBody');
    if (!tbody)
        return;
    try {
        const response = await fetch('/api/archive');
        if (!response.ok) {
            throw new Error('Failed to fetch archived documents');
        }
        const documents = await response.json();
        if (documents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3">No documents archived yet.</td></tr>';
            return;
        }
        tbody.innerHTML = documents.map(doc => `
      <tr id="doc-row-${doc.id}">
        <td>
          <a href="/document/${doc.id}">${doc.file_name}</a>
        </td>
        <td>${doc.updated_at ? new Date(doc.updated_at).toLocaleString() : 'N/A'}</td>
        <td>
          <button onclick="restoreDocument(${doc.id})">Restore</button>
        </td>
      </tr>
    `).join('');
    }
    catch (err) {
        tbody.innerHTML = '<tr><td colspan="3" style="color:red;">Failed to load archived documents.</td></tr>';
    }
}
async function restoreDocument(id) {
    const confirmRestore = confirm('Are you sure you want to restore this document to active status?');
    if (!confirmRestore)
        return;
    try {
        const response = await fetch(`/api/archive/${id}/restore`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error('Failed to restore document');
        }
        // Remove row from table upon successful restore
        const row = document.getElementById(`doc-row-${id}`);
        if (row) {
            row.remove();
        }
        // Display empty state if last row was removed
        const tbody = document.getElementById('documentsTableBody');
        if (tbody && tbody.children.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3">No documents archived yet.</td></tr>';
        }
        alert('Document restored successfully!');
    }
    catch (err) {
        alert(err instanceof Error ? err.message : 'An error occurred while restoring.');
    }
}
// Make restoreDocument accessible globally for onclick attribute
window.restoreDocument = restoreDocument;
document.addEventListener('DOMContentLoaded', fetchArchivedDocuments);
