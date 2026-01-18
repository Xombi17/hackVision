from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq
import os
import shutil
import base64
import json
import random

# 1. Load Environment Variables BEFORE importing agents
load_dotenv()

# 2. Import Agents (now that env vars are set)
from grading_agent import grade_answer_graph
from integrity_agent import integrity_graph
from audio_agent import audio_graph
from identity_agent import identity_graph

# 3. Initialize App & Clients
app = FastAPI(title="AegisExam AI Service")
client = Groq() # For Whisper

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Request Models
class GradingRequest(BaseModel):
    question: str
    student_answer: str
    rubric: str

class IntegrityRequest(BaseModel):
    alerts: List[Dict[str, Any]]

class AudioRequest(BaseModel):
    transcript: str
    current_question: str

# 5. Endpoints
@app.get("/")
def read_root():
    return {"status": "AegisExam AI Service Running"}

@app.post("/grade")
async def grade_answer(request: GradingRequest):
    result = await grade_answer_graph.ainvoke({
        "question": request.question, 
        "student_answer": request.student_answer,
        "rubric": request.rubric
    })
    return result

@app.post("/analyze_integrity")
async def analyze_integrity(request: IntegrityRequest):
    result = await integrity_graph.ainvoke({
        "alerts": request.alerts
    })
    return result

@app.post("/verify_identity")
async def verify_identity(
    id_card: UploadFile = File(...),
    webcam_image: UploadFile = File(...)
):
    try:
        # Read Images
        id_card_bytes = await id_card.read()
        webcam_bytes = await webcam_image.read()
        
        # Handle PDF ID Card (Convert 1st page to Image)
        if id_card.filename.lower().endswith('.pdf'):
            import fitz # PyMuPDF
            doc = fitz.open(stream=id_card_bytes, filetype="pdf")
            if len(doc) > 0:
                page = doc.load_page(0)
                pix = page.get_pixmap()
                id_card_bytes = pix.tobytes("png")
        
        id_card_b64 = base64.b64encode(id_card_bytes).decode('utf-8')
        webcam_b64 = base64.b64encode(webcam_bytes).decode('utf-8')
        
        # Invoke Vision Agent
        result = await identity_graph.ainvoke({
            "id_card_image_base64": id_card_b64,
            "webcam_image_base64": webcam_b64
        })
        
        return result
    except Exception as e:
        return {"error": str(e)}

# --- LOCAL AUTHENTICATION & STORAGE (No Supabase) ---
from fastapi.responses import FileResponse
import sqlite3
import uuid

