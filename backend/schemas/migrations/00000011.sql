---------------------------
-- Custom: Allow duplicate task names --
---------------------------

-- Remove the unique constraint on task names to allow duplicate task names
-- under the same folder. This enables assigning the same task type to 
-- different artists with different timelines.

DROP INDEX IF EXISTS task_unique_name;
