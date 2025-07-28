---
title: Personas / Profiles
 description: Keeping track of individual people in the system
---

# Personas / Profiles

## What Is a Persona?
A **Persona** is a unique individual in your talent database. It can represent an applicant, passive candidate, or anyone you may submit to a role in the future. Personas live in the `personas` table and can be linked to multiple job applications.

Key fields:
- **Name & Surname** – used in all candidate-facing communication.
- **Email** – must be unique.
- **Location** – free-text city / region.
- **LinkedIn URL** – quick shortcut to social profile.

## Creating a Persona
1. Navigate to **Personas → New Persona**.
2. Enter *Name*, *Surname*, and *Email* (required).  
3. Add optional fields like *Location* or *LinkedIn URL*.
4. Click **Create Persona**.

## Editing a Persona
Open a profile and click **Edit** to update contact details or metadata. All changes are versioned with timestamps.

## Linking a Persona to a Job
When you add a candidate to a job, you’ll select an existing persona or create one on the fly. The system links the `persona_id` on the `candidates` record.

## Deleting (Archiving) Personas
Soft-delete is supported—records are retained for audit and can be restored from the archive list.

> **Tip:** Add notes or tags in the **Metadata** panel to capture skills, seniority, or salary expectations for advanced search later.
