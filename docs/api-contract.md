# CourseLens AI API Contract

Base URL: `http://localhost:3000/api`

JSON endpoints use `Content-Type: application/json`. Protected endpoints require:

```http
Authorization: Bearer <jwt_token>
```

Error responses use this shape:

```json
{ "error": "Human-readable error message." }
```

## Health

### `GET /health`

Authentication: not required.

Response `200 OK`:

```json
{
  "status": "ok",
  "timestamp": "2026-09-06T10:50:00.000Z"
}
```

## Authentication

### `POST /auth/register`

Authentication: not required.

Request:

```json
{
  "name": "Faculty Name",
  "email": "faculty@aust.edu",
  "password": "password123"
}
```

Response `201 Created`:

```json
{
  "token": "JWT_TOKEN",
  "user": {
    "id": 1,
    "name": "Faculty Name",
    "email": "faculty@aust.edu"
  }
}
```

Errors: `400` for missing fields or an existing email.

### `POST /auth/login`

Authentication: not required.

Request:

```json
{
  "email": "faculty@aust.edu",
  "password": "password123"
}
```

Response `200 OK`:

```json
{
  "token": "JWT_TOKEN",
  "user": {
    "id": 1,
    "name": "Faculty Name",
    "email": "faculty@aust.edu"
  }
}
```

Errors: `400` for missing or invalid credentials.

### `GET /auth/me`

Authentication: required.

Response `200 OK`:

```json
{
  "id": 1,
  "name": "Faculty Name",
  "email": "faculty@aust.edu",
  "created_at": "2026-09-06 10:48:00"
}
```

### `PUT /auth/me`

Authentication: required.

Request:

```json
{ "name": "Updated Faculty Name" }
```

The trimmed name must contain 2-100 characters.

Response `200 OK`:

```json
{
  "id": 1,
  "name": "Updated Faculty Name",
  "email": "faculty@aust.edu",
  "created_at": "2026-09-06 10:48:00"
}
```

Errors: `400` for an invalid name and `404` if the user no longer exists.

## Document extraction

### `POST /documents/extract`

Authentication: required.

Content type: `multipart/form-data` with one field named `file`.

- Accepted formats: text-based PDF and UTF-8 TXT.
- Maximum upload size: 5 MB.
- Maximum extracted text: 250,000 characters.
- Files are processed in memory and are not stored by the server.
- Image-only/scanned PDF OCR is not supported.

Response `200 OK`:

```json
{
  "file_name": "syllabus.pdf",
  "text": "Extracted plain-text content...",
  "page_count": 3
}
```

Errors:

- `400`: missing file, unsupported type, invalid PDF, binary TXT, unreadable or password-protected document.
- `401`: missing or invalid JWT.
- `413`: file exceeds 5 MB or extracted text exceeds 250,000 characters.

The frontend should call this endpoint when a document is selected, store the returned `text`, and then submit the normal JSON analysis request below.

## Analyses

All analysis endpoints require authentication and only access records owned by the authenticated user.

### `POST /analyses`

Request:

```json
{
  "course_title": "Algorithms",
  "course_code": "CSE 3101",
  "department": "CSE",
  "exam_type": "Final examination",
  "semester": "Fall 2026",
  "exam_date": "2026-09-10",
  "total_marks": 50,
  "syllabus_text": "CLO1: Analyze time complexity...",
  "question_paper_text": "Q1: Analyze merge sort. [10]",
  "previous_papers_text": "2025 Fall Q1: Analyze merge sort."
}
```

`department`, `exam_type`, `semester`, `exam_date`, and `previous_papers_text` may be empty. The other fields are required.

Response `202 Accepted`:

```json
{
  "id": 1,
  "status": "processing",
  "message": "Analysis request submitted successfully."
}
```

The AI job continues asynchronously. Poll `GET /analyses/:id` until `status` becomes `completed` or `failed`.

### `GET /analyses`

Response `200 OK`:

```json
[
  {
    "id": 1,
    "course_title": "Algorithms",
    "course_code": "CSE 3101",
    "department": "CSE",
    "exam_type": "Final examination",
    "semester": "Fall 2026",
    "status": "completed",
    "overall_score": 85,
    "created_at": "2026-09-06 10:50:00"
  }
]
```

### `GET /analyses/:id`

Response `200 OK` includes the stored course inputs and a parsed `result_json` object when completed:

```json
{
  "id": 1,
  "user_id": 1,
  "course_title": "Algorithms",
  "course_code": "CSE 3101",
  "total_marks": 50,
  "syllabus_text": "...",
  "question_paper_text": "...",
  "previous_papers_text": "...",
  "status": "completed",
  "overall_score": 85,
  "error_message": null,
  "result_json": {
    "overall_score": 85,
    "summary": "High alignment with the course outcomes.",
    "coverage_percentage": 80,
    "clo_coverage": [],
    "topic_coverage": [],
    "bloom_distribution": {},
    "difficulty_distribution": {},
    "duplicate_questions": [],
    "detected_issues": [],
    "recommendations": []
  },
  "created_at": "2026-09-06 10:50:00",
  "updated_at": "2026-09-06 10:50:08"
}
```

Errors: `400` for an invalid ID and `404` for a missing or unauthorized record.

### `POST /analyses/:id/retry`

Reuses the stored inputs and starts the AI job again. The old score, result, and error are cleared before processing begins.

Response `202 Accepted`:

```json
{
  "id": 1,
  "status": "processing",
  "message": "Analysis re-triggered successfully."
}
```

Errors:

- `400`: invalid analysis ID.
- `404`: missing or unauthorized analysis.
- `409`: the analysis is already processing; a duplicate AI job is not started.

### `DELETE /analyses/:id`

Response `200 OK`:

```json
{ "message": "Analysis deleted successfully." }
```

Errors: `400` for an invalid analysis ID and `404` for a missing or unauthorized analysis.

## Request-size behavior

JSON request bodies are limited to 1 MB. Oversized JSON requests return:

```http
413 Payload Too Large
```

```json
{ "error": "Request body exceeds the 1 MB limit." }
```
