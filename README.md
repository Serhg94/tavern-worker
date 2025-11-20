# TavernWorker

TavernWorker is a full-stack application designed to facilitate AI-driven role-playing game sessions. It combines a robust backend for game state management and AI integration with a modern, responsive frontend for user interaction.

## Architecture

The project is structured into two main components:

### Backend
- **Framework**: FastAPI (Python)
- **Database**: SQLite (via SQLModel)
- **AI Integration**: Ollama (for local LLM inference)
- **Key Features**:
    - Game session management
    - Character and journal entry tracking
    - Context-aware AI interactions

### Frontend
- **Framework**: React (Vite)
- **UI Library**: Material UI (MUI)
- **Key Features**:
    - Interactive game interface
    - Session management dashboard
    - Responsive design for desktop and mobile

## Getting Started

### Prerequisites
- **Docker** and **Docker Compose** (recommended for easy setup)
- **Node.js** (v18+) and **npm** (for local frontend development)
- **Python** (v3.10+) (for local backend development)
- **Ollama** (running locally for AI features)

### Running with Docker (Recommended)

1.  Ensure Docker and Docker Compose are installed and running.
2.  Ensure Ollama is running on your host machine (default port 11434).
3.  Run the following command in the root directory:

    ```bash
    docker-compose up --build
    ```

4.  Access the application:
    - **Frontend**: http://localhost:80
    - **Backend API**: http://localhost:8000/docs

### Running Locally

#### Backend

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Create a virtual environment and activate it:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Run the server:
    ```bash
    uvicorn main:app --reload
    ```
    The API will be available at http://localhost:8000.

#### Frontend

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    The frontend will be available at http://localhost:5173.