# Setup Local DB
DB_FILE = "hackathon.db"
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def init_db():
    with sqlite3.connect(DB_FILE) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE,
                password TEXT,
                full_name TEXT,
                id_card_path TEXT,
                face_ref_path TEXT
            )
        """)
        # Migration: Add face_ref_path if missing
        try:
            conn.execute("ALTER TABLE users ADD COLUMN face_ref_path TEXT")
        except sqlite3.OperationalError:
            pass # Column likely exists

        conn.execute("""
            CREATE TABLE IF NOT EXISTS exams (
                id TEXT PRIMARY KEY,
                title TEXT,
                description TEXT,
                duration_minutes INTEGER,
                category TEXT,
                difficulty TEXT,
                image_url TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS questions (
                id TEXT PRIMARY KEY,
                exam_id TEXT,
                question_text TEXT,
                question_type TEXT,
                options TEXT, -- JSON string
                correct_answer TEXT,
                FOREIGN KEY(exam_id) REFERENCES exams(id)
            )
        """)
    print("Database initialized.")
init_db()

class AuthRequest(BaseModel):
    email: str
    password: str
    full_name: str = None

@app.post("/auth/signup")
async def signup(req: AuthRequest):
    try:
        user_id = str(uuid.uuid4())
        with sqlite3.connect(DB_FILE) as conn:
            conn.execute(
                "INSERT INTO users (id, email, password, full_name) VALUES (?, ?, ?, ?)",
                (user_id, req.email, req.password, req.full_name)
            )
        return {"id": user_id, "email": req.email, "full_name": req.full_name}
    except sqlite3.IntegrityError:
        return {"error": "Email already exists"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/auth/login")
async def login(req: AuthRequest):
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.execute(
            "SELECT id, email, full_name, id_card_path FROM users WHERE email = ? AND password = ?",
            (req.email, req.password)
        )
        user = cursor.fetchone()
    
    if user:
        return {"id": user[0], "email": user[1], "full_name": user[2], "id_card_path": user[3]}
    return {"error": "Invalid credentials"}

@app.post("/upload_id_card")
async def upload_id_card(user_id: str = Form(...), file: UploadFile = File(...)):
    try:
        file_ext = file.filename.split('.')[-1]
        filename = f"{user_id}_id.{file_ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        with sqlite3.connect(DB_FILE) as conn:
            conn.execute("UPDATE users SET id_card_path = ? WHERE id = ?", (filepath, user_id))
            
        return {"status": "success", "path": filepath}
    except Exception as e:
        return {"error": str(e)}

@app.get("/get_id_card/{user_id}")
async def get_id_card(user_id: str):
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.execute("SELECT id_card_path FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
    
    if row and row[0] and os.path.exists(row[0]):
        return FileResponse(row[0])
    return {"error": "ID card not found"}

@app.post("/register_identity")
async def register_identity(
    user_id: str = Form(...),
    id_card: UploadFile = File(...),
    face_ref: UploadFile = File(...)
):
    try:
        # 1. Save ID Card
        id_ext = id_card.filename.split('.')[-1]
        id_filename = f"{user_id}_id.{id_ext}"
        id_path = os.path.join(UPLOAD_DIR, id_filename)
        
        with open(id_path, "wb") as buffer:
            shutil.copyfileobj(id_card.file, buffer)
            
        # 2. Save Face Reference
        face_ext = face_ref.filename.split('.')[-1]
        face_filename = f"{user_id}_face.{face_ext}"
        face_path = os.path.join(UPLOAD_DIR, face_filename)
        
        with open(face_path, "wb") as buffer:
            shutil.copyfileobj(face_ref.file, buffer)
            
        # 3. Update DB
        with sqlite3.connect(DB_FILE) as conn:
            # Check if column exists (migration hack for sqlite)
            try:
                conn.execute("ALTER TABLE users ADD COLUMN face_ref_path TEXT")
            except sqlite3.OperationalError:
                pass # Already exists
                
            conn.execute(
                "UPDATE users SET id_card_path = ?, face_ref_path = ? WHERE id = ?", 
                (id_path, face_path, user_id)
            )
            
        # 4. Verify Immediate Match (Optional but good for UX)
        # Read files for AI
        with open(id_path, "rb") as f:
            id_bytes = f.read()
            
        # If PDF, convert first page
        if id_path.lower().endswith('.pdf'):
            import fitz
            doc = fitz.open(id_path)
            pix = doc.load_page(0).get_pixmap()
            id_bytes = pix.tobytes("png")
            
        with open(face_path, "rb") as f:
            face_bytes = f.read()
            
        id_b64 = base64.b64encode(id_bytes).decode('utf-8')
        face_b64 = base64.b64encode(face_bytes).decode('utf-8')
        
        # Call Identity Agent
        from identity_agent import identity_graph
        verification = await identity_graph.ainvoke({
            "id_card_image_base64": id_b64,
            "webcam_image_base64": face_b64
        })
        
        if not verification.get("is_match", False):
            # Strict mode: fail registration? Or just warn?
            # For now, let's warn but allow (or fail if strict)
            pass
            
        return {
            "status": "success", 
            "verification": verification,
            "paths": {"id": id_path, "face": face_path}
        }
        
    except Exception as e:
        print(f"Register Identity Error: {e}")
        return {"error": str(e)}

@app.post("/upload_id_card")
async def upload_id_card(user_id: str = Form(...), file: UploadFile = File(...)):
    try:
        file_ext = file.filename.split('.')[-1]
        filename = f"{user_id}_id.{file_ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        with sqlite3.connect(DB_FILE) as conn:
            conn.execute("UPDATE users SET id_card_path = ? WHERE id = ?", (filepath, user_id))
            
        return {"status": "success", "path": filepath}
    except Exception as e:
        return {"error": str(e)}

@app.get("/get_id_card/{user_id}")
async def get_id_card(user_id: str):
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.execute("SELECT id_card_path FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
    
    if row and row[0] and os.path.exists(row[0]):
        return FileResponse(row[0])
    return {"error": "ID card not found"}

@app.post("/register_identity")
async def register_identity(
    user_id: str = Form(...), 
    id_card: UploadFile = File(...),
    face_ref: UploadFile = File(...)
):
    try:
        # 1. Save ID Card
        id_ext = id_card.filename.split('.')[-1]
        id_filename = f"{user_id}_id.{id_ext}"
        id_path = os.path.join(UPLOAD_DIR, id_filename)
        with open(id_path, "wb") as buffer:
            shutil.copyfileobj(id_card.file, buffer)

        # 2. Save Face Reference
        face_ext = face_ref.filename.split('.')[-1]
        face_filename = f"{user_id}_face.{face_ext}"
        face_path = os.path.join(UPLOAD_DIR, face_filename)
        with open(face_path, "wb") as buffer:
            shutil.copyfileobj(face_ref.file, buffer)
            
        # 3. Update DB
        with sqlite3.connect(DB_FILE) as conn:
            # Check if column exists (migration hack for sqlite)
            try:
                conn.execute("ALTER TABLE users ADD COLUMN face_ref_path TEXT")
            except sqlite3.OperationalError:
                pass # Already exists
                
            conn.execute(
                "UPDATE users SET id_card_path = ?, face_ref_path = ? WHERE id = ?", 
                (id_path, face_path, user_id)
            )

        # 4. Verify Immediate Match (Optional but good for UX)
        # Read files for AI
        with open(id_path, "rb") as f:
            id_bytes = f.read()
            
        # If PDF, convert first page
        if id_path.lower().endswith('.pdf'):
            import fitz
            doc = fitz.open(id_path)
            pix = doc.load_page(0).get_pixmap()
            id_bytes = pix.tobytes("png")
            
        with open(face_path, "rb") as f:
            face_bytes = f.read()
            
        id_b64 = base64.b64encode(id_bytes).decode('utf-8')
        face_b64 = base64.b64encode(face_bytes).decode('utf-8')
        
        # Call Identity Agent
        from identity_agent import identity_graph
        verification = await identity_graph.ainvoke({
            "id_card_image_base64": id_b64,
            "webcam_image_base64": face_b64
        })

        return {
            "status": "success", 
            "verification": verification,
            "paths": {"id": id_path, "face": face_path}
        }
    except Exception as e:
        return {"error": str(e)}

# --- EXAM & SEEDING ENDPOINTS ---

class Exam(BaseModel):
    id: str
    title: str
    description: str
    duration_minutes: int
    category: str
    difficulty: str
    image_url: str = None

class Question(BaseModel):
    id: str
    exam_id: str
    question_text: str
    question_type: str
    options: List[str]
    correct_answer: str

def generate_mock_exams():
    categories = ["Development", "Design", "Data Science", "Cybersecurity", "Management"]
    difficulties = ["Beginner", "Intermediate", "Advanced"]
    
    exams_data = []
    
    # 1. Frontend React Mastery
    exams_data.append({
        "title": "Frontend React Mastery",
        "description": "Test your knowledge of React hooks, components, and state management.",
        "duration": 45,
        "category": "Development",
        "difficulty": "Intermediate",
        "questions": [
            {"q": "What is the primary purpose of useEffect?", "opts": ["Side effects", "State management", "Routing", "Styling"], "ans": "Side effects"},
            {"q": "How do you pass data to child components?", "opts": ["Props", "State", "Context", "Redux"], "ans": "Props"},
            {"q": "Which hook is used for memoization?", "opts": ["useMemo", "useState", "useEffect", "useReducer"], "ans": "useMemo"},
            {"q": "What is the virtual DOM?", "opts": ["A copy of the real DOM", "A browser API", "A database", "A style sheet"], "ans": "A copy of the real DOM"},
            {"q": "Which method is used to update state?", "opts": ["setState", "updateState", "changeState", "modifyState"], "ans": "setState (or updater function)"}
        ]
    })

    # 2. Python Data Structures
    exams_data.append({
        "title": "Python Data Structures",
        "description": "Challenge yourself with Python lists, dictionaries, sets, and tuples.",
        "duration": 30,
        "category": "Development",
        "difficulty": "Beginner",
        "questions": [
            {"q": "Which data structure is immutable?", "opts": ["Tuple", "List", "Dictionary", "Set"], "ans": "Tuple"},
            {"q": "How do you define a dictionary?", "opts": ["{}", "[]", "()", "<>"], "ans": "{}"},
            {"q": "What is the time complexity of looking up an item in a set?", "opts": ["O(1)", "O(n)", "O(log n)", "O(n^2)"], "ans": "O(1)"},
            {"q": "Which method removes the last item from a list?", "opts": ["pop()", "remove()", "delete()", "clear()"], "ans": "pop()"},
            {"q": "Can lists contain different data types?", "opts": ["Yes", "No", "Only if specified", "Only strings"], "ans": "Yes"}
        ]
    })
    
    # 3. UI/UX Principles
    exams_data.append({
        "title": "UI/UX Design Principles",
        "description": "Evaluate your understanding of usability, accessibility, and visual hierarchy.",
        "duration": 60,
        "category": "Design",
        "difficulty": "Intermediate",
        "questions": [
            {"q": "What does 'affordance' mean in design?", "opts": ["Clues on how to use an object", "The cost of the product", "The color scheme", "The font size"], "ans": "Clues on how to use an object"},
            {"q": "Which color is best for error messages?", "opts": ["Red", "Green", "Blue", "Yellow"], "ans": "Red"},
            {"q": "What is the 3-click rule?", "opts": ["Users should find info in 3 clicks", "Mouse durability test", "Triple click action", "3 button mouse"], "ans": "Users should find info in 3 clicks"},
            {"q": "What is 'whitespace'?", "opts": ["Empty space between elements", "The color white", "Background image", "Header area"], "ans": "Empty space between elements"},
            {"q": "What does WCAG stand for?", "opts": ["Web Content Accessibility Guidelines", "Web Color And Graphics", "World Creative Art Group", "Wide Content Access Gateway"], "ans": "Web Content Accessibility Guidelines"}
        ]
    })

    # 4. Cybersecurity Basics
    exams_data.append({
        "title": "Cybersecurity Fundamentals",
        "description": "Test your awareness of common threats, encryption, and network security.",
        "duration": 40,
        "category": "Cybersecurity",
        "difficulty": "Beginner",
        "questions": [
            {"q": "What does Phishing involve?", "opts": ["Deceptive emails", "Fishing for compliments", "Network scanning", "Password cracking"], "ans": "Deceptive emails"},
            {"q": "What is 2FA?", "opts": ["Two-Factor Authentication", "Two-Face Algorithm", "To For All", "Token Free Access"], "ans": "Two-Factor Authentication"},
            {"q": "Which protocol is secure?", "opts": ["HTTPS", "HTTP", "FTP", "Telnet"], "ans": "HTTPS"},
            {"q": "What is a firewall?", "opts": ["Network security device", "A physical wall", "Antivirus software", "A virus"], "ans": "Network security device"},
            {"q": "What is SQL Injection?", "opts": ["Malicious SQL code execution", "Installing SQL", "Updating database", "Deleting tables safely"], "ans": "Malicious SQL code execution"}
        ]
    })
    
    # 5. Project Management 101
    exams_data.append({
        "title": "Agile Project Management",
        "description": "Assess your knowledge of Agile methodologies, Scrum, and Kanban.",
        "duration": 50,
        "category": "Management",
        "difficulty": "Advanced",
        "questions": [
            {"q": "What is a Sprint?", "opts": ["A set period for work", "Running fast", "A meeting", "Thinking time"], "ans": "A set period for work"},
            {"q": "Who is responsible for the Product Backlog?", "opts": ["Product Owner", "Scrum Master", "Team", "Stakeholder"], "ans": "Product Owner"},
            {"q": "What is a Daily Standup?", "opts": ["Brief status meeting", "Exercise routine", "Code review", "Lunch break"], "ans": "Brief status meeting"},
            {"q": "What does MVP stand for?", "opts": ["Minimum Viable Product", "Most Valuable Player", "Maximum Value Plan", "Mini Video Project"], "ans": "Minimum Viable Product"},
            {"q": "What is Kanban focused on?", "opts": ["Visualizing work", "Strict roles", "Sprints only", "Documentation"], "ans": "Visualizing work"}
        ]
    })

    # Generate more random variations to hit 'tonnes' of exams (simulated)
    # We will replicate these base templates with slight variations
    final_exams = []
    for i in range(10): # Create 50 exams total
        for base in exams_data:
            new_exam = base.copy()
            new_exam["id"] = str(uuid.uuid4())
            new_exam["title"] = f"{base['title']} - Variant {i+1}"
            
            # Add random questions variation
            questions = []
            for q in base["questions"]:
                questions.append({
                    "id": str(uuid.uuid4()),
                    "text": q["q"],
                    "options": q["opts"],
                    "correct": q["ans"],
                    "type": "multiple_choice"
                })
            
            new_exam["questions_data"] = questions
            final_exams.append(new_exam)
            
    return final_exams

@app.post("/debug/seed_exams")
async def seed_exams():
    try:
        exams = generate_mock_exams()
        count = 0
        with sqlite3.connect(DB_FILE) as conn:
            # Optional: Clear existing?
            # conn.execute("DELETE FROM exams")
            # conn.execute("DELETE FROM questions")
            
            for ex in exams:
                conn.execute(
                    "INSERT INTO exams (id, title, description, duration_minutes, category, difficulty) VALUES (?, ?, ?, ?, ?, ?)",
                    (ex["id"], ex["title"], ex["description"], ex["duration"], ex["category"], ex["difficulty"])
                )
                
                for q in ex["questions_data"]:
                    conn.execute(
                        "INSERT INTO questions (id, exam_id, question_text, question_type, options, correct_answer) VALUES (?, ?, ?, ?, ?, ?)",
                        (q["id"], ex["id"], q["text"], q["type"], json.dumps(q["options"]), q["correct"])
                    )
                count += 1
                
        return {"status": "success", "message": f"Seeded {count} exams with questions."}
    except Exception as e:
        return {"error": str(e)}

@app.get("/exams")
async def list_exams(category: str = None):
    with sqlite3.connect(DB_FILE) as conn:
        query = "SELECT id, title, description, duration_minutes, category, difficulty, image_url FROM exams"
        params = []
        if category:
            query += " WHERE category = ?"
            params.append(category)
            
        cursor = conn.execute(query, tuple(params))
        exams = []
        for row in cursor.fetchall():
            exams.append({
                "id": row[0],
                "title": row[1],
                "description": row[2],
                "duration_minutes": row[3],
                "category": row[4],
                "difficulty": row[5],
                "image_url": row[6]
            })
    return exams

@app.get("/exams/{exam_id}")
async def get_exam_details(exam_id: str):
    with sqlite3.connect(DB_FILE) as conn:
        # Get Exam Info
        cursor = conn.execute("SELECT id, title, description, duration_minutes, category, difficulty FROM exams WHERE id = ?", (exam_id,))
        exam_row = cursor.fetchone()
        
        if not exam_row:
            return {"error": "Exam not found"}
            
        exam = {
            "id": exam_row[0],
            "title": exam_row[1],
            "description": exam_row[2],
            "duration_minutes": exam_row[3],
            "category": exam_row[4],
            "difficulty": exam_row[5],
            "questions": []
        }
        
        # Get Questions
        q_cursor = conn.execute("SELECT id, question_text, question_type, options, correct_answer FROM questions WHERE exam_id = ?", (exam_id,))
        for q_row in q_cursor.fetchall():
            exam["questions"].append({
                "id": q_row[0],
                "question_text": q_row[1],
                "question_type": q_row[2],
                "options": json.loads(q_row[3]),
                # In a real app, maybe don't send correct_answer to frontend right away?
                # But for this demo/grading flow, we might need it or hide it.
                # Sending it facilitates client-side check or easier demo.
                # "correct_answer": q_row[4] 
            })
            
    return exam


# --- END LOCAL AUTH ---

from fastapi import BackgroundTasks

# --- Helper for Background Processing ---
async def process_audio_background(temp_filename: str, question: str):
    try:
        # Transcribe with Groq Whisper
        with open(temp_filename, "rb") as file_obj:
            transcription = client.audio.transcriptions.create(
                file=(temp_filename, file_obj.read()),
                model="distil-whisper-large-v3-en",
                response_format="json",
                language="en",
                temperature=0.0
            )
        transcript_text = transcription.text
        
        # Analyze Transcript with Llama 3
        analysis = await audio_graph.ainvoke({
            "transcript": transcript_text,
            "current_question": question
        })
        
        # Log Violation to DB (Simulated or Real)
        if analysis["is_violation"]:
            print(f"AUDIO VIOLATION DETECTED: {analysis['reason']}")
            # In a real app, strict insert into 'proctoring_logs' here
            # with sqlite3.connect(DB_FILE) as conn: ...
            
    except Exception as e:
        print(f"Background Audio Error: {e}")
    finally:
        # Cleanup
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

@app.post("/analyze_audio_file")
async def analyze_audio_file(
    question: str = Form(...),
    file: UploadFile = File(...)
):
    temp_filename = ""
    try:
        # Save Temp File
        temp_filename = f"temp_{uuid.uuid4()}_{file.filename}"
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process Immediately (Blocking) to give feedback
        # Transcribe with Groq Whisper
        with open(temp_filename, "rb") as file_obj:
            transcription = client.audio.transcriptions.create(
                file=(temp_filename, file_obj.read()),
                model="distil-whisper-large-v3-en",
                response_format="json",
                language="en",
                temperature=0.0
            )
        transcript_text = transcription.text
        
        # Analyze Transcript with Llama 3
        analysis = await audio_graph.ainvoke({
            "transcript": transcript_text,
            "current_question": question
        })
        
        return {
            "status": "success", 
            "analysis": analysis,
            "transcript": transcript_text
        }

    except Exception as e:
        print(f"Audio Analysis Error: {e}")
        return {"error": str(e)}
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

@app.post("/analyze_audio_text")
async def analyze_audio_text(request: AudioRequest):
    result = await audio_graph.ainvoke({
        "transcript": request.transcript,
        "current_question": request.current_question
    })
    return result

