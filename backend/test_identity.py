
import asyncio
import os
import base64
from dotenv import load_dotenv
import sys

# Ensure backend dir is in path
sys.path.append(os.path.join(os.path.dirname(__file__)))

from identity_agent import identity_graph

load_dotenv()

async def test_identity_match():
    print("\n[TEST] Testing Identity Agent (Llama 3.2 Vision)...")
    
    # NOTE: You need actual image files for this to work perfectly.
    # For now, we will assume two dummy files exist or fail gracefully.
    # To test properly, place 'id_card.jpg' and 'selfie.jpg' in the backend folder.
    
    id_path = "id_card.jpg"
    selfie_path = "selfie.jpg"
    
    if not os.path.exists(id_path) or not os.path.exists(selfie_path):
        print(f"⚠️  Skipping test: Missing {id_path} or {selfie_path}")
        print("    Place two images of the same person in 'backend/' to test.")
        return

    with open(id_path, "rb") as f:
        id_b64 = base64.b64encode(f.read()).decode('utf-8')
    
    with open(selfie_path, "rb") as f:
        selfie_b64 = base64.b64encode(f.read()).decode('utf-8')

    try:
        result = await identity_graph.ainvoke({
            "id_card_image_base64": id_b64,
            "webcam_image_base64": selfie_b64
        })
        
        print(f"Match: {result['is_match']}")
        print(f"Confidence: {result['confidence']}")
        print(f"Reason: {result['reason']}")
        
    except Exception as e:
        print(f"❌ Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_identity_match())
