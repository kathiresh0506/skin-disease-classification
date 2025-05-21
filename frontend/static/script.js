document.addEventListener('DOMContentLoaded', function() {
  const fileInput = document.getElementById('image-upload');
  const uploadArea = document.getElementById('upload-area');
  const analyzeBtn = document.getElementById('analyze-btn');
  const clearBtn = document.getElementById('clear-btn');
  const uploadText = document.getElementById('upload-text');
  const imgPreview = document.getElementById('image-preview');
  const resultDiv = document.getElementById('result');
  const loadingDiv = document.getElementById('loading');

  // Click on upload area opens file dialog
  uploadArea.addEventListener('click', () => fileInput.click());

  // Handle file selection
  fileInput.addEventListener('change', function(e) {
    if (e.target.files.length) {
      const file = e.target.files[0];
      if (!validateFile(file)) return;

      uploadText.textContent = file.name;
      analyzeBtn.disabled = false;

      imgPreview.src = URL.createObjectURL(file);
      imgPreview.style.display = 'block';
    }
  });

  // Drag and drop
  uploadArea.addEventListener('dragover', e => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', e => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      fileInput.files = e.dataTransfer.files;
      fileInput.dispatchEvent(new Event('change'));
    }
  });

  // Buttons
  clearBtn.addEventListener('click', clearResults);
  analyzeBtn.addEventListener('click', predictSkinDisease);

  function validateFile(file) {
    const maxSize = 5 * 1024 * 1024;
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
    clearError();
    resultDiv.innerHTML = '';
    loadingDiv.style.display = 'flex';

    const formData = new FormData();
    formData.append('image', fileInput.files[0]);

    try {
      const response = await fetch('/predict', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Server error');
      }
      const data = await response.json();
      displayResults(data);
    } catch (err) {
      showError(err.message);
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
    analyzeBtn.disabled = true;
    clearError();
  }

  function showError(message) {
    clearError();
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    resultDiv.innerHTML = '';
    resultDiv.appendChild(errorDiv);
  }

  function clearError() {
    const existing = document.querySelector('.error-message');
    if (existing) existing.remove();
  }
});