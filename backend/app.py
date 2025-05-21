from flask import Flask, request, jsonify, send_from_directory, send_file
from werkzeug.utils import secure_filename
from flask_cors import CORS
import os
import torch
from torchvision import transforms
from PIL import Image
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Initialize Flask
app = Flask(__name__, static_folder='../frontend/static')
CORS(app)

# Configuration
app.config.update(
    UPLOAD_FOLDER=os.getenv('UPLOAD_FOLDER', 'uploads'),
    MAX_CONTENT_LENGTH=5 * 1024 * 1024,  # 5MB limit
    ALLOWED_EXTENSIONS={'png', 'jpg', 'jpeg'}
)

# Create upload folder
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define class names
CLASS_NAMES = [
    "Actinic Keratoses and Intraepithelial Carcinoma (akiec)",
    "Basal Cell Carcinoma (bcc)",
    "Benign Keratosis-like Lesions (bkl)",
    "Dermatofibroma (df)",
    "Melanocytic Nevi (nv)",
    "Melanoma (mel)",
    "Vascular Lesions (vasc)"
]

# Image transformations
TRANSFORM = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# Load PyTorch model
def load_model():
    try:
        model_path = os.path.join('model', 'efficientnet_skin_disease_full1.pth')
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at: {model_path}")
        
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        model = torch.load(model_path, map_location=device)
        model = model.to(device)
        model.eval()
        logger.info(f"Model loaded successfully on {device}")
        return model, device
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise

model, device = load_model()

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/')
def serve_frontend():
    return send_file('../frontend/index.html')

@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy'}), 200

@app.route('/predict', methods=['POST'])
def predict_skin_disease():
    if 'image' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if not (file and allowed_file(file.filename)):
        return jsonify({'error': 'File type not allowed'}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    try:
        img = Image.open(filepath).convert('RGB')
        img = TRANSFORM(img).unsqueeze(0).to(device)

        with torch.no_grad():
            outputs = model(img)
            _, preds = torch.max(outputs, 1)
            confidence = torch.nn.functional.softmax(outputs, dim=1)[0] * 100

        return jsonify({
            'result': CLASS_NAMES[preds[0]],
            'confidence': float(confidence[preds[0]])
        })

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({'error': 'Prediction failed'}), 500
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=os.getenv('FLASK_DEBUG', 'False') == 'True')