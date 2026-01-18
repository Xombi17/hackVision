import os
from typing import TypedDict, List
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

if not os.environ.get("GROQ_API_KEY"):
    pass

# Define State
class IntegrityState(TypedDict):
    alerts: List[dict] # serialized JSON of alerts
    verdict: str
    risk_level: str
    explanation: str

# Define Output
class IntegrityOutput(BaseModel):
    risk_level: str = Field(..., description="LOW, MEDIUM, or HIGH")
    verdict: str = Field(..., description="Short verdict like 'Possible Cheating' or 'Clean'")
    explanation: str = Field(..., description="Brief explanation of the analysis")

# Initialize LLM - Using 8B Instant for speed
llm_fast = ChatGroq(model_name="llama-3.1-8b-instant", temperature=0)

def analyze_node(state: IntegrityState):
    parser = JsonOutputParser(pydantic_object=IntegrityOutput)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert exam proctor AI. Analyze the following proctoring logs (alerts) to determine if academic dishonesty occurred. Be strict but fair."),
        ("user", """
        Alert Logs: {alerts}
        
        Analyze the frequency, type, and timing of these alerts.
        - Occasional gaze shifts are normal (LOW risk).
        - Frequent gaze shifts or multiple faces are suspicious (MEDIUM/HIGH risk).
        - 'PHONE_DETECTED' is always HIGH risk.
        
        Provide a JSON analysis.
        {format_instructions}
        """)
    ])
    
    chain = prompt | llm_fast | parser
    
    try:
        # If no alerts, return clean
        if not state["alerts"]:
            return {
                "risk_level": "LOW",
                "verdict": "Clean Record",
                "explanation": "No anomalies or violations detected during the session."
            }

        result = chain.invoke({
            "alerts": str(state["alerts"]),
            "format_instructions": parser.get_format_instructions()
        })
        
        return {
            "risk_level": result["risk_level"],
            "verdict": result["verdict"],
            "explanation": result["explanation"]
        }
    except Exception as e:
        return {
            "risk_level": "UNKNOWN",
            "verdict": "Error",
            "explanation": "Failed to analyze logs."
        }

# Build Graph
workflow = StateGraph(IntegrityState)
workflow.add_node("analyst", analyze_node)
workflow.set_entry_point("analyst")
workflow.add_edge("analyst", END)

integrity_graph = workflow.compile()
