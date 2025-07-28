---
title: Processes
 description: Designing and tracking interview pipelines
---

# Processes

This module explains how to design interview pipelines (process groups), set up individual stages (step templates), and move candidates through each step.

---
## 1. Key Concepts

| Term | What it is | Where it lives |
|------|------------|----------------|
| **Process Group** | A reusable pipeline template (e.g., *Engineering Hiring*) | `process_groups` table |
| **Step Template** | A single stage in a group (e.g., *Phone Screen*) | `process_step_templates` table |
| **Process Step** | The real-world instance of a template for a specific candidate | `process_steps` table |

---
## 2. Creating a Process Group
1. Go to **Settings → Process Groups → New Group**.
2. Enter a *Name* (e.g., **Sales Hiring**).
3. Click **Create** – you’ll land on the group detail page.

### Adding Step Templates
1. Click **Add Step**.
2. Fill in:
   - **Order** – sequence number (1, 2, 3…)
   - **Name** – stage title (*HR Screen*, *Technical Interview*, …)
3. Click **Save**. Repeat until all stages are defined.

> **Tip — Re-order anytime**: Edit the **Order** field on a step to change its position.

---
## 3. Applying a Process to a Job Posting
When you create or edit a job, pick the desired **Process Group**. All new candidates linked to the job will automatically get a fresh set of *Process Steps* based on that template.

---
## 4. Working a Candidate Through the Pipeline
1. Open a candidate → **Process** tab.
2. For each step you can:
   - **Status** – set *Pending*, *Completed*, *Skipped* or *Failed*.
   - **Date** – when the interview happened.
   - **Rating** – numeric or text.
   - **Notes** – interviewer comments.
3. Click **Save**. The system timestamps every change.

### Bulk Updates
From the **Candidates** list, select multiple candidates → **Bulk Action → Update Step** to mark stages together (useful after assessment days).

---
## 5. Candidate Grading & Dashboards
• Step ratings roll up to the candidate’s overall **Rating** field.  
• The **Pipeline Overview** dashboard visualises how many candidates are at each stage and their average scores.  
• See the separate *Candidate Grading* guide for colour codes and tips.

---
## 6. Editing or Deleting Steps Safely
- **Editing** a step template in a group updates *future* candidates; existing steps are unchanged.
- **Deleting** a template is blocked if any active candidates still have that step. Mark them *Skipped* first, then delete.

---
## 7. Automation Hooks *(optional)*
Automation rules (see *Automation* module) can trigger when:
- A step status changes (*e.g.*, send rejection email on **Failed**).
- A candidate sits in a step longer than _X_ days.

---
## 8. FAQ
**Q: Can I have different pipelines per department?**  
A: Yes, create a separate Process Group for each department and assign accordingly.

**Q: What if my pipeline changes mid-search?**  
A: Edit the Process Group; existing candidates keep their current steps. New candidates get the updated template.

---
## Next Steps
• Configure automation rules to reduce manual work.  
• Use dashboards to monitor conversion rates between steps.
