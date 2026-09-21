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

  const pathSegments = window.location.pathname.split('/');
  const docId = pathSegments[pathSegments.length - 1];

  if (!docId || isNaN(Number(docId))) {
    if (loadingDiv) loadingDiv.style.display = 'none';
    if (errorDiv) errorDiv.textContent = 'Invalid document ID.';
    return;
  }

  try {
    // Note: If archived documents fail here, ensure your backend GET route permits fetching archived docs
    const response = await fetch(`/api/documents/${docId}`);
    
    if (!response.ok) {
      throw new Error('Document not found');
    }

    const doc: FullDocumentRecord = await response.json();

    // Populate UI fields
    document.getElementById('docId')!.textContent = doc.id.toString();
    document.getElementById('fileName')!.textContent = doc.file_name;
    document.getElementById('importanceFlag')!.textContent = doc.importance_flag === 1 ? 'Important' : 'Not Important';
    document.getElementById('archiveFlag')!.textContent = doc.archive_flag === 1 ? 'Archived' : 'Active';
    document.getElementById('accessFlag')!.textContent = doc.access_flag.toString();
    document.getElementById('createdAt')!.textContent = new Date(doc.created_at).toLocaleString();
    document.getElementById('updatedAt')!.textContent = new Date(doc.updated_at).toLocaleString();
    document.getElementById('historyRef')!.textContent = doc.history_reference || 'N/A';

    const downloadLink = document.getElementById('downloadLink') as HTMLAnchorElement;
    if (downloadLink) {
      downloadLink.href = `/document/${doc.id}/file`;
    }

    // Configure action button dynamically
    const actionBtn = document.getElementById('actionBtn') as HTMLButtonElement | null;
    if (actionBtn) {
      setupActionButton(doc, actionBtn);
    }

    if (loadingDiv) loadingDiv.style.display = 'none';
    if (detailsDiv) detailsDiv.style.display = 'block';
  } catch (err) {
    if (loadingDiv) loadingDiv.style.display = 'none';
    if (errorDiv) errorDiv.textContent = 'Failed to load document details.';
  }
}

function setupActionButton(doc: FullDocumentRecord, button: HTMLButtonElement): void {
  // Clone button to strip existing event listeners if function is called again
  const newButton = button.cloneNode(true) as HTMLButtonElement;
  button.parentNode?.replaceChild(newButton, button);

  if (doc.archive_flag === 1) {
    // Document is archived -> Show Restore option
    newButton.textContent = 'Restore Document';
    newButton.style.backgroundColor = '#5cb85c'; // Green
    newButton.addEventListener('click', () => handleToggleArchive(doc.id, false));
  } else {
    // Document is active -> Show Delete (Archive) option
    newButton.textContent = 'Delete (Archive)';
    newButton.style.backgroundColor = '#d9534f'; // Red
    newButton.addEventListener('click', () => handleToggleArchive(doc.id, true));
  }
}

async function handleToggleArchive(docId: number, shouldArchive: boolean): Promise<void> {
  const errorDiv = document.getElementById('error');
  if (errorDiv) errorDiv.textContent = '';

  const actionText = shouldArchive ? 'archive' : 'restore';
  const confirmAction = confirm(`Are you sure you want to ${actionText} this document?`);
  if (!confirmAction) return;

  const endpoint = shouldArchive 
    ? `/api/documents/${docId}` 
    : `/api/archive/${docId}/restore`;

  try {
    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: shouldArchive ? JSON.stringify({ archive_flag: 1 }) : undefined
    });

    if (!response.ok) {
      throw new Error(`Failed to ${actionText} document.`);
    }

    // Refresh page details after successful toggle
    await loadDocumentDetails();
  } catch (err) {
    if (errorDiv) {
      errorDiv.textContent = err instanceof Error ? err.message : `An error occurred while trying to ${actionText}.`;
    }
  }
}

document.addEventListener('DOMContentLoaded', loadDocumentDetails);