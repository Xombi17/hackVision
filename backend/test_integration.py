
import asyncio
import os
import sys
from dotenv import load_dotenv

# Load env vars before importing agents that might use them
load_dotenv()

# Ensure backend dir is in path
sys.path.append(os.path.join(os.path.dirname(__file__)))

from grading_agent import grade_answer_graph
from integrity_agent import integrity_graph

async def test_grading():
    print("\n[TEST] Testing Grading Agent (Llama 3 70B)...")
    try:
        result = await grade_answer_graph.ainvoke({
            "question": "Explain the concept of 'Agentic AI'.",
            "rubric": "1. Definition (10pts) 2. Autonomy vs Automation (10pts) 3. Examples (5pts)",
            "student_answer": "Agentic AI refers to AI systems that can autonomously pursue complex goals using tools and reasoning. Unlike simple automation which follows a script, agents can plan and adapt. For example, a travel agent AI can book flights and handle cancellations on its own."
        })
        print(f"✅ Success! Score: {result['score']}/25")
        print(f"   Feedback: {result['feedback'][:100]}...")
        print(f"   Confidence: {result['confidence_score']}")
    except Exception as e:
        print(f"❌ Failed: {e}")

async def test_integrity():
    print("\n[TEST] Testing Integrity Agent (Llama 3 8B)...")
    try:
        mock_alerts = [
            {"type": "LOOKING_AWAY", "timestamp": 1000},
            {"type": "LOOKING_AWAY", "timestamp": 1200},
            {"type": "PHONE_DETECTED", "timestamp": 1500}
        ]
        
        result = await integrity_graph.ainvoke({
            "alerts": mock_alerts
        })
        print(f"✅ Success! Verdict: {result['verdict']}")
        print(f"   Risk: {result['risk_level']}")
        print(f"   Explanation: {result['explanation'][:100]}...")
    except Exception as e:
        print(f"❌ Failed: {e}")

async def main():
    if not os.environ.get("GROQ_API_KEY"):
        print("⚠️  SKIPPING: GROQ_API_KEY not set in environment.")
        return

    await test_grading()
    await test_integrity()

if __name__ == "__main__":
    asyncio.run(main())
