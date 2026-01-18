import os
from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

# Ensure API Key is set (User must provide it in .env or run with it)
if not os.environ.get("GROQ_API_KEY"):
    pass # Should be handled by environment

# Define State
class GradingState(TypedDict):
    question: str
    student_answer: str
    rubric: str
    score: int
    feedback: str
    confidence_score: float

# Define Output Structure
class GradeOutput(BaseModel):
    score: int = Field(..., description="Score out of 100")
    feedback: str = Field(..., description="Constructive feedback for the student")
    confidence: float = Field(..., description="Confidence in the grading (0-1)")

# Initialize LLM
# Utilizing Llama 3 70B via Groq for extreme speed and free tier
# Utilizing Llama 3.3 70B via Groq (Versatile) for best performance
llm = ChatGroq(model_name="llama-3.3-70b-versatile", temperature=0)


# Define Node
def grade_node(state: GradingState):
    parser = JsonOutputParser(pydantic_object=GradeOutput)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert academic grader. Grade the answer based STRICTLY on the rubric provided. Be fair and objective."),
        ("user", """
        Question: {question}
        Rubric: {rubric}
        
        Student Answer: {student_answer}
        
        Evaluate the answer. Return a JSON object with 'score', 'feedback', and 'confidence'.
        {format_instructions}
        """)
    ])
    
    chain = prompt | llm | parser
    
    try:
        result = chain.invoke({
            "question": state["question"],
            "rubric": state["rubric"],
            "student_answer": state["student_answer"],
            "format_instructions": parser.get_format_instructions()
        })
        
        return {
            "score": result["score"],
            "feedback": result["feedback"],
            "confidence_score": result["confidence"]
        }
    except Exception as e:
        return {
            "score": 0,
            "feedback": f"Error grading answer: {str(e)}",
            "confidence_score": 0.0
        }

# Build Graph
workflow = StateGraph(GradingState)
workflow.add_node("grader", grade_node)
workflow.set_entry_point("grader")
workflow.add_edge("grader", END)

grade_answer_graph = workflow.compile()
