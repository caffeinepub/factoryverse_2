# FactoryVerse

## Current State
MVP v20 is live. Modules include: auth, dashboard, machines, projects, tasks, failures, documents, HSE, logistics, notifications, Gantt calendar, QR codes, preventive maintenance plans, personnel performance, machine detail, project costs, personnel detail, project detail, project team assignment, project-linked failures, project status updates.

Missing: task edit/delete, machine edit/delete, a reporting/KPI page, and failure-maintenance linkage.

## Requested Changes (Diff)

### Add
- Backend: `updateTaskStatus`, `deleteTask`, `updateMachine`, `deleteMachine`, `linkFailureMaintenance`, `getFailureMaintenance` endpoints
- Frontend: New `Reports.tsx` page — KPI cards (total machines/active/breakdown, total failures/open/resolved, task completion rate, shipment status counts, HSE open records, cost totals per project)
- Frontend: Edit dialog and delete button on Tasks page
- Frontend: Edit dialog and delete button on Machines page
- Frontend: On Maintenance (failures) page, when resolving a failure, optionally link to a maintenance plan
- Sidebar: Add "Raporlar" link with chart icon

### Modify
- Tasks page: add edit (title, assignee, dueDate) and delete per task
- Machines page: add edit (name, type, serialNumber, location, notes) and delete per machine
- Maintenance (failures) page: add maintenance plan selector when resolving

### Remove
- Nothing removed

## Implementation Plan
1. Add backend functions: updateTaskStatus (if missing), deleteTask, updateMachine, deleteMachine, linkFailureMaintenance, getFailureMaintenance
2. Update backend.d.ts with new function signatures
3. Create Reports.tsx with KPI summary cards and simple stats
4. Update Tasks.tsx with edit dialog and delete button
5. Update Machines.tsx with edit dialog and delete button
6. Update Maintenance.tsx with maintenance plan linkage when resolving
7. Add Reports route to AppShell.tsx
