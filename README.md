# AegisExam AI 🛡️

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/FastAPI-0.100+-059669?style=for-the-badge&logo=fastapi" />
  <img src="https://img.shields.io/badge/Groq-Llama_3.3-FF6B35?style=for-the-badge" />
  <img src="https://img.shields.io/badge/TensorFlow.js-COCO--SSD-FF6F00?style=for-the-badge&logo=tensorflow" />
  <img src="https://img.shields.io/badge/MediaPipe-FaceMesh-4285F4?style=for-the-badge&logo=google" />
</p>

**The Future of Secure, AI-Proctored Assessments.**

AegisExam AI is a multi-modal proctoring and grading platform that combines **edge-based computer vision** running entirely in the browser with **server-side agentic AI** for intelligent analysis. It ensures exam integrity without compromising user privacy.

---

## ✨ Key Features

### 🔒 Multi-Modal Integrity System

| Layer | Technology | Description |
|-------|-----------|-------------|
| **Vision Sentry** | MediaPipe + COCO-SSD (Browser) | Real-time face tracking, gaze detection, person detection, phone detection |
| **Identity Verification** | Gemini 2.5 Flash (Backend) | AI-powered face matching against ID card photo |
| **Voice Sentry** | Whisper + Llama 3.3 (Backend) | Transcribes audio and flags "Hey Google", "Hey Siri" etc. |
| **Log Analyst** | Llama 3.1 8B (Backend) | Analyzes proctoring logs to detect systematic cheating patterns |

### 🤖 AI-Powered Grading
- **Subjective Evaluator**: Uses **Llama 3.3 70B** via LangGraph to grade essay answers
- **Rubric-Based Scoring**: Evaluates Correctness (50%), Depth (30%), Clarity (20%)
- **Instant Feedback**: Provides constructive feedback with confidence scores

### 🛡️ Proctoring Capabilities
| Detection | Trigger |
|-----------|---------|
| **No Face** | Face leaves the camera frame |
| **Multiple Faces** | More than 1 face OR person detected |
| **Looking Away** | Eyes/head diverted for sustained period |
| **Phone Detected** | Mobile phone, remote, or book visible |
| **Tab Switch** | Browser focus lost or tab changed |
| **Voice Violation** | Suspicious phrases in audio transcription |

### 🚨 Full-Screen Lockout
When a violation is detected, the exam is immediately **PAUSED** with a dramatic full-screen warning, preventing any further interaction until acknowledged.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Styling**: Tailwind CSS + Shadcn UI
- **Computer Vision**: 
  - MediaPipe FaceLandmarker (478-point face mesh)
  - TensorFlow.js + COCO-SSD (object detection)
- **Webcam**: react-webcam

### Backend
- **Framework**: FastAPI (Python 3.11)
- **AI Inference**: Groq Cloud
  - Llama 3.3 70B (Grading & Audio Analysis)
  - Llama 3.1 8B (Log Analysis)
  - Distil-Whisper (Audio Transcription)
- **Identity AI**: Google Gemini 2.5 Flash
- **Orchestration**: LangGraph + LangChain
- **Database**: SQLite (Local Development)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- [Groq API Key](https://console.groq.com) (Free)
- [Google AI API Key](https://aistudio.google.com/apikey) (Free)

### 1. Clone Repository
```bash
git clone https://github.com/Xombi17/hackVision.git
cd hackVision
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Create .env file
echo "GROQ_API_KEY=your_groq_key_here" > .env
echo "GOOGLE_API_KEY=your_google_key_here" >> .env

# Seed the database with mock exams
python -c "import requests; requests.post('http://localhost:8000/debug/seed_exams')"

# Run Server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
API runs at `http://localhost:8000`

### 3. Frontend Setup
```bash
cd web
npm install
npm run dev
```
App runs at `http://localhost:3000`

---

## 🧪 Testing

### Test AI Agents (Without Frontend)
```bash
cd backend
python test_integration.py  # Tests Grading & Log Integrity
python test_audio_logic.py  # Tests Voice Integrity Pipeline
```

### Test API Endpoints
```bash
# Get all exams
curl http://localhost:8000/exams

# Seed mock exam data
curl -X POST http://localhost:8000/debug/seed_exams
```

---

## 📂 Project Structure

```
hackVision/
├── backend/
│   ├── main.py              # FastAPI app with all endpoints
│   ├── grading_agent.py     # LangGraph grading pipeline
│   ├── integrity_agent.py   # Proctoring log analyzer
│   ├── audio_agent.py       # Voice transcription & analysis
│   ├── identity_agent.py    # Face verification with Gemini
│   └── requirements.txt
├── web/
│   ├── app/                  # Next.js App Router pages
│   │   ├── dashboard/        # Exam selection dashboard
│   │   ├── exam/[examId]/    # Dynamic exam interface
│   │   ├── onboarding/       # ID card & face registration
│   │   └── login/signup/     # Authentication
│   ├── components/
│   │   ├── exam/
│   │   │   ├── ExamInterface.tsx      # Main exam UI
│   │   │   └── IdentityVerification.tsx
│   │   └── ui/               # Shadcn components
│   ├── hooks/
│   │   └── useProctoring.ts  # MediaPipe + COCO-SSD logic
│   └── package.json
├── uploads/                  # ID cards & face images
└── README.md
```

---

## 🎯 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/signup` | Register new user |
| `POST` | `/auth/login` | Login user |
| `POST` | `/register_identity` | Upload ID card & face photo |
| `POST` | `/verify_identity` | Verify face against stored ID |
| `GET` | `/exams` | List all available exams |
| `GET` | `/exams/{id}` | Get exam with questions |
| `POST` | `/grade` | Grade a student answer |
| `POST` | `/analyze_audio_file` | Analyze audio for violations |
| `POST` | `/analyze` | Analyze proctoring logs |

---

## 🔐 Environment Variables

Create a `.env` file in the `backend/` directory:

```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
GOOGLE_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 📸 Screenshots

### Exam Interface with AI Proctoring
- Real-time face mesh overlay
- Object detection bounding boxes
- Violation counter badge

### Full-Screen Lockout
- Dramatic red warning screen
- Violation details displayed
- Resume button for acknowledgment

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

<p align="center">
  Built with ❤️ for <strong>Hackathon 2026</strong>
</p>
