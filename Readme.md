# Skin Disease Classification Web App

## Setup

### Backend

1. Create a virtual environment and activate it:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # on Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Place your trained `skin_model.h5` inside `backend/model/`.

4. Create a `.env` file for secrets/config if needed (optional).

5. Run the server:
   ```bash
   python app.py
   ```

### Frontend

1. In a separate terminal, serve the `frontend/` folder. For a quick test, you can use:
   ```bash
   cd frontend
   python -m http.server 8000
   ```
2. Open `http://localhost:8000` in your browser.

   CI/CD checking


## Usage

- Select an image and click **Predict**.
- The backend returns the predicted disease and confidence.
