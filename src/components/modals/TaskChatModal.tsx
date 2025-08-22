import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, MessageSquare, User, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface ChatMessage {
  id: string;
  message: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  message_type: 'text' | 'system';
  is_read: boolean;
  created_at: string;
}

interface TaskChatModalProps {
  evaluationId: string;
  taskTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskChatModal({ evaluationId, taskTitle, isOpen, onClose }: TaskChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadCurrentUser();
      loadMessages();
      setupRealtimeSubscription();
    }
  }, [isOpen, evaluationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        setCurrentUser({
          id: user.id,
          name: profile?.full_name || 'Unknown',
          role: userRole?.role || 'employee'
        });
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('task_conversations')
        .select('*')
        .eq('task_evaluation_id', evaluationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get sender profiles separately
      const senderIds = data?.map(msg => msg.sender_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', senderIds);

      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', senderIds);

      const formattedMessages: ChatMessage[] = data?.map(msg => {
        const profile = profiles?.find(p => p.id === msg.sender_id);
        const role = userRoles?.find(r => r.user_id === msg.sender_id);
        
        return {
          id: msg.id,
          message: msg.message,
          sender_id: msg.sender_id,
          sender_name: profile?.full_name || 'Unknown',
          sender_role: role?.role || 'employee',
          message_type: msg.message_type as 'text' | 'system',
          is_read: msg.is_read,
          created_at: msg.created_at
        };
      }) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('task-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_conversations',
          filter: `task_evaluation_id=eq.${evaluationId}`
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    try {
      setSending(true);

      const { error } = await supabase
        .from('task_conversations')
        .insert({
          task_evaluation_id: evaluationId,
          sender_id: currentUser.id,
          message: newMessage.trim(),
          message_type: 'text'
        });

      if (error) throw error;

      setNewMessage('');
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'hr':
        return <Badge variant="default">HR</Badge>;
      case 'admin':
        return <Badge variant="destructive">Admin</Badge>;
      default:
        return <Badge variant="secondary">Employee</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Task Discussion: {taskTitle}
          </DialogTitle>
          <DialogDescription>
            Discuss task details and provide explanations
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20 rounded-lg">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading conversation...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isCurrentUser = message.sender_id === currentUser?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        isCurrentUser
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background border'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          {isCurrentUser ? (
                            <User className="h-3 w-3" />
                          ) : (
                            <Users className="h-3 w-3" />
                          )}
                          <span className="text-xs font-medium">
                            {message.sender_name}
                          </span>
                          {getRoleBadge(message.sender_role)}
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                      <div className={`text-xs mt-2 ${
                        isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {format(new Date(message.created_at), 'MMM dd, HH:mm')}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="flex gap-2 pt-4">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={sending || !newMessage.trim()}
              size="sm"
            >
              {sending ? (
                "Sending..."
              ) : (
                <>
                  <Send className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}