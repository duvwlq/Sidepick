SELECT COUNT(*) AS experiences_count FROM failure_experiences;
SELECT COUNT(*) AS analysis_count FROM ai_analysis;
SELECT category_id, COUNT(*) AS cnt FROM failure_experiences GROUP BY category_id ORDER BY category_id;
SELECT id, category_id, business_type FROM failure_experiences WHERE id = 11;
SELECT COUNT(*) AS demo_like_users FROM users WHERE email LIKE 'demo-%@sidepick.local' OR email LIKE 'local-%@sidepick.local' OR nickname LIKE 'Demo %' OR nickname LIKE 'Local %';
