import os
import base64
from typing import TypedDict
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from pydantic import BaseModel, Field
from langchain_core.output_parsers import JsonOutputParser

if not os.environ.get("GROQ_API_KEY"):
    pass

# Define State
class IdentityState(TypedDict):
    id_card_image_base64: str
    webcam_image_base64: str
    is_match: bool
    confidence: float
    reason: str

# Define Output
class IdentityOutput(BaseModel):
    is_match: bool = Field(..., description="True if the faces belong to the same person")
    confidence: float = Field(..., description="Confidence score 0.0 to 1.0")
    reason: str = Field(..., description="Explanation of visual similarities/differences")

# Initialize Vision Logic
# using Llama 4 Maverick (Multimodal) as Vision Models are deprecated
llm_vision = ChatGroq(model_name="meta-llama/llama-4-maverick-17b-128e-instruct", temperature=0)

def verify_identity_node(state: IdentityState):
    parser = JsonOutputParser(pydantic_object=IdentityOutput)
    
    # Construct Multimodal Prompt
    message = HumanMessage(
        content=[
            {"type": "text", "text": "You are a biometric security officer. Compare these two images. Image 1 is an ID Card. Image 2 is a Selfie. Do they show the same person? Focus on facial structure, nose shape, and eyes. Ignore hair style, hair length, age differences, or glasses. Return JSON with 'is_match', 'confidence', and 'reason'."},
            {
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{state['id_card_image_base64']}"},
            },
            {
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{state['webcam_image_base64']}"},
            },
            {"type": "text", "text": parser.get_format_instructions()} 
        ]
    )
    
    try:
        response = llm_vision.invoke([message])
        # Parse the response (Using text parsing since vision model output might be raw)
        # Usually invoke returns an AIMessage with content
        parsed = parser.parse(response.content)
        
        return {
            "is_match": parsed["is_match"],
            "confidence": parsed["confidence"],
            "reason": parsed["reason"]
        }
    except Exception as e:
        return {
            "is_match": False,
            "confidence": 0.0,
            "reason": f"Error interacting with Vision Model: {str(e)}"
        }

# Build Graph
workflow = StateGraph(IdentityState)
workflow.add_node("verifier", verify_identity_node)
workflow.set_entry_point("verifier")
workflow.add_edge("verifier", END)

identity_graph = workflow.compile()
