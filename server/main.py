from fastapi import FastAPI, UploadFile, File, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from openai import OpenAI
from pdf2image import convert_from_bytes
from io import BytesIO
from base64 import b64encode
from typing import Optional
import firebase_admin
from firebase_admin import credentials, auth as admin_auth
import os
import json


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3002",
        "https://ai-examiner-ten.vercel.app",
        "https://ai-examiner-ten.vercel.app/",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


firebase_config = json.loads(os.environ["FIREBASE_CONFIG_JSON"])
cred = credentials.Certificate(firebase_config)
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

users_usage = {}

@app.get("/")
def health():
    return {"status": "ok"}

@app.middleware("http")
async def verify_firebase_token(request: Request, call_next):
    auth_header = request.headers.get("Authorization")
    
    if not auth_header:
        # No token? Proceed anyway (for unauthenticated users using free credits)
        return await call_next(request)

    if not auth_header.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"detail": "Invalid token format"})

    id_token = auth_header.split("Bearer ")[-1]
    try:
        decoded_token = admin_auth.verify_id_token(id_token)
        request.state.user = decoded_token
    except Exception as e:
        return JSONResponse(status_code=401, content={"detail": "Invalid token"})

    return await call_next(request)



def image_to_base64(img):
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    return b64encode(buffered.getvalue()).decode("utf-8")

def pdf_to_base64_images(pdf_bytes: bytes):
    images = convert_from_bytes(pdf_bytes)
    return [image_to_base64(img) for img in images]

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

def mark_with_vision(student_images: list[str], scheme_images: list[str]) -> str:
    results = []

    scheme_blocks = [
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
- Multiple pages from a student's handwritten exam paper
- Multiple pages from the official mark scheme

Your task:
1. Extract each exam question number
2. Extract the student answer
3. Match it with the correct part of the mark scheme
4. Mark strictly using only allowed points
5. Return each result in the format:

---

Question Number: [e.g. 1.2 or 2(b)(ii)]  
Question: [copied from student paper]  
Max Marks: [e.g. 3]  
Student Answer: [copied from paper]  
Mark: X/Y  
Comment: [examiner-style feedback]

---
Total Marks: X/Y
"""
                        },
                        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{student_img}"}},
                        *scheme_blocks
                    ]
                }
            ],
            max_tokens=1000
        )

        results.append(response.choices[0].message.content.strip())

    return "\n\n".join(results)

@app.post("/mark")
async def mark_paper(request: Request, student: UploadFile = File(...), scheme: UploadFile = File(...)):
    uid = request.state.user

    users_usage[uid] = users_usage.get(uid, 0) + 1
    if users_usage[uid] > 10:
        raise HTTPException(status_code=429, detail="Monthly limit reached")

    student_bytes = await student.read()
    scheme_bytes = await scheme.read()

    student_images = pdf_to_base64_images(student_bytes)
    scheme_images = pdf_to_base64_images(scheme_bytes)

    raw_result = mark_with_vision(student_images, scheme_images)
    parsed = parse_marking_output(raw_result)
    parsed["credits_used"] = users_usage[uid]

    return parsed
