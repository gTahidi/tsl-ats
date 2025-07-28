---
title: Jobs
 description: Managing job postings within the ATS
---

import Hint from "../components/Hint.mdx"; // optional helper component placeholder

# Jobs

## What Is a Job Posting?
A **Job Posting** represents an open role your firm is recruiting for. Each posting is stored in the system’s `job_postings` table and can be linked to multiple candidates.

Key fields you’ll see on-screen:
- **Title** – the role name that appears to candidates
- **Description** – a short overview of the role and responsibilities
- **Status** – Open (default), On-Hold, or Closed
- **Process Group** – the interview pipeline template that will be applied to every candidate

## Creating a Job
1. Go to **Jobs → New Job**.
2. Fill in the required fields (*Title*, *Process Group*).  
   – The **Process Group** determines the interview steps (phone screen, technical, etc.).
3. Optional: add a detailed description or a public LinkedIn URL.
4. Click **Create Job** – the posting is now live and ready to receive candidates.

## Editing or Closing a Job
- To update details, open the job and click **Edit**.  
- To stop new applications, change **Status** to *Closed*.

<Hint>Closing a job does not delete any linked candidates. You can reopen it later by switching the status back to *Open*.</Hint>

## Viewing Candidates per Job
Inside a job posting, the **Candidates** tab lists everyone associated with that job along with their current interview step and rating.

## Next Steps
• Add personas/candidates to this job (see *Personas*).  
• Configure interview automation rules (see placeholder module *Automation*).
