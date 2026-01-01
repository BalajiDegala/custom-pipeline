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
- [ ] Bulk editing (select multiple rows, edit same field)
- [ ] Status change dropdown with predefined options
- [ ] Assignee picker with user search
- [ ] Date picker for deadline fields
- [ ] Undo/Redo for edits
- [ ] Edit history log

## Phase 3: Task Creation
- [ ] "Create Task" node type
- [ ] Task template system
- [ ] Batch task creation from folder selection
- [ ] Task duplication
- [ ] Task type presets (Animation, Lighting, Comp, etc.)
- [ ] Auto-assignment rules

## Phase 4: Scheduling
- [ ] Timeline view node
- [ ] Gantt chart visualization
- [ ] Drag-to-schedule tasks
- [ ] Dependencies between tasks
- [ ] Milestone markers
- [ ] Workload balancing view (per artist)
- [ ] Calendar integration

## Phase 5: Production Setup
- [ ] Project creation wizard
- [ ] Asset/Shot structure templates
- [ ] Import from spreadsheet (CSV/Excel)
- [ ] Folder hierarchy generator
- [ ] Task template application
- [ ] Team assignment

## Phase 6: Reporting & Analytics
- [ ] Dashboard widgets
- [ ] Progress charts (burndown, velocity)
- [ ] Artist productivity reports
- [ ] Deadline tracking
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

