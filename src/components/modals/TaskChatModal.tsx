import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageSquare, User, Users, Smile, Paperclip, Mic, Phone, Video } from "lucide-react";
import { supabase } from "@/lib/api";
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
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cleanup: (() => void) | null = null;
    
    if (isOpen) {
      loadCurrentUser();
      loadMessages();
      cleanup = setupRealtimeSubscription();
    }

    return () => {
      if (cleanup) cleanup();
    };
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
    const interval = setInterval(() => {
      loadMessages();
    }, 5000);
    return () => clearInterval(interval);
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
        return <Badge className="bg-primary/10 text-primary border-primary/20">HR</Badge>;
      case 'admin':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Admin</Badge>;
      default:
        return <Badge variant="outline" className="bg-muted/10 text-muted-foreground border-muted/20">Employee</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col backdrop-blur-xl bg-background/95 border-border/50">
        <DialogHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-heading">Task Discussion</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  {taskTitle}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                <Video className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-primary/5 pointer-events-none"></div>
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading conversation...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-6 rounded-3xl bg-gradient-card backdrop-blur-xl border border-border/30 shadow-elevated">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-primary/50" />
                  <p className="text-lg font-medium mb-2">No messages yet</p>
                  <p className="text-sm text-muted-foreground">Start the discussion about this task!</p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => {
                const isCurrentUser = message.sender_id === currentUser?.id;
                const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div className={`flex gap-3 max-w-[75%] ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                      {showAvatar && !isCurrentUser && (
                        <Avatar className="h-8 w-8 ring-2 ring-border/20">
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm">
                            {message.sender_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div
                        className={`rounded-2xl p-4 backdrop-blur-sm border smooth-transition ${
                          isCurrentUser
                            ? 'bg-gradient-primary text-primary-foreground border-primary/30 shadow-glow'
                            : 'bg-background/80 border-border/30 hover:bg-background/90'
                        }`}
                      >
                        {!isCurrentUser && showAvatar && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium">{message.sender_name}</span>
                            {getRoleBadge(message.sender_role)}
                          </div>
                        )}
                        
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.message}</p>
                        
                        <div className={`flex items-center justify-between mt-2 text-xs ${
                          isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          <span>{format(new Date(message.created_at), 'MMM dd, HH:mm')}</span>
                          {isCurrentUser && message.is_read && (
                            <span className="text-xs opacity-70">Read</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-6 border-t border-border/50 backdrop-blur-sm bg-background/80 relative z-10">
            <div className="flex items-end gap-3">
              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                <Paperclip className="h-4 w-4" />
              </Button>
              <div className="flex-1 relative">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={sending}
                  className="bg-background/50 border-border/50 focus:border-primary backdrop-blur-sm rounded-2xl pr-12"
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-primary/10"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                <Mic className="h-4 w-4" />
              </Button>
              <Button
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
                className="bg-gradient-primary text-primary-foreground hover:shadow-glow smooth-transition disabled:opacity-50 rounded-full h-11 w-11 p-0"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}