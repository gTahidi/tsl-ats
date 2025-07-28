---
title: Uploading CVs
 description: Adding résumés to the system and how they’re processed
---

# Uploading CVs

## Supported Formats
- PDF (preferred)
- DOC / DOCX
- TXT (plain text)

Maximum file size: **5 MB**.

## Upload Steps
1. Open a **Persona** or **Candidate** record.
2. Click **Upload CV** and choose a file.
3. The system stores the file in cloud storage and creates:
   - a `cvs` record with metadata (filename, size, mime type).
   - multiple `cv_chunks` rows containing text snippets + vector embeddings for semantic search.
4. Once processing completes (~10 seconds), the CV preview appears in the profile.

## Replacing a CV
Uploading a new file automatically archives the old one; only the latest CV is used for search/grading.

## How Embeddings Work (Plain English)
The system breaks the document into paragraphs (chunks) and converts each chunk into a numerical vector that captures meaning. This lets you search for concepts like *"Python backend"* even if those exact words aren’t present.
