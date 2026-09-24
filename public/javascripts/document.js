async function loadDocumentDetails() {
    const loadingDiv = document.getElementById('loading');
    const detailsDiv = document.getElementById('documentDetails');
    const errorDiv = document.getElementById('error');
    const pathSegments = window.location.pathname.split('/');
    const docId = pathSegments[pathSegments.length - 1];
    if (!docId || isNaN(Number(docId))) {
        if (loadingDiv)
            loadingDiv.style.display = 'none';
        if (errorDiv)
            errorDiv.textContent = 'Invalid document ID.';
        return;
    }
    try {
        const response = await fetch(`/api/documents/${docId}`);
        if (!response.ok) {
            throw new Error('Document not found');
        }
        const doc = await response.json();
        // Populate UI fields
        document.getElementById('fileName').textContent = doc.file_name;
        // Apply CSS Badges for importance & access flags
        const importanceEl = document.getElementById('importanceFlag');
        const isImportant = doc.importance_flag === 1;
        importanceEl.textContent = isImportant ? 'Important' : 'Standard';
        importanceEl.className = `badge ${isImportant ? 'badge-high' : 'badge-low'}`;
        document.getElementById('accessFlag').textContent = doc.access_flag.toString();
        document.getElementById('createdAt').textContent = new Date(doc.created_at).toLocaleString();
        document.getElementById('updatedAt').textContent = new Date(doc.updated_at).toLocaleString();
        document.getElementById('historyRef').textContent = doc.history_reference || 'N/A';
        const downloadLink = document.getElementById('downloadLink');
        if (downloadLink) {
            downloadLink.href = `/document/${doc.id}/file`;
        }
        const historyLink = document.getElementById('historyLink');
        if (historyLink && doc.history_reference) {
            historyLink.href = `/${doc.history_reference}`;
        }
        // Configure Edit & Action Buttons using CSS classes
        setupActionButtons(doc);
        if (loadingDiv)
            loadingDiv.style.display = 'none';
        if (detailsDiv)
            detailsDiv.style.display = 'block';
    }
    catch (err) {
        if (loadingDiv)
            loadingDiv.style.display = 'none';
        if (errorDiv)
            errorDiv.textContent = 'Failed to load document details.';
    }
}
function setupActionButtons(doc) {
    const editBtn = document.getElementById('editBtn');
    const actionBtn = document.getElementById('actionBtn');
    if (!actionBtn) {
        console.error('PROOF ERROR: #actionBtn not found in DOM.');
        return;
    }
    // Clone element to reset prior listeners
    const newActionBtn = actionBtn.cloneNode(true);
    newActionBtn.type = 'button';
    const isArchived = doc.archive_flag === 1;
    const targetArchiveState = !isArchived; // true to archive, false to restore
    // Set visual text & class based on document state
    if (isArchived) {
        if (editBtn)
            editBtn.style.display = 'none';
        newActionBtn.textContent = 'Restore Document';
        newActionBtn.className = 'btn-detail btn-restore';
    }
    else {
        if (editBtn) {
            editBtn.style.display = 'inline-flex';
            editBtn.href = `/document/${doc.id}/edit`;
        }
        newActionBtn.textContent = 'Delete (Archive)';
        newActionBtn.className = 'btn-detail btn-archive';
    }
    // --- SINGLE CLICK HANDLER WITH PROOF ---
    newActionBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // 1. VISUAL PROOF: Instantly turns green and changes text on physical click
        const originalText = newActionBtn.textContent;
        newActionBtn.style.backgroundColor = '#ff0000'; // Green feedback
        newActionBtn.style.color = '#ffffff';
        newActionBtn.textContent = 'Deleting, please wait';
        // 2. CONSOLE PROOF: Outputs detailed event object & status
        console.log('[PROOF] Button Click Event Registered:', {
            timestamp: new Date().toISOString(),
            documentId: doc.id,
            action: targetArchiveState ? 'Archive' : 'Restore',
            eventTarget: e.target
        });
        // 3. ALERT PROOF: Native modal window confirmation
        // (Uncomment line below if you want an explicit popup block)
        // alert(`Click verified for Document ID: ${doc.id}`);
        // Call your actual handler
        try {
            handleToggleArchive(doc.id, targetArchiveState);
        }
        catch (err) {
            console.error('[PROOF ERROR] handleToggleArchive threw an exception:', err);
            newActionBtn.textContent = originalText;
            newActionBtn.style.backgroundColor = '#ef4444'; // Red error feedback
        }
    });
    // Replace node in DOM
    actionBtn.parentNode?.replaceChild(newActionBtn, actionBtn);
}
async function handleToggleArchive(docId, shouldArchive) {
    const errorDiv = document.getElementById('error');
    if (errorDiv)
        errorDiv.textContent = '';
    const actionText = shouldArchive ? 'archive' : 'restore';
    const confirmAction = confirm(`Are you sure you want to ${actionText} this document?`);
    if (!confirmAction)
        return;
    const endpoint = shouldArchive
        ? `/api/documents/${docId}/archive`
        : `/api/archive/${docId}/restore`;
    try {
        const response = await fetch(endpoint, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            throw new Error(`Failed to ${actionText} document.`);
        }
        setTimeout(() => {
            window.location.href = shouldArchive ? '/archive' : '/';
        }, 1000);
    }
    catch (err) {
        if (errorDiv) {
            errorDiv.textContent = err instanceof Error ? err.message : `An error occurred while trying to ${actionText}.`;
        }
    }
}
document.addEventListener('DOMContentLoaded', loadDocumentDetails);
