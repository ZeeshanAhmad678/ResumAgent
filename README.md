# ResumAgent 🔬

**Intelligent Academic Research Paper Summarizer**  
Reduces reading time from 30 minutes to under 60 seconds using a 5-step agentic pipeline powered by Gemini 1.5 Flash.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        ResumAgent System                       │
├─────────────────────────────┬──────────────────────────────────┤
│        REACT FRONTEND       │         PYTHON BACKEND           │
│  ┌───────────────────────┐  │  ┌──────────────────────────┐   │
│  │ Memory (useState)     │  │  │ Short-Term Memory Buffer  │   │
│  │  • summaryData (JSON) │  │  │  (in-process dict store)  │   │
│  │  • apiKey / session   │  │  └──────────────────────────┘   │
│  └───────────────────────┘  │                                  │
│                             │  ┌──────────────────────────┐   │
│  ┌───────────────────────┐  │  │ BRAIN: Gemini 1.5 Flash   │   │
│  │ Output Formatter Tool │  │  │  System prompt (strict    │   │
│  │  • Deserialise JSON   │◄─┼──│  JSON schema, T=0.3)      │   │
│  │  • Map → SectionCards │  │  └──────────────────────────┘   │
│  └───────────────────────┘  │                                  │
│                             │  Toolkit:                        │
│                             │  ┌────────┐ ┌────────────────┐  │
│                             │  │PDF     │ │ API Connector  │  │
│                             │  │Parser  │ │ (google-genai) │  │
│                             │  │PyPDF2  │ └────────────────┘  │
│                             │  └────────┘                     │
└─────────────────────────────┴──────────────────────────────────┘
```

---

## 5-Step Pipeline

| Step | Name                       | Where           | Description                                                    |
|------|----------------------------|-----------------|----------------------------------------------------------------|
| 1    | User Input & Validation    | Backend         | File/text size check, PDF mime validation, ~30k token limit    |
| 2    | Text Extraction & Cleanup  | Backend         | PyPDF2 parse + regex removal of headers/footers/references     |
| 3    | Prompt Construction        | Backend         | System prompt + cleaned text concatenated into one payload     |
| 4    | LLM Inference              | Backend → Gemini| `gemini-1.5-flash` at temperature `0.3`, JSON mime enforced   |
| 5    | Output Formatting          | Frontend        | JSON deserialized → 5 glassmorphic SectionCards                |

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- A [Google AI Studio](https://aistudio.google.com/) API key (free tier works)

### 1 — Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API will be live at `http://localhost:8000`  
Swagger docs at `http://localhost:8000/docs`

### 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

UI will be live at `http://localhost:5173`

> The Vite dev server proxies `/summarize/*` requests to `http://localhost:8000`
> so no CORS configuration is needed during development.

---

## API Reference

### `POST /summarize/pdf`
Upload a PDF for analysis.

**Form Data:**
| Field     | Type   | Description                     |
|-----------|--------|---------------------------------|
| `file`    | File   | The PDF file (max 20 MB)        |
| `api_key` | string | Your Google Gemini API key      |

### `POST /summarize/text`
Submit raw paper text.

**JSON Body:**
```json
{
  "text": "...",
  "api_key": "AIza..."
}
```

### Response Schema (both endpoints)
```json
{
  "success": true,
  "source": "paper.pdf",
  "char_count": 42610,
  "summary": {
    "Objective":     "...",
    "Methodology":   "...",
    "Key Findings":  "...",
    "Limitations":   "...",
    "Future Work":   "..."
  }
}
```

---

## Project Structure

```
resumagent/
├── backend/
│   ├── main.py                  # FastAPI app — Brain + Memory + Toolkit
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx              # State management + pipeline coordinator
        ├── App.module.css
        ├── index.css            # Global dark theme + CSS variables
        └── components/
            ├── Header.jsx / .module.css
            ├── UploadPanel.jsx / .module.css    # PDF + text input
            ├── LoadingState.jsx / .module.css   # Animated pipeline view
            ├── SummaryDisplay.jsx / .module.css # Output Formatter Tool
            └── ErrorBanner.jsx / .module.css
```

---

## Design Decisions

| Decision                        | Rationale                                                         |
|---------------------------------|-------------------------------------------------------------------|
| Temperature = 0.3               | Factual accuracy over creativity for scientific summarization     |
| `response_mime_type=application/json` | Forces Gemini to produce valid JSON, reducing parse failures |
| References section stripped     | Removes ~20-30% of token load without losing substance            |
| Short-term memory (in-process)  | No DB dependency; safe for stateless serverless deployment        |
| CSS Modules                     | Scoped styles, no runtime overhead, works with Vite natively      |
