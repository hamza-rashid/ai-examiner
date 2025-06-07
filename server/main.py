from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pdf2image import convert_from_bytes
from io import BytesIO
from base64 import b64encode
import os

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# Convert PDF to list of base64 images
def image_to_base64(img):
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    return b64encode(buffered.getvalue()).decode("utf-8")

def pdf_to_base64_images(pdf_bytes: bytes):
    images = convert_from_bytes(pdf_bytes)
    return [image_to_base64(img) for img in images]

# Parse OpenAI raw response into structured JSON
def parse_marking_output(raw: str):
    blocks = [b.strip() for b in raw.split("---") if b.strip()]
    questions = []
    total = ""

    for block in blocks:
        if block.lower().startswith("total marks"):
            total = block.replace("Total Marks:", "").strip()
            continue

        q = {
            "questionNumber": "",
            "question": "",
            "maxMarks": "",
            "studentAnswer": "",
            "mark": "",
            "comment": ""
        }

        lines = block.split("\n")
        current_key = None

        for line in lines:
            if line.startswith("Question Number:"):
                q["questionNumber"] = line.replace("Question Number:", "").strip()
            elif line.startswith("Question:"):
                q["question"] = line.replace("Question:", "").strip()
            elif line.startswith("Max Marks:"):
                q["maxMarks"] = line.replace("Max Marks:", "").strip()
            elif line.startswith("Student Answer:"):
                current_key = "studentAnswer"
                q["studentAnswer"] = ""
            elif line.startswith("Mark:"):
                q["mark"] = line.replace("Mark:", "").strip()
                current_key = None
            elif line.startswith("Comment:"):
                current_key = "comment"
                q["comment"] = line.replace("Comment:", "").strip()
            elif current_key:
                q[current_key] += " " + line.strip()

        questions.append(q)

    return {"questions": questions, "total": total}

# Call OpenAI with vision and your prompt
def mark_with_vision(student_images: list[str], scheme_images: list[str]) -> str:
    results = []

    scheme_image_blocks = [
        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img}"}}
        for img in scheme_images
    ]

    for i, student_img in enumerate(student_images):
        print(f"Processing student page {i+1}...")
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """You are a professional GCSE Science examiner.

You will be shown:
- Multiple pages from a student's handwritten exam paper (with several questions and answers, possibly across multiple pages)
- Multiple pages from the official mark scheme

Your task:
1. Identify and extract **each exam question number** — including sub-questions (e.g., 1.1, 1.2, 2(a), 2(b)(ii), etc.)
2. For each, extract the associated **student answer**
3. Match it with the correct part of the mark scheme — even if it's located on another page
4. Mark each answer **strictly** using the mark scheme. Award only marks that are explicitly allowed
5. For each question, return the result using this structure:

---

Question Number: [e.g. 1.2 or 2(b)(ii)]  
Question: [copy from the student paper]  
Max Marks: [e.g. 3]  
Student Answer: [copy student's response]  
Mark: X/Y  
Comment: [brief examiner-style feedback, what was awarded, what was missing]

---
Only include results. Do not explain your method or repeat the instructions. 
Repeat for every identifiable question in the uploaded student paper.

At the end, include:
Total Marks: X/Y
"""
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/png;base64,{student_img}"}
                        },
                        *scheme_image_blocks
                    ]
                }
            ],
            max_tokens=1000
        )

        results.append(response.choices[0].message.content.strip())

    return "\n\n".join(results)

# API endpoint
@app.post("/mark")
async def mark_paper(student: UploadFile = File(...), scheme: UploadFile = File(...)):
    student_bytes = await student.read()
    scheme_bytes = await scheme.read()

    student_images = pdf_to_base64_images(student_bytes)
    scheme_images = pdf_to_base64_images(scheme_bytes)

    raw_result = mark_with_vision(student_images, scheme_images)
    parsed = parse_marking_output(raw_result)

    return parsed
