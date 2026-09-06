# CourseLens AI — API Contract

**Base URL:** `http://localhost:3000/api`

---

## Authorization Header

For all protected routes, supply the JWT token received during login/registration:

```http
Authorization: Bearer <your_jwt_token>
```

---

# Authentication Endpoints

## 1. Register User

- **Endpoint:** `POST /auth/register`
- **Auth Required:** No

### Request Body

```json
{
  "name": "Faculty Name",
  "email": "faculty@aust.edu",
  "password": "password123"
}
```

### Response — `201 Created`

```json
{
  "token": "JWT_TOKEN_STRING",
  "user": {
    "id": 1,
    "name": "Faculty Name",
    "email": "faculty@aust.edu"
  }
}
```

---

## 2. Login User

- **Endpoint:** `POST /auth/login`
- **Auth Required:** No

### Request Body

```json
{
  "email": "faculty@aust.edu",
  "password": "password123"
}
```

### Response — `200 OK`

```json
{
  "token": "JWT_TOKEN_STRING",
  "user": {
    "id": 1,
    "name": "Faculty Name",
    "email": "faculty@aust.edu"
  }
}
```

---

## 3. Get Current User

- **Endpoint:** `GET /auth/me`
- **Auth Required:** Yes

### Response — `200 OK`

```json
{
  "id": 1,
  "name": "Faculty Name",
  "email": "faculty@aust.edu",
  "created_at": "2026-09-06 10:48:00"
}
```

---

# Analysis Endpoints

## 4. Create New Analysis

- **Endpoint:** `POST /analyses`
- **Auth Required:** Yes

### Request Body

```json
{
  "course_title": "Algorithms",
  "course_code": "CSE 2201",
  "department": "CSE",
  "exam_type": "Final",
  "semester": "Fall 2026",
  "exam_date": "2026-09-10",
  "total_marks": 50,
  "syllabus_text": "CLO1: Analyze time complexity of DP...\nCLO2: Graph algorithms...",
  "question_paper_text": "Q1: Explain knapsack... (10 marks)",
  "previous_papers_text": "2025 Fall Q1: Write BFS algorithm."
}
```

### Response — `202 Accepted`

```json
{
  "id": 1,
  "status": "processing",
  "message": "Analysis request submitted successfully."
}
```

---

## 5. Get User Analyses List

- **Endpoint:** `GET /analyses`
- **Auth Required:** Yes

### Response — `200 OK`

```json
[
  {
    "id": 1,
    "course_title": "Algorithms",
    "course_code": "CSE 2201",
    "department": "CSE",
    "exam_type": "Final",
    "semester": "Fall 2026",
    "status": "completed",
    "overall_score": 85,
    "created_at": "2026-09-06 10:50:00"
  }
]
```

---

## 6. Get Analysis Details

- **Endpoint:** `GET /analyses/:id`
- **Auth Required:** Yes

### Response — `200 OK`

```json
{
  "id": 1,
  "user_id": 1,
  "course_title": "Algorithms",
  "course_code": "CSE 2201",
  "department": "CSE",
  "exam_type": "Final",
  "semester": "Fall 2026",
  "exam_date": "2026-09-10",
  "total_marks": 50,
  "syllabus_text": "...",
  "question_paper_text": "...",
  "previous_papers_text": "...",
  "status": "completed",
  "overall_score": 85,
  "error_message": null,
  "result_json": {
    "overall_score": 85,
    "summary": "High alignment with CLO targets.",
    "coverage_percentage": 80,
    "clo_coverage": [
      {
        "clo": "CLO1",
        "covered": true,
        "question_numbers": ["Q1"]
      }
    ],
    "topic_coverage": [
      {
        "topic": "Dynamic Programming",
        "covered": true
      }
    ],
    "bloom_distribution": {
      "remember": 20,
      "understand": 30,
      "apply": 30,
      "analyze": 10,
      "evaluate": 10,
      "create": 0
    },
    "difficulty_distribution": {
      "easy": 30,
      "medium": 50,
      "hard": 20
    },
    "duplicate_questions": [
      {
        "current_question": "Q2",
        "matched_previous_question": "2025 Fall Q1",
        "similarity_score": 85,
        "recommendation": "Modify parameters"
      }
    ],
    "detected_issues": [
      {
        "related_question": "Q3",
        "issue_type": "Mark Mismatch",
        "severity": "high",
        "evidence": "Header mark total mismatch",
        "recommendation": "Adjust Q3 marks to equal 10"
      }
    ],
    "recommendations": [
      "Increase higher-order application questions"
    ]
  },
  "created_at": "2026-09-06 10:50:00",
  "updated_at": "2026-09-06 10:50:08"
}
```

---

## 7. Delete Analysis

- **Endpoint:** `DELETE /analyses/:id`
- **Auth Required:** Yes

### Response — `200 OK`

```json
{
  "message": "Analysis deleted successfully."
}
```

---

# Step 7 — Sync: Push Backend Changes to Remote

Now push all your working backend code and documentation to `origin/ahnaf-backend` so it is safely backed up.

Run these commands in **PowerShell**:

```powershell
git status --short
git add .
git commit -m "feat(backend): complete sqlite db, auth endpoints, AI assessment agent, and api contract"
git push origin ahnaf-backend
```


### 8. Extract Text from PDF/TXT Document

* **Endpoint:** `POST /api/documents/extract`
* **Auth Required:** Yes
* **Content-Type:** `multipart/form-data`
* **Body Field:** `file`
* **Accepted File Types:** PDF or TXT
* **Maximum File Size:** 5 MB

**Response — `200 OK`:**

```json
{
  "file_name": "syllabus.pdf",
  "text": "Extracted document plain text content...",
  "page_count": 3
}
```

**Error Response — `400 Bad Request`:**

```json
{
  "error": "Readable text could not be extracted from this document. OCR is currently unsupported."
}
```

---

### 9. Update Profile Name

* **Endpoint:** `PUT /api/auth/me`
* **Auth Required:** Yes
* **Content-Type:** `application/json`

**Request Body:**

```json
{
  "name": "Updated Faculty Name"
}
```

**Response — `200 OK`:**

```json
{
  "id": 1,
  "name": "Updated Faculty Name",
  "email": "faculty@aust.edu"
}
```

---

### 10. Retry Failed Analysis

* **Endpoint:** `POST /api/analyses/:id/retry`
* **Auth Required:** Yes

**Response — `200 OK`:**

```json
{
  "id": 1,
  "status": "processing",
  "message": "Analysis re-triggered successfully."
}
```

---

## Step 2: Install Backend Dependencies for PDF & File Uploads

From the `backend` directory in PowerShell, install `multer` and `pdf-parse`:

```powershell
npm install multer pdf-parse
```
