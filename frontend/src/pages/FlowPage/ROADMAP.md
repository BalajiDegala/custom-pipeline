# Flow Page - Production Management Roadmap

## Vision
Build a comprehensive visual production management tool for VFX/Animation studios that allows:
- **Query & Analysis**: Visual flow-based queries to explore and analyze pipeline data
- **Data Editing**: Inline editing with database persistence
- **Task Management**: Create, assign, and track tasks
- **Scheduling**: Visual timeline and scheduling tools
- **Production Setup**: Project initialization, asset structure, shot breakdown

---

## Phase 1: Query & View ✅ (Current)
- [x] Visual node-based query builder
- [x] Project, Folders, Tasks, Products, Versions nodes
- [x] Department and Artist filtering
- [x] Table view with sorting and column management
- [x] Hierarchical view (Project → Department → Artist → Tasks)
- [x] CSV/HTML export
- [x] Open in new tab
- [x] Script save/load

## Phase 2: Data Editing (In Progress)
- [x] Inline cell editing in table view
- [x] REST API PATCH calls for updates
- [x] Bulk editing (select multiple rows, edit same field)
- [x] Status change dropdown with predefined options
- [x] Assignee picker with user search
- [x] Date picker for deadline fields
- [x] Undo/Redo for edits
- [x] Edit history log
- [x] Search/filter results

## Phase 3: Entity Creation
- [ ] Create new folder (from Results page)
- [ ] Folder type selection
- [ ] Folder hierarchy creation (nested folders)
- [ ] Create task under folder
- [ ] Task type selection (Animation, Lighting, Comp, etc.)
- [ ] Batch task creation (multiple tasks at once)
- [ ] Task template system
- [ ] Task duplication
- [ ] Auto-assignment rules

## Phase 4: Scheduling
- [x] Timeline view node
- [x] Gantt chart visualization
- [x] Drag-to-schedule tasks
- [x] Dependencies between tasks
- [x] Milestone markers
- [x] Workload balancing view (per artist)
- [x] Calendar integration

## Phase 5: Production Setup
- [ ] Project creation wizard (requires backend API)
- [ ] Asset/Shot structure templates (requires backend API)
- [x] Import from spreadsheet (CSV/Excel) - via CSV Import
- [ ] Folder hierarchy generator (requires backend API)
- [ ] Task template application (requires backend API)
- [ ] Team assignment (requires backend API)

## Phase 6: Reporting & Analytics
- [x] Dashboard widgets
- [x] Progress charts (burndown, velocity)
- [x] Artist productivity reports (via Workload view)
- [x] Deadline tracking
- [ ] Custom report builder
---

## API Requirements

### Existing AYON APIs Used:
- `GET /graphql` - Query data
- `PATCH /api/projects/{project}/{entityType}s/{id}` - Update entities

### Additional APIs Needed for Full Features:
- `POST /api/projects/{project}/tasks` - Create tasks
- `POST /api/projects/{project}/folders` - Create folders
- `DELETE /api/projects/{project}/tasks/{id}` - Delete tasks
- `POST /api/projects/{project}/tasks/bulk` - Bulk operations
- `GET /api/users` - List users for assignment
- `GET /api/task-types` - List available task types
- `GET /api/statuses` - List available statuses

---

## Node Types to Add

### Query Nodes (Phase 1-2)
- [x] Project
- [x] Folders
- [x] Products
- [x] Versions
- [x] Tasks
- [x] Departments (Task Types)
- [x] Artists (Users)
- [x] Columns
- [x] Results

### Action Nodes (Phase 3+)
- [ ] Create Task
- [ ] Update Field
- [ ] Assign User
- [ ] Change Status
- [ ] Add Tag
- [ ] Create Folder
- [ ] Duplicate

### View Nodes (Phase 4+)
- [ ] Timeline
- [ ] Gantt
- [ ] Calendar
- [ ] Workload
- [ ] Statistics

---

## Technical Considerations

### Database Updates
- Use AYON REST API for all mutations
- Optimistic UI updates with rollback on error
- Batch operations for performance
- Conflict detection for concurrent edits

### Real-time Features
- WebSocket for live updates (optional)
- Polling for status changes
- Notification on external changes

### Performance
- Pagination for large datasets
- Virtual scrolling for long lists
- Query caching
- Debounced search

