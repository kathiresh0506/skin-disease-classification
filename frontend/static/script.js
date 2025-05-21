document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('image-upload');
    const analyzeBtn = document.getElementById('analyze-btn');
    const clearBtn = document.getElementById('clear-btn');
    const uploadText = document.getElementById('upload-text');
    const imgPreview = document.getElementById('image-preview');
    const resultDiv = document.getElementById('result');
    const loadingDiv = document.getElementById('loading');
    
    // Handle file selection
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length) {
            const file = e.target.files[0];
            
            // Validate file
            if (!validateFile(file)) return;
            
            // Update UI
            uploadText.textContent = file.name;
            analyzeBtn.disabled = false;
            
            // Show preview
            imgPreview.src = URL.createObjectURL(file);
            imgPreview.style.display = 'block';
        }
    });
    
    // Drag and drop functionality
    const uploadArea = document.querySelector('.upload-area');
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            const event = new Event('change');
            fileInput.dispatchEvent(event);
        }
    });
    
    // Clear button
    clearBtn.addEventListener('click', clearResults);
    
    // Analyze button
    analyzeBtn.addEventListener('click', predictSkinDisease);
    
    function validateFile(file) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        
        if (!validTypes.includes(file.type)) {
            showError('Invalid file type. Please upload a JPG or PNG image.');
            return false;
        }
        
        if (file.size > maxSize) {
            showError('File too large. Maximum size is 5MB.');
            return false;
        }
        
        return true;
    }
    
    async function predictSkinDisease() {
        // Reset UI
        clearError();
        resultDiv.innerHTML = '';
        loadingDiv.style.display = 'flex';
        
        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        
        try {
            const response = await fetch('http://127.0.0.1:5000/predict', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Server error');
            }
            
            const data = await response.json();
            displayResults(data);
            
        } catch (error) {
            showError(error.message);
        } finally {
            loadingDiv.style.display = 'none';
        }
    }
    
    function displayResults(data) {
        resultDiv.innerHTML = `
            <h2>Analysis Results</h2>
            <div class="result-card">
                <h3>${data.result}</h3>
                <div class="confidence-meter">
                    <div class="confidence-fill" style="width: ${data.confidence}%"></div>
                </div>
                <p>Confidence: ${data.confidence.toFixed(2)}%</p>
            </div>
            <p class="recommendation">Consult a dermatologist for professional evaluation.</p>
        `;
    }
    
    function clearResults() {
        fileInput.value = '';
        uploadText.textContent = 'Choose an image or drag here';
        imgPreview.style.display = 'none';
        imgPreview.src = '';
        resultDiv.innerHTML = '';
        analyzeBtn.disabled = true;
        clearError();
    }
    
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        resultDiv.innerHTML = '';
        resultDiv.appendChild(errorDiv);
    }
    
    function clearError() {
        const errorDiv = document.querySelector('.error-message');
        if (errorDiv) errorDiv.remove();
    }
});