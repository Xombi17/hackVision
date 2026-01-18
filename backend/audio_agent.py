import os
from typing import TypedDict
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

if not os.environ.get("GROQ_API_KEY"):
    pass

# Define State
class AudioState(TypedDict):
    transcript: str
    current_question: str
    is_violation: bool
    reason: str

# Define Output
class AudioVerdict(BaseModel):
    is_violation: bool = Field(..., description="True if this is cheating, False if just reading aloud/thinking")
    reason: str = Field(..., description="Explanation of the verdict, citing specific words")

# Initialize LLM - Using 70B for high-fidelity semantic understanding
# We need to distinguish between "Reading question" vs "Reading to a friend"
llm = ChatGroq(model_name="llama-3.3-70b-versatile", temperature=0)

def analyze_audio_node(state: AudioState):
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
    
    try:
        result = chain.invoke({
            "question": state["current_question"],
            "transcript": state["transcript"],
            "format_instructions": parser.get_format_instructions()
        })
        
        return {
            "is_violation": result["is_violation"],
            "reason": result["reason"]
        }
    except Exception as e:
        return {
            "is_violation": False,
            "reason": f"Error analyzing audio: {str(e)}"
        }

# Build Graph
workflow = StateGraph(AudioState)
workflow.add_node("auditor", analyze_audio_node)
workflow.set_entry_point("auditor")
workflow.add_edge("auditor", END)

audio_graph = workflow.compile()
