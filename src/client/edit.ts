interface FullDocumentRecord {
  id: number;
  file_name: string;
  importance_flag: number;
  access_flag: number;
}

async function loadDocumentForEdit(): Promise<void> {
  const statusDiv = document.getElementById('status');

  const pathSegments = window.location.pathname.split('/');
  const cleanSegments = pathSegments.filter(Boolean);
  const docId = cleanSegments[1];

  if (!docId || isNaN(Number(docId))) {
    if (statusDiv) statusDiv.textContent = 'Invalid document ID.';
    return;
  }

  const backLink = document.getElementById('backLink') as HTMLAnchorElement | null;
  if (backLink) {
    backLink.href = `/document/${docId}`;
  }

  try {
    const response = await fetch(`/api/documents/${docId}`);
    if (!response.ok) {
      throw new Error('Document not found');
    }

    const doc: FullDocumentRecord = await response.json();

    (document.getElementById('fileName') as HTMLInputElement).value = doc.file_name;
    (document.getElementById('importanceFlag') as HTMLSelectElement).value = doc.importance_flag.toString();
    (document.getElementById('accessFlag') as HTMLInputElement).value = doc.access_flag.toString();

    const form = document.getElementById('editForm') as HTMLFormElement | null;
    if (form) {
      form.addEventListener('submit', (e) => handleEditSubmit(e, doc.id));
    }
  } catch (err) {
    if (statusDiv) {
      statusDiv.style.color = 'red';
      statusDiv.textContent = 'Failed to load document details for editing.';
    }
  }
}

async function handleEditSubmit(e: Event, docId: number): Promise<void> {
  e.preventDefault();

  const statusDiv = document.getElementById('status');
  if (statusDiv) {
    statusDiv.style.color = 'black';
    statusDiv.textContent = 'Saving changes...';
  }

  const formData = new FormData();
  const fileInput = document.getElementById('documentFile') as HTMLInputElement;
  const fileName = (document.getElementById('fileName') as HTMLInputElement).value.trim();
  const importanceFlag = (document.getElementById('importanceFlag') as HTMLSelectElement).value;
  const accessFlag = (document.getElementById('accessFlag') as HTMLInputElement).value;

  if (fileInput.files && fileInput.files[0]) {
    formData.append('documentFile', fileInput.files[0]);
  }

  formData.append('fileName', fileName);
  formData.append('importanceFlag', importanceFlag);
  formData.append('accessFlag', accessFlag);

  try {
    const response = await fetch(`/api/documents/${docId}`, {
      method: 'PUT',
      body: formData, // Browser automatically sets multipart/form-data header
    });

    if (!response.ok) {
      throw new Error('Failed to update document.');
    }

    if (statusDiv) {
      statusDiv.style.color = 'green';
      statusDiv.textContent = 'Document updated successfully! Redirecting...';
    }

    setTimeout(() => {
      window.location.href = `/document/${docId}`;
    }, 1000);
  } catch (err) {
    if (statusDiv) {
      statusDiv.style.color = 'red';
      statusDiv.textContent = err instanceof Error ? err.message : 'Error updating document.';
    }
  }
}

document.addEventListener('DOMContentLoaded', loadDocumentForEdit);