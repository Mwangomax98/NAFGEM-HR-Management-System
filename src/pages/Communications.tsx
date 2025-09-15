import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, 
  Plus, 
  Send, 
  Search, 
  Filter, 
  Trash2, 
  Users, 
  User,
  Star,
  Settings,
  Eye,
  EyeOff,
  Phone,
  Video,
  Paperclip,
  Smile,
  MoreVertical,
  Volume2,
  Mic,
  Calendar,
  Bell
} from 'lucide-react';
import { format } from 'date-fns';

interface Conversation {
  id: string;
  title: string;
  type: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  participants: string[];
  participant_names: string[];
  is_muted?: boolean;
  is_starred?: boolean;
}

interface Message {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
  sender_name?: string;
  sender_role?: string;
  message_type: string;
  is_read: boolean;
  reactions?: Array<{ emoji: string; users: string[] }>;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

const Communications = () => {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [newConversationTitle, setNewConversationTitle] = useState('');
  const [newConversationType, setNewConversationType] = useState('general');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadConversations();
      loadProfiles();
      setupRealtimeSubscription();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = '/auth';
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      setCurrentUser({ ...user, profile });
      setUserRole(roleData?.role || 'employee');
    } catch (error) {
      console.error('Error loading user:', error);
      window.location.href = '/auth';
    } finally {
      setLoading(false);
    }
  };

  const loadProfiles = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email');
      
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const loadConversations = async () => {
    try {
      // Get conversations where user is a participant
      const { data: participantData } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUser?.id);

      if (!participantData || participantData.length === 0) {
        setConversations([]);
        return;
      }

      const conversationIds = participantData.map(p => p.conversation_id);

      // Get conversation details
      const { data: conversationMessages } = await supabase
        .from('task_conversations')
        .select('conversation_id, conversation_title, conversation_type, created_at, message')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

      // Group by conversation and get latest message
      const conversationMap = new Map();
      
      conversationMessages?.forEach(msg => {
        if (!conversationMap.has(msg.conversation_id) || 
            new Date(msg.created_at) > new Date(conversationMap.get(msg.conversation_id).last_message_at)) {
          conversationMap.set(msg.conversation_id, {
            id: msg.conversation_id,
            title: msg.conversation_title || `Conversation ${msg.conversation_id.slice(0, 8)}`,
            type: msg.conversation_type,
            last_message: msg.message,
            last_message_at: msg.created_at,
            unread_count: 0,
            participants: [],
            participant_names: []
          });
        }
      });

      // Get participant names for each conversation
      for (const [conversationId, conversation] of conversationMap) {
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conversationId);

        if (participants) {
          const userIds = participants.map(p => p.user_id);
          
          // Get profile information for participants
          const { data: participantProfiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);
          
          conversation.participants = userIds;
          conversation.participant_names = participantProfiles?.map(p => p.full_name) || [];
        }
      }

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('task_conversations')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get sender information
      const senderIds = [...new Set(data?.map(msg => msg.sender_id) || [])];
      
      const { data: senderProfiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', senderIds);

      const { data: senderRoles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', senderIds);

      const messagesWithSenderInfo = data?.map(msg => {
        const profile = senderProfiles?.find(p => p.id === msg.sender_id);
        const role = senderRoles?.find(r => r.user_id === msg.sender_id);
        return {
          ...msg,
          sender_name: profile?.full_name || 'Unknown User',
          sender_role: role?.role || 'employee'
        };
      }) || [];

      setMessages(messagesWithSenderInfo);

      // Mark messages as read
      if (data && data.length > 0) {
        await supabase
          .from('task_conversations')
          .update({ is_read: true })
          .eq('conversation_id', conversationId)
          .neq('sender_id', currentUser?.id);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('communications-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_conversations'
        },
        (payload) => {
          if (selectedConversation && payload.new.conversation_id === selectedConversation) {
            loadMessages(selectedConversation);
          }
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { error } = await supabase
        .from('task_conversations')
        .insert({
          conversation_id: selectedConversation,
          sender_id: currentUser?.id,
          message: newMessage.trim(),
          conversation_type: conversations.find(c => c.id === selectedConversation)?.type || 'general',
          conversation_title: conversations.find(c => c.id === selectedConversation)?.title,
          message_type: 'text'
        });

      if (error) throw error;

      setNewMessage('');
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const createNewConversation = async () => {
    if (!newConversationTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a conversation title.",
        variant: "destructive",
      });
      return;
    }

    try {
      const conversationId = crypto.randomUUID();
      
      // Create initial message
      const { error: messageError } = await supabase
        .from('task_conversations')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUser.id,
          message: `Started conversation: ${newConversationTitle}`,
          conversation_type: newConversationType,
          conversation_title: newConversationTitle,
          message_type: 'system',
          is_read: false
        });

      if (messageError) throw messageError;

      // Add current user as participant
      const participantsToAdd = [currentUser.id, ...selectedParticipants];
      
      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert(
          participantsToAdd.map(userId => ({
            conversation_id: conversationId,
            user_id: userId
          }))
        );

      if (participantError) throw participantError;

      // Reset form
      setIsNewConversationOpen(false);
      setNewConversationTitle('');
      setNewConversationType('general');
      setSelectedParticipants([]);
      setParticipantSearch('');
      
      await loadConversations();

      toast({
        title: "Conversation created",
        description: "New conversation has been created successfully.",
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
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

  const filteredProfiles = profiles.filter(profile => 
    profile.id !== currentUser?.id &&
    (profile.full_name?.toLowerCase().includes(participantSearch.toLowerCase()) ||
     profile.email?.toLowerCase().includes(participantSearch.toLowerCase()))
  );

  const getConversationTypeColor = (type: string) => {
    switch (type) {
      case 'task_related': return 'bg-primary/20 text-primary border-primary/30';
      case 'performance': return 'bg-success/20 text-success border-success/30';
      case 'leave': return 'bg-warning/20 text-warning border-warning/30';
      case 'training': return 'bg-secondary/20 text-secondary border-secondary/30';
      default: return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'hr': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.last_message?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || conv.type === filterType;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-lg font-medium">Loading communications...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-background via-background to-muted/10 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
      
      {/* Conversations List */}
      <div className="w-1/3 backdrop-blur-xl bg-background/80 border-r border-border/50 flex flex-col relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5"></div>
        
        {/* Header */}
        <div className="p-6 border-b border-border/50 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-heading font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                <MessageCircle className="h-6 w-6" />
              </div>
              Communications
            </h1>
            
            <Dialog open={isNewConversationOpen} onOpenChange={setIsNewConversationOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  className="bg-gradient-accent text-accent-foreground hover:shadow-accent-glow smooth-transition interactive-scale"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md backdrop-blur-xl bg-background/95 border-border/50">
                <DialogHeader>
                  <DialogTitle className="font-heading">Start New Conversation</DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                    <TabsTrigger value="general" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">General</TabsTrigger>
                    <TabsTrigger value="person" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">With Person</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="general" className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Title</label>
                      <Input
                        value={newConversationTitle}
                        onChange={(e) => setNewConversationTitle(e.target.value)}
                        placeholder="Enter conversation title"
                        className="bg-background/50 border-border/50 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Type</label>
                      <Select value={newConversationType} onValueChange={setNewConversationType}>
                        <SelectTrigger className="bg-background/50 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="backdrop-blur-xl bg-background/95 border-border/50">
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="performance">Performance</SelectItem>
                          <SelectItem value="leave">Leave</SelectItem>
                          <SelectItem value="training">Training</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={createNewConversation} 
                      className="w-full bg-gradient-primary text-primary-foreground hover:shadow-glow smooth-transition"
                    >
                      Create Conversation
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="person" className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Title</label>
                      <Input
                        value={newConversationTitle}
                        onChange={(e) => setNewConversationTitle(e.target.value)}
                        placeholder="Enter conversation title"
                        className="bg-background/50 border-border/50"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Add Participants</label>
                      <Input
                        value={participantSearch}
                        onChange={(e) => setParticipantSearch(e.target.value)}
                        placeholder="Search for people..."
                        className="bg-background/50 border-border/50"
                      />
                      <div className="max-h-40 overflow-y-auto mt-2 space-y-2">
                        {filteredProfiles.map(profile => (
                          <div 
                            key={profile.id} 
                            className={`p-3 rounded-lg cursor-pointer smooth-transition ${
                              selectedParticipants.includes(profile.id) 
                                ? 'bg-primary/20 border border-primary/30' 
                                : 'bg-muted/20 hover:bg-muted/40 border border-border/30'
                            }`}
                            onClick={() => toggleParticipant(profile.id)}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                                  {profile.full_name?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="font-medium">{profile.full_name}</div>
                                <div className="text-sm text-muted-foreground">{profile.email}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button 
                      onClick={createNewConversation} 
                      className="w-full bg-gradient-primary text-primary-foreground hover:shadow-glow smooth-transition"
                      disabled={selectedParticipants.length === 0}
                    >
                      Start Personal Chat
                    </Button>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search and Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search conversations..."
                className="pl-10 bg-background/50 border-border/50 focus:border-primary backdrop-blur-sm"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="bg-background/50 border-border/50">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="backdrop-blur-xl bg-background/95 border-border/50">
                <SelectItem value="all">All Conversations</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="leave">Leave</SelectItem>
                <SelectItem value="training">Training</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 relative z-10">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No conversations found</p>
              <p className="text-sm text-muted-foreground/70">Start a new conversation to get chatting!</p>
            </div>
          ) : (
            filteredConversations.map(conversation => (
              <Card 
                key={conversation.id}
                className={`cursor-pointer smooth-transition interactive-lift border-border/30 hover:border-primary/30 ${
                  selectedConversation === conversation.id 
                    ? 'bg-primary/10 border-primary/30 shadow-glow' 
                    : 'bg-background/60 backdrop-blur-sm hover:bg-background/80'
                }`}
                onClick={() => setSelectedConversation(conversation.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                        {conversation.type === 'general' ? <Users className="h-6 w-6" /> : <User className="h-6 w-6" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate">{conversation.title}</h3>
                        {conversation.last_message_at && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(conversation.last_message_at), 'MMM dd')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={`text-xs ${getConversationTypeColor(conversation.type)}`}>
                          {conversation.type}
                        </Badge>
                        {conversation.unread_count > 0 && (
                          <Badge className="bg-accent text-accent-foreground">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                      {conversation.last_message && (
                        <p className="text-sm text-muted-foreground truncate">{conversation.last_message}</p>
                      )}
                      {conversation.participant_names.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground truncate">
                            {conversation.participant_names.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col backdrop-blur-xl bg-background/70 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-primary/5"></div>
        
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-border/50 backdrop-blur-sm bg-background/80 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      <MessageCircle className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-heading font-semibold">
                      {conversations.find(c => c.id === selectedConversation)?.title}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        {conversations.find(c => c.id === selectedConversation)?.participant_names.join(', ')}
                      </span>
                      {typingUsers.length > 0 && (
                        <span className="text-primary animate-pulse">
                          {typingUsers.join(', ')} typing...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No messages yet</p>
                  <p className="text-sm text-muted-foreground/70">Start the conversation!</p>
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
                      <div className={`flex gap-3 max-w-[70%] ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                        {showAvatar && !isCurrentUser && (
                          <Avatar className="h-8 w-8 ring-2 ring-border/20">
                            <AvatarFallback className="bg-muted">
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
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getRoleBadgeColor(message.sender_role || 'employee')}`}
                              >
                                {message.sender_role || 'employee'}
                              </Badge>
                            </div>
                          )}
                          
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.message}</p>
                          
                          <div className={`flex items-center justify-between mt-2 text-xs ${
                            isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            <span>{format(new Date(message.created_at), 'HH:mm')}</span>
                            {isCurrentUser && (
                              <div className="flex items-center gap-1">
                                {message.is_read ? (
                                  <Eye className="h-3 w-3" />
                                ) : (
                                  <EyeOff className="h-3 w-3" />
                                )}
                              </div>
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
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="resize-none min-h-[44px] max-h-32 bg-background/50 border-border/50 focus:border-primary backdrop-blur-sm rounded-2xl"
                    rows={1}
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-2 bottom-2 hover:bg-primary/10"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                  <Mic className="h-4 w-4" />
                </Button>
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-gradient-primary text-primary-foreground hover:shadow-glow smooth-transition disabled:opacity-50 rounded-full h-11 w-11 p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center relative z-10">
            <div className="max-w-md mx-auto">
              <div className="p-6 rounded-3xl bg-gradient-card backdrop-blur-xl border border-border/30 shadow-elevated">
                <MessageCircle className="h-20 w-20 mx-auto mb-6 text-primary/50" />
                <h3 className="text-2xl font-heading font-semibold mb-3">Welcome to Communications</h3>
                <p className="text-muted-foreground mb-6">
                  Select a conversation to start chatting, or create a new one to connect with your colleagues.
                </p>
                <Button 
                  onClick={() => setIsNewConversationOpen(true)}
                  className="bg-gradient-accent text-accent-foreground hover:shadow-accent-glow smooth-transition"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Conversation
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Communications;