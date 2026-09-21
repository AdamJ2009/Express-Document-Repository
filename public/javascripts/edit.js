async function loadDocumentForEdit() {
    const statusDiv = document.getElementById('status');
    const pathSegments = window.location.pathname.split('/');
    const cleanSegments = pathSegments.filter(Boolean);
    const docId = cleanSegments[1];
    if (!docId || isNaN(Number(docId))) {
        if (statusDiv)
            statusDiv.textContent = 'Invalid document ID.';
        return;
    }
    const backLink = document.getElementById('backLink');
    if (backLink) {
        backLink.href = `/document/${docId}`;
    }
    try {
        const response = await fetch(`/api/documents/${docId}`);
        if (!response.ok) {
            throw new Error('Document not found');
        }
        const doc = await response.json();
        document.getElementById('fileName').value = doc.file_name;
        document.getElementById('importanceFlag').value = doc.importance_flag.toString();
        document.getElementById('accessFlag').value = doc.access_flag.toString();
        const form = document.getElementById('editForm');
        if (form) {
            form.addEventListener('submit', (e) => handleEditSubmit(e, doc.id));
        }
    }
    catch (err) {
        if (statusDiv) {
            statusDiv.style.color = 'red';
            statusDiv.textContent = 'Failed to load document details for editing.';
        }
    }
}
async function handleEditSubmit(e, docId) {
    e.preventDefault();
    const statusDiv = document.getElementById('status');
    if (statusDiv) {
        statusDiv.style.color = 'black';
        statusDiv.textContent = 'Saving changes...';
    }
    const formData = new FormData();
    const fileInput = document.getElementById('documentFile');
    const fileName = document.getElementById('fileName').value.trim();
    const importanceFlag = document.getElementById('importanceFlag').value;
    const accessFlag = document.getElementById('accessFlag').value;
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
    }
    catch (err) {
        if (statusDiv) {
            statusDiv.style.color = 'red';
            statusDiv.textContent = err instanceof Error ? err.message : 'Error updating document.';
        }
    }
}
document.addEventListener('DOMContentLoaded', loadDocumentForEdit);
