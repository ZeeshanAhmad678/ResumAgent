#  ResumAgent: Intelligent Research Paper Summarizer

> Streamline your academic research with ResumAgent, an automated agent that turns dense PDFs into clear, actionable summaries. With permanent SQLite chat history and a sleek, glassmorphic UI, it is the perfect research companion for students and faculty.

##  System Overview
ResumAgent is an intelligent, task-oriented AI agent built to automate the extraction of structured knowledge from individual research papers. By leveraging the advanced language comprehension of Google's **Gemini 2.5 Flash**, it reduces human reading time from 30 minutes to under 60 seconds.

The system is built on the **Brain-Memory-Toolkit** intelligent agent paradigm:
* **Brain:** Gemini 2.5 Flash acts as the central reasoning engine, enforcing a strict 5-section JSON schema via prompt engineering.
* **Memory:** A serverless **SQLite database** provides long-term, permanent storage. It saves parsed papers, generated JSON summaries, and subsequent user chat histories across sessions, allowing users to resume previous contextual chats instantly.
* **Perception & Action Toolkit:** A robust FastAPI backend handles physical document parsing, text preprocessing, and output formatting.

### The 5-Step Pipeline
1. **Validating Input:** Checks file integrity and token limits.
2. **Extracting Text:** PyPDF2 parses pages and concatenates text.
3. **Preprocessing:** Regular expressions strip redundant headers, footers, and references to optimize token usage and model attention.
4. **LLM Inference:** Gemini 2.5 Flash synthesizes the paper into 5 discrete sections: *Objective, Methodology, Key Findings, Limitations, and Future Work*.
5. **Formatting Output:** Deserializes the JSON into interactive React components.

##  Tech Stack
* **Frontend:** React (Vite), CSS Modules (Custom Glassmorphic UI)
* **Backend:** FastAPI, SQLAlchemy (SQLite Database), PyPDF2
* **LLM Engine:** Google Gemini 2.5 Flash

##  Setup Instructions

### Prerequisites
* Python 3.10+
* Node.js 18+
* A free Google Gemini API Key

### 1. Backend Setup
Navigate to the backend directory and install the required dependencies:
```bash
cd backend
pip install fastapi uvicorn google-generativeai pypdf2 python-dotenv sqlalchemy
```

Create a `.env` file in the `backend` folder and add your Gemini API key:
```env
GEMINI_API_KEY=AIzaSyYourActualApiKeyGoesHere
```

Start the backend server:
```bash
uvicorn main:app --reload
```
*Note: The server will run at `http://127.0.0.1:8000` and will automatically initialize the SQLite database (`resumagent.db`) on its first run.*

### 2. Frontend Setup
Open a new terminal window, navigate to the frontend directory, and install the Node dependencies:
```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```
*The React UI will be available at `http://localhost:5173`.*

##  Usage Guide
1. **Upload:** Drag and drop a research paper (PDF) into the upload zone.
2. **Pipeline:** Watch the 5-step animated loading sequence process the document.
3. **Review:** Explore the 5 generated summary cards.
4. **Interact:** Use the "Chat with Paper" feature to ask highly specific contextual questions. The agent uses the paper's contents as its knowledge base and permanently saves the conversation to SQLite.
5. **History Logs:** Click the floating "History Logs" button to open the sliding sidebar. This accesses your permanent database records, allowing you to instantly reload past papers and resume previous chat sessions right where you left off.
6. **Clear History:** Use the clear button in the sidebar to securely wipe the SQLite database and start fresh.