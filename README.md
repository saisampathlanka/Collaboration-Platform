##PHASE 1 - Monolith Base

Tech Stack: React, Node.js, Express, PostgreSQL

Splitting the problem:
1. problem spec
2. high level design
3. data model
4. api design
5. implementation decisions
6. critical enginnering thinking
7. edge cases
8. testing
9. measure

### Problem Specification
#### Functional Requirements
- [] Create Note
- [] Edit Note
- [] Delete Note
- [] View All Notes
- [] Persist Data

Non Functional Requirements
- [] Low latency (<200ms local)
- [] No data loss
- [] Simple to extend

#### High level design
Frontend -> Backend api (monolith) -> Database

#### Data Model
notes:
  - id (primary key) (uuid, not auto-incrementing)
  - title
  - content
  - created_at
  - updated_at

#### Api Design
POST /notes - create a new note
GET /notes - get all notes
GET /notes/:id - get a note by id
PUT /notes/:id - update an existing note
DELETE /notes/:id - delete a note

#### Implementation Decisions
Backend: Keeping it layered - Controller (HTTP), Service (Business Logic), Repository (DB)
DB Choice: PostgreSQL

#### Critical Engineering Thinking
- [] uuid > auto-incrementing id (breaking at scale)
- [] Full content overwrite. Issue: real 0 time collaboration conflicts. For now it is fine - but noting the limitations.

#### Edge Cases
- [] Updating non existent note
- [] Deleting twice
- [] Empty Content
- [] Very large content

#### Testing
- [] unit tests -> service logic
- [] integration tests -> api endpoints + database
- [] what to test -> create to fetch to update to delete lifecycle

#### Measure
- [] Request time logging
- [] Database query time

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
