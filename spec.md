# FactoryVerse

## Current State
MVP is live with 19 modules. The latest addition (Sürüm 19) linked failure records to projects and shows them in the project detail page. Projects have a `status` field stored in backend, but there is no way for admins to update project status via the UI. The backend has no `updateProjectStatus` function.

## Requested Changes (Diff)

### Add
- Backend: `updateProjectStatus(projectId: Text, status: Text)` function that updates a project's status, with company access verification.
- Frontend: In `ProjectDetail.tsx`, allow admin users to change project status via a dropdown/select in the project header area. Statuses: Planning (Planlama), Active (Aktif), Completed (Tamamlandı), OnHold (Beklemede).

### Modify
- `backend.did.js`: Add `updateProjectStatus` IDL entry.
- `backend.d.ts`: Add `updateProjectStatus` method signature to `_SERVICE`.
- `ProjectDetail.tsx`: Show a status change selector in the project header for admin users.

### Remove
- Nothing removed.

## Implementation Plan
1. Add `updateProjectStatus` to `src/backend/main.mo`.
2. Register it in `backend.did.js` (idlService + idlFactory).
3. Add the TypeScript signature to `backend.did.d.ts`.
4. In `ProjectDetail.tsx`, add an inline status selector in the project header (only for admin), calling `updateProjectStatus` on change and updating local state.
