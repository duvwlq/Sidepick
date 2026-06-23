SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM ai_analysis;
DELETE FROM matched_cases;
DELETE FROM comments;
DELETE FROM failure_experiences;

DELETE FROM users
WHERE email IN ('demo-seed@sidepick.local', 'imported-cases@sidepick.local')
   OR email LIKE 'demo.%@sidepick.local'
   OR email LIKE 'imported+%@sidepick.local'
   OR email LIKE 'localcheck%@sidepick.local'
   OR email LIKE 'templateguide%@sidepick.local'
   OR email LIKE 'guide%@sidepick.local'
   OR email LIKE 'demo%@sidepick.local'
   OR nickname LIKE 'demo%'
   OR nickname LIKE 'guide%'
   OR nickname LIKE 'local%';

SET FOREIGN_KEY_CHECKS = 1;

SELECT COUNT(*) AS experiences_after_delete FROM failure_experiences;
SELECT COUNT(*) AS analysis_after_delete FROM ai_analysis;
