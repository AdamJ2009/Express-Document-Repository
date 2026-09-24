async function fetchDocuments() {
    const tbody = document.getElementById('documentsTableBody');
    if (!tbody)
        return;
    try {
        const response = await fetch('/documents');
        const documents = await response.json();
        if (documents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3">No documents uploaded yet.</td></tr>';
            return;
        }
        tbody.innerHTML = documents.map(doc => `
      <tr>
        <td>
          <a href="/document/${doc.id}">${doc.file_name}</a>
        </td>
        <td>${new Date(doc.created_at).toLocaleString()}</td>
        <td>${doc.importance_flag === 1 ? 'Important' : 'Not Important'}</td>
      </tr>
    `).join('');
    }
    catch (err) {
        tbody.innerHTML = '<tr><td colspan="3" style="color:red;">Failed to load documents.</td></tr>';
    }
}
document.addEventListener('DOMContentLoaded', fetchDocuments);
