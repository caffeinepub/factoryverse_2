# FactoryVerse — Sürüm 31-B

## Current State

FactoryVerse is a full-stack factory management platform on ICP with 30+ modules. As of Sürüm 31-A:
- GanttCalendar page (`/src/frontend/src/pages/GanttCalendar.tsx`) shows a 90-day horizontal Gantt chart for projects and tasks.
- Reports page (`/src/frontend/src/pages/Reports.tsx`) shows KPI cards for machines, failures, projects, tasks, HSE, logistics, costs, attendance, and spare parts. Has a print/PDF button and CSV export. No charts for cost breakdown.
- Backend has all required APIs: `listProjectCosts`, `listAllTasks`, `listShifts`.
- Recharts is available (`recharts ^2.15.1`) and wrapped by shadcn `chart.tsx`.

## Requested Changes (Diff)

### Add
- **GanttCalendar page**: Monthly calendar tab view — toggle between existing Gantt view and a new monthly calendar. The monthly calendar shows tasks (colored by status) and shifts (colored by type: Sabah/Öğlen/Gece) on each day cell.
- **Reports page**: 
  - Cost breakdown pie chart by category (uses `listProjectCosts`, groups by `category`).
  - Project cost comparison bar chart — top 5 projects by total cost as horizontal bars with ₺ labels.

### Modify
- `GanttCalendar.tsx`: Add a "Gantt / Takvim" toggle (tabs or button group). Fetch `listAllTasks` and `listShifts` for calendar view. Monthly calendar navigates months, shows colored chips per day.
- `Reports.tsx`: Add new "Maliyet Analizi" section below current KPI cards with PieChart and BarChart using Recharts/shadcn chart components.

### Remove
- Nothing removed.

## Implementation Plan

1. **GanttCalendar.tsx**:
   - Add state: `view: 'gantt' | 'calendar'`, `calMonth: Date`.
   - Fetch `listAllTasks(companyId)` and `listShifts(companyId)` when switching to calendar view.
   - Build a standard monthly grid (Sun–Sat or Mon–Sun headers, day cells).
   - Each day cell shows task chips (title truncated, colored by status) and shift chips (shiftType, colored by type).
   - Navigation: prev/next month buttons + current month label.
   - Toggle UI: two-button group at the top right of the page header.

2. **Reports.tsx**:
   - Below the spare parts section, add a new section "Maliyet Analizi".
   - Pie chart: group `listProjectCosts` by `category`, sum `amount` per category. Use recharts `PieChart` + `Cell` with distinct colors.
   - Bar chart: top 5 projects by total cost, horizontal `BarChart` with project name labels and ₺ formatted values.
   - Both charts are rendered only when cost data exists; show empty state otherwise.
   - Use recharts directly (not shadcn chart wrapper) for simplicity — import from `recharts`.
