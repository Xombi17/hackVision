
import asyncio
import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from langchain_core.output_parsers import JsonOutputParser

load_dotenv()

# We use the smart model (70B) for better semantic instruction following
llm = ChatGroq(model_name="llama-3.3-70b-versatile", temperature=0)

class AudioVerdict(BaseModel):
    is_violation: bool = Field(..., description="True if this is cheating, False if just reading aloud/thinking")
    reason: str = Field(..., description="Explanation of the verdict, citing specific words")

async def analyze_voice(transcript: str, current_question: str):
    parser = JsonOutputParser(pydantic_object=AudioVerdict)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a strict exam proctor AI. Analyze the audio transcript for academic dishonesty."),
        ("user", """
        Current Question Text: "{question}"
        
        Audio Transcript: "{transcript}"
        
        Task: Determine if the candidate is cheating.
        
        RULES:
        1. SAFE: Reading the question text allowed (even if partial).
        2. SAFE: Thinking out loud (e.g., "Hmm", "Let me think", "Maybe it's...").
        3. VIOLATION: Asking an external source (e.g., "Hey Google", "Siri", "What is the answer?").
        4. VIOLATION: Speaking to another person (e.g., "Can you help?", "Is it A or B?").
        
        CRITICAL: If the transcript contains "Hey Google", "Alexa", or asks a question NOT in the text, it is a VIOLATION.
        
        Return JSON.
        {format_instructions}
        """)
    ])
    
    chain = prompt | llm | parser
    
    print(f"\n🎧 Input: '{transcript}'")
    try:
        result = await chain.ainvoke({
            "question": current_question,
            "transcript": transcript,
            "format_instructions": parser.get_format_instructions()
        })
        status = "🔴 VIOLATION" if result['is_violation'] else "🟢 SAFE"
        print(f"   Verdict: {status}")
        print(f"   Reason:  {result['reason']}")
    except Exception as e:
        print(f"   Error: {e}")


# MOCKING WHISPER (Since we can't upload audio files from this script easily without a real file)
# In production, this function would call Groq's Whisper endpoint.
async def transcribe_audio(audio_file_path: str):
    print(f"\n🎤 Transcribing '{audio_file_path}' using distil-whisper-large-v3-en...")
    # client.audio.transcriptions.create(model="distil-whisper-large-v3-en", ...)
    
    # Mock return based on filename for demo
    if "reading" in audio_file_path:
        return "Analyze the impact of Generative AI on... uh... traditional systems."
    elif "thinking" in audio_file_path:
        return "Hmm, impact of AI... okay, maybe it's about personalized learning."
    elif "cheating_friend" in audio_file_path:
        return "Hey, what's the answer to this? Is it positive or negative?"
    elif "cheating_google" in audio_file_path:
        return "Hey Google, tell me about AI in education."
    return ""

async def main():
    if not os.environ.get("GROQ_API_KEY"):
        print("Please set GROQ_API_KEY in .env")
        return

    question = "Analyze the impact of Generative AI on traditional education systems."

    # Pipeline: Audio File -> Whisper (Groq) -> Transcript -> Llama 3 (Groq) -> Verdict
    
    # Win 1: Whisper is 10x faster on Groq than standard APIs
    # Win 2: Llama 3 analysis happens in milliseconds
    
    scenarios = ["reading.wav", "thinking.wav", "cheating_friend.wav", "cheating_google.wav"]
    
    for audio_file in scenarios:
        transcript = await transcribe_audio(audio_file)
        await analyze_voice(transcript, question)

if __name__ == "__main__":
    asyncio.run(main())

