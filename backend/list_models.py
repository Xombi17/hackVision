import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq()

print("Fetching available Groq models...")
try:
    models = client.models.list()
    for model in models.data:
        print(f"- {model.id}")
except Exception as e:
    print(f"Error: {e}")
