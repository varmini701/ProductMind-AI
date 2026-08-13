# ProductMind AI — UniHack MVP

AI-powered product intelligence MVP: PDF -> extraction -> structured product -> evidence -> validation -> enrichment.

## Stack
- Backend: Python, FastAPI, PyMuPDF, Pydantic, OpenAI SDK
- Frontend: React + Vite
- MVP starts with PDF. Add CSV, URLs, images, embeddings and batch processing after the core pipeline is stable.

## Quick start

### Backend (Windows PowerShell)
```powershell
cd backend
py -3.11 -m venv .venv
.venv\\Scripts\\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
copy .env.example .env
```

Edit `.env`:
```env
MOCK_MODE=true
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5
```
Use `MOCK_MODE=true` to test the UI without an API key. For real AI set `MOCK_MODE=false` and add your API key.

Start backend:
```powershell
uvicorn app.main:app --reload --port 8000
```
Open http://127.0.0.1:8000/docs

### Frontend
Open another terminal:
```powershell
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

## Demo flow
1. Upload an industrial PDF.
2. Click Analyze Product.
3. Inspect category, attributes, confidence and evidence.
4. Open Validation to see missing/low-confidence/suspicious values.
5. Open AI Enrichment and generate description, bullets, applications and keywords.

## Real AI
The backend uses the OpenAI Responses API with Structured Outputs. Keep the API key on the backend only; never put it in React code.

## Hackathon story
"ProductMind AI is an explainable Product Intelligence Engine that transforms fragmented industrial product information into validated, enriched, commerce-ready product records."
