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
    const response = await fetch(`/api/documents/${docId}`);

    if (!response.ok) {
      throw new Error('Document not found');
    }

    const doc: FullDocumentRecord = await response.json();

    // Populate UI fields
    document.getElementById('fileName')!.textContent = doc.file_name;

    // Apply CSS Badges for importance & access flags
    const importanceEl = document.getElementById('importanceFlag')!;
    const isImportant = doc.importance_flag === 1;
    importanceEl.textContent = isImportant ? 'Important' : 'Standard';
    importanceEl.className = `badge ${isImportant ? 'badge-high' : 'badge-low'}`;

    document.getElementById('accessFlag')!.textContent = doc.access_flag.toString();
    document.getElementById('createdAt')!.textContent = new Date(doc.created_at).toLocaleString();
    document.getElementById('updatedAt')!.textContent = new Date(doc.updated_at).toLocaleString();
    document.getElementById('historyRef')!.textContent = doc.history_reference || 'N/A';

    const downloadLink = document.getElementById('downloadLink') as HTMLAnchorElement;
    if (downloadLink) {
      downloadLink.href = `/document/${doc.id}/file`;
    }

    // Configure Edit & Action Buttons using CSS classes
    setupActionButtons(doc);

    if (loadingDiv) loadingDiv.style.display = 'none';
    if (detailsDiv) detailsDiv.style.display = 'block';
  } catch (err) {
    if (loadingDiv) loadingDiv.style.display = 'none';
    if (errorDiv) errorDiv.textContent = 'Failed to load document details.';
  }
}

function setupActionButtons(doc: FullDocumentRecord): void {
  const editBtn = document.getElementById('editBtn') as HTMLAnchorElement | null;
  const actionBtn = document.getElementById('actionBtn') as HTMLButtonElement | null;

  if (!actionBtn) return;

  // Clone actionBtn to clear old event listeners
  const newActionBtn = actionBtn.cloneNode(true) as HTMLButtonElement;
  actionBtn.parentNode?.replaceChild(newActionBtn, actionBtn);

  if (doc.archive_flag === 1) {
    // --- ARCHIVED STATE ---
    if (editBtn) editBtn.style.display = 'none';

    newActionBtn.textContent = 'Restore Document';
    // Clear inline styles and apply stylesheet classes
    newActionBtn.removeAttribute('style');
    newActionBtn.className = 'btn-detail btn-restore';
    newActionBtn.addEventListener('click', () => handleToggleArchive(doc.id, false));
  } else {
    // --- ACTIVE STATE ---
    if (editBtn) {
      editBtn.style.display = 'inline-flex';
      editBtn.href = `/document/${doc.id}/edit`;
    }

    newActionBtn.textContent = 'Delete (Archive)';
    // Clear inline styles and apply stylesheet classes
    newActionBtn.removeAttribute('style');
    newActionBtn.className = 'btn-detail btn-archive';
    newActionBtn.addEventListener('click', () => handleToggleArchive(doc.id, true));
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

    // Delay redirect for 1.5 seconds after a successful archive/restore
    setTimeout(() => {
      window.location.href = '/';
    }, 1500);

  } catch (err) {
    if (errorDiv) {
      errorDiv.textContent = err instanceof Error ? err.message : `An error occurred while trying to ${actionText}.`;
    }
  }
}

document.addEventListener('DOMContentLoaded', loadDocumentDetails);