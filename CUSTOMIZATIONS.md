# Ayon Docker Customizations

This repository contains a customized Ayon deployment with the following modifications:

## Changes Made

### 1. Frontend Customizations
- **Fixed priority filter** - Resolved enum object rendering and filter scope issues
- **Removed Ynput Cloud integration** - Removed cloud connection from onboarding and app menu
- All changes are tracked in `frontend/` directory

### 2. Backend Database Schema
- **Allow duplicate task names** - Removed unique constraint on task names within the same folder
- Enables assigning the same task type to multiple artists with different timelines
- Changes tracked in `backend/schemas/`

## Setup Instructions

1. **Start the containers:**
   ```bash
   docker-compose up -d
   ```

2. **Wait for initialization** (first startup takes longer):
   ```bash
   # Wait about 30-60 seconds for the server to fully start
   ```

3. **Apply the duplicate task fix to demo projects** (only needed on first setup):
   ```bash
   docker-compose exec postgres psql -U ayon ayon -c "DROP INDEX IF EXISTS project_demo_commercial.task_unique_name; DROP INDEX IF EXISTS project_demo_big_episodic.task_unique_name;"
   ```

4. **Access Ayon:**
   - Open http://localhost:5000 in your browser
   - Create your admin user during onboarding

## Notes

- **New projects** created after setup will automatically support duplicate task names
- **Demo projects** need the manual fix above (step 3) on first deployment
- All frontend customizations work immediately after container startup

## Testing Duplicate Tasks

To verify duplicate task functionality:
1. Navigate to any folder/shot in a project
2. Create a task (e.g., "Animation")
3. Create another task with the same name "Animation"
4. Assign them to different artists - both should work!
