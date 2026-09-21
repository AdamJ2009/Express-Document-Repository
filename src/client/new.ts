const uploadForm = document.getElementById('uploadForm') as HTMLFormElement | null;
const statusDiv = document.getElementById('status') as HTMLDivElement | null;

if (uploadForm) {
    uploadForm.addEventListener('submit', async (e: Event) => {
        e.preventDefault();
        if (!statusDiv) return;

        const fileInput = document.getElementById('documentFile') as HTMLInputElement | null;
        const customNameInput = document.getElementById('fileName') as HTMLInputElement | null;
        const importanceInput = document.getElementById('importanceFlag') as HTMLSelectElement | null;
        const archiveSelect = document.getElementById('archiveFlag') as HTMLSelectElement | null;
        const accessInput = document.getElementById('accessFlag') as HTMLInputElement | null;

        if (!fileInput || !fileInput.files || !fileInput.files[0]) {
            statusDiv.style.color = 'red';
            statusDiv.textContent = 'Please select a file to upload.';
            return;
        }

        const formData = new FormData();
        
        // 1. Text fields MUST be appended first so Multer populates req.body before reading the file stream
        const customNameValue = customNameInput && customNameInput.value.trim() ? customNameInput.value.trim() : '';
        formData.append('custom_file_name', customNameValue);
        formData.append('fileName', customNameValue);
        formData.append('importance_flag', importanceInput ? importanceInput.value : '0');
        formData.append('archive_flag', archiveSelect ? archiveSelect.value : '0');
        formData.append('access_flag', accessInput ? accessInput.value : '0');

        // 2. Append binary file LAST
        formData.append('document', fileInput.files[0]);

        statusDiv.style.color = 'black';
        statusDiv.textContent = 'Uploading...';

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                statusDiv.style.color = 'green';
                statusDiv.textContent = `Success! Added Document ID: ${result.id}. Redirecting...`;
                uploadForm.reset();
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else {
                statusDiv.style.color = 'red';
                statusDiv.textContent = result.error || 'Upload failed.';
            }
        } catch (err) {
            statusDiv.style.color = 'red';
            statusDiv.textContent = 'Error uploading document.';
        }
    });
}