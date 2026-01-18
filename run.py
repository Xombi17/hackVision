import uvicorn
import os
import sys

# Wrapper to start the FastAPI backend from the root directory
if __name__ == "__main__":
    # Ensure backend directory is in the Python path
    cwd = os.getcwd()
    sys.path.append(os.path.join(cwd, "backend"))
    
    print(f"🚀 Starting AegisExam Backend from {cwd}...")
    print("📍 URL: http://localhost:8000")
    print("---------------------------------------------")
    
    # Run Uvicorn
    # 'backend.main:app' assumes the folder is 'backend' and file is 'main.py'
    try:
        uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user.")
