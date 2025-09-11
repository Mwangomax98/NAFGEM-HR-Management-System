-- Update conversation_summaries view to better handle personal conversations
DROP VIEW IF EXISTS conversation_summaries;

CREATE VIEW conversation_summaries AS
SELECT DISTINCT
    tc.task_evaluation_id,
    tc.conversation_type,
    tc.conversation_title,
    COUNT(*) OVER (PARTITION BY tc.task_evaluation_id) as message_count,
    COUNT(*) FILTER (WHERE tc.is_read = false) OVER (PARTITION BY tc.task_evaluation_id) as unread_count,
    MAX(tc.created_at) OVER (PARTITION BY tc.task_evaluation_id) as last_message_at,
    ARRAY_AGG(DISTINCT tc.sender_id) OVER (PARTITION BY tc.task_evaluation_id) as participants,
    FIRST_VALUE(tc.message) OVER (
        PARTITION BY tc.task_evaluation_id 
        ORDER BY tc.created_at DESC 
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) as last_message,
    tc.related_record_id,
    tc.related_record_type
FROM task_conversations tc
WHERE tc.message_type IN ('text', 'system');