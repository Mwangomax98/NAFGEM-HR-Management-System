-- Fix conversation_summaries view for personal conversations
DROP VIEW IF EXISTS conversation_summaries;

CREATE VIEW conversation_summaries AS
WITH conversation_stats AS (
    SELECT 
        task_evaluation_id,
        conversation_type,
        conversation_title,
        COUNT(*) as message_count,
        COUNT(*) FILTER (WHERE is_read = false) as unread_count,
        MAX(created_at) as last_message_at,
        ARRAY_AGG(DISTINCT sender_id) as participants,
        (ARRAY_AGG(message ORDER BY created_at DESC))[1] as last_message,
        related_record_id,
        related_record_type
    FROM task_conversations
    WHERE message_type IN ('text', 'system')
    GROUP BY task_evaluation_id, conversation_type, conversation_title, related_record_id, related_record_type
)
SELECT * FROM conversation_stats;