SHOW TABLES;

SELECT COUNT(*) AS experiences FROM failure_experiences;
SELECT COUNT(*) AS analysis FROM ai_analysis;

SELECT table_name, constraint_name, referenced_table_name
FROM information_schema.key_column_usage
WHERE table_schema = 'failforward'
  AND referenced_table_name = 'failure_experiences';
