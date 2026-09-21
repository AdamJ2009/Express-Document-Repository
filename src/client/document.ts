interface FullDocumentRecord {
  id: number;
  file_name: string;
  file_reference: string;
  created_at: string;
  updated_at: string;
  history_reference: string;
  importance_flag: number;
  archive_flag: number;
  access_flag: number;
}

async function loadDocumentDetails(): Promise<void> {
  const loadingDiv = document.getElementById('loading');
  const detailsDiv = document.getElementById('documentDetails');
  const errorDiv = document.getElementById('error');

  // Extract ID from the end of URL pathname (e.g., /document/5 -> "5")
  const pathSegments = window.location.pathname.split('/');
  const docId = pathSegments[pathSegments.length - 1];

  if (!docId || isNaN(Number(docId))) {
    if (loadingDiv) loadingDiv.style.display = 'none';
    if (errorDiv) errorDiv.textContent = 'Invalid document ID.';
    return;
  }

  try {
    const response = await fetch(`/api/documents/${docId}`);
    
    if (!response.ok) {
      throw new Error('Document not found');
    }

    const doc: FullDocumentRecord = await response.json();

    // Populate metadata into the page
    document.getElementById('docId')!.textContent = doc.id.toString();
    document.getElementById('fileName')!.textContent = doc.file_name;
    document.getElementById('importanceFlag')!.textContent = doc.importance_flag === 1 ? 'Important' : 'Not Important';
    document.getElementById('archiveFlag')!.textContent = doc.archive_flag === 1 ? 'Archived' : 'Active';
    document.getElementById('accessFlag')!.textContent = doc.access_flag.toString();
    document.getElementById('createdAt')!.textContent = new Date(doc.created_at).toLocaleString();
    document.getElementById('updatedAt')!.textContent = new Date(doc.updated_at).toLocaleString();
    document.getElementById('historyRef')!.textContent = doc.history_reference || 'N/A';

    // Set download URL pointing to express file route
    const downloadLink = document.getElementById('downloadLink') as HTMLAnchorElement;
    if (downloadLink) {
      downloadLink.href = `/document/${doc.id}/file`;
    }

    if (loadingDiv) loadingDiv.style.display = 'none';
    if (detailsDiv) detailsDiv.style.display = 'block';
  } catch (err) {
    if (loadingDiv) loadingDiv.style.display = 'none';
    if (errorDiv) errorDiv.textContent = 'Failed to load document details.';
  }
}

document.addEventListener('DOMContentLoaded', loadDocumentDetails);