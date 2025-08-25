import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Plus, Send, Search, Filter, Trash2, Users } from 'lucide-react';
import { format } from 'date-fns';

interface ConversationSummary {
  task_evaluation_id: string;
  conversation_type: string;
  conversation_title: string;
  message_count: number;
  unread_count: number;
  last_message_at: string;
  participants: string[];
  last_message: string;
}

interface Message {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
  sender_name?: string;
  sender_role?: string;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
}

const Communications = () => {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
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

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadConversations();
      loadProfiles();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      setCurrentUser({ ...user, profile });
      setUserRole(roleData?.role || 'employee');
    } catch (error) {
      console.error('Error loading user:', error);
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
      const { data } = await supabase
        .from('conversation_summaries')
        .select('*')
        .order('last_message_at', { ascending: false });

      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('task_conversations')
        .select('*')
        .eq('task_evaluation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        throw error;
      }

      // Get sender information separately
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
          .eq('task_evaluation_id', conversationId)
          .neq('sender_id', currentUser?.id);
      }

    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { error } = await supabase
        .from('task_conversations')
        .insert({
          task_evaluation_id: selectedConversation,
          sender_id: currentUser?.id,
          message: newMessage.trim(),
          conversation_type: conversations.find(c => c.task_evaluation_id === selectedConversation)?.conversation_type || 'general',
          message_type: 'text'
        });

      if (error) throw error;

      setNewMessage('');
      loadMessages(selectedConversation);
      loadConversations();

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

  const deleteConversation = async (conversationId: string) => {
    console.log('Attempting to delete conversation:', conversationId);
    try {
      const { error } = await supabase
        .from('task_conversations')
        .delete()
        .eq('task_evaluation_id', conversationId);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      console.log('Delete successful');

      // If the deleted conversation was selected, clear selection
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }

      loadConversations();

      toast({
        title: "Conversation deleted",
        description: "The conversation has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const createNewConversation = async () => {
    if (!newConversationTitle.trim()) return;

    try {
      console.log('Creating conversation with:', {
        title: newConversationTitle,
        type: newConversationType,
        userId: currentUser?.id,
        userRole: userRole,
        participants: selectedParticipants
      });

      // Create a unique conversation ID that doesn't require task_evaluation
      const conversationId = crypto.randomUUID();

      // Create initial system message with participant information
      let systemMessage = `Started conversation: ${newConversationTitle}`;
      if (selectedParticipants.length > 0) {
        const participantNames = selectedParticipants.map(id => 
          profiles.find(p => p.id === id)?.full_name || 'Unknown'
        ).join(', ');
        systemMessage += ` with ${participantNames}`;
      }

      const { error } = await supabase
        .from('task_conversations')
        .insert({
          task_evaluation_id: conversationId, // Use as conversation identifier
          sender_id: currentUser?.id,
          message: systemMessage,
          conversation_type: newConversationType,
          conversation_title: newConversationTitle,
          message_type: 'system'
        });

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      console.log('Conversation created successfully');
      setIsNewConversationOpen(false);
      setNewConversationTitle('');
      setNewConversationType('general');
      setSelectedParticipants([]);
      setParticipantSearch('');
      loadConversations();

      toast({
        title: "Conversation created",
        description: "New conversation has been created successfully.",
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: `Failed to create conversation: ${error.message || 'Please try again.'}`,
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

  const filteredProfiles = profiles.filter(profile => 
    profile.id !== currentUser?.id && // Exclude current user
    (profile.full_name?.toLowerCase().includes(participantSearch.toLowerCase()) ||
     profile.email?.toLowerCase().includes(participantSearch.toLowerCase()))
  );

  const getConversationTypeColor = (type: string) => {
    switch (type) {
      case 'task_related': return 'bg-blue-500';
      case 'performance': return 'bg-green-500';
      case 'leave': return 'bg-yellow-500';
      case 'training': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'hr': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.conversation_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.last_message?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || conv.conversation_type === filterType;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading communications...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageCircle className="h-6 w-6" />
              Communications
            </h1>
            <Dialog open={isNewConversationOpen} onOpenChange={setIsNewConversationOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Start New Conversation</DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="person">With Person</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="general" className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Title</label>
                      <Input
                        value={newConversationTitle}
                        onChange={(e) => setNewConversationTitle(e.target.value)}
                        placeholder="Enter conversation title"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Type</label>
                      <Select value={newConversationType} onValueChange={setNewConversationType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border border-border shadow-lg z-50">
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="performance">Performance</SelectItem>
                          <SelectItem value="leave">Leave Request</SelectItem>
                          <SelectItem value="training">Training</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={createNewConversation} className="w-full">
                      Create Conversation
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="person" className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Title</label>
                      <Input
                        value={newConversationTitle}
                        onChange={(e) => setNewConversationTitle(e.target.value)}
                        placeholder="Enter conversation title"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Search People</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={participantSearch}
                          onChange={(e) => setParticipantSearch(e.target.value)}
                          placeholder="Search by name or email"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Select People</label>
                      <div className="max-h-40 overflow-y-auto border rounded-md">
                        {filteredProfiles.map((profile) => (
                          <div
                            key={profile.id}
                            className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 border-b last:border-b-0 ${
                              selectedParticipants.includes(profile.id) ? 'bg-primary/10' : ''
                            }`}
                            onClick={() => toggleParticipant(profile.id)}
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                {profile.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="font-medium text-sm">{profile.full_name || 'Unknown User'}</div>
                              <div className="text-xs text-muted-foreground">{profile.email}</div>
                            </div>
                            {selectedParticipants.includes(profile.id) && (
                              <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                          </div>
                        ))}
                        {filteredProfiles.length === 0 && (
                          <div className="p-4 text-center text-muted-foreground text-sm">
                            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            No people found
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {selectedParticipants.length > 0 && (
                      <div>
                        <label className="text-sm font-medium">Selected ({selectedParticipants.length})</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedParticipants.map(id => {
                            const profile = profiles.find(p => p.id === id);
                            return (
                              <Badge key={id} variant="secondary" className="text-xs">
                                {profile?.full_name || 'Unknown'}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="text-sm font-medium">Type</label>
                      <Select value={newConversationType} onValueChange={setNewConversationType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border border-border shadow-lg z-50">
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="performance">Performance</SelectItem>
                          <SelectItem value="leave">Leave Request</SelectItem>
                          <SelectItem value="training">Training</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button onClick={createNewConversation} className="w-full">
                      Create Conversation
                    </Button>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search and Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-lg z-50">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="task_related">Task Related</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="leave">Leave</SelectItem>
                <SelectItem value="training">Training</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv) => (
            <div key={conv.task_evaluation_id} className="group relative">
              <div
                className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 ${
                  selectedConversation === conv.task_evaluation_id ? 'bg-muted' : ''
                }`}
                onClick={() => setSelectedConversation(conv.task_evaluation_id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium truncate">
                    {conv.conversation_title || `${conv.conversation_type} conversation`}
                  </h3>
                  <div className="flex items-center gap-2">
                    {conv.unread_count > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {conv.unread_count}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this conversation?')) {
                          deleteConversation(conv.task_evaluation_id);
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`text-xs ${getConversationTypeColor(conv.conversation_type)} text-white`}>
                    {conv.conversation_type.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {conv.message_count} messages
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{conv.last_message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(conv.last_message_at), 'MMM d, h:mm a')}
                </p>
              </div>
            </div>
          ))}
          
          {filteredConversations.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No conversations found</p>
              <p className="text-sm">Start a new conversation to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Messages Header */}
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold">
                {conversations.find(c => c.task_evaluation_id === selectedConversation)?.conversation_title || 'Conversation'}
              </h2>
            </div>

            {/* Messages List - WhatsApp Style */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/20">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] ${message.sender_id === currentUser?.id ? 'mr-2' : 'ml-2'}`}>
                    {/* Sender info - only show for others */}
                    {message.sender_id !== currentUser?.id && (
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs font-medium text-muted-foreground">{message.sender_name}</span>
                        <Badge variant="outline" className="text-xs h-4 px-1">
                          {message.sender_role || 'employee'}
                        </Badge>
                      </div>
                    )}
                    
                    {/* Message bubble */}
                    <div className={`relative p-3 rounded-2xl shadow-sm ${
                      message.sender_id === currentUser?.id 
                        ? 'bg-primary text-primary-foreground rounded-br-md' 
                        : 'bg-background border rounded-bl-md'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                      
                      {/* Timestamp */}
                      <div className={`text-xs mt-1 ${
                        message.sender_id === currentUser?.id 
                          ? 'text-primary-foreground/70 text-right' 
                          : 'text-muted-foreground'
                      }`}>
                        {format(new Date(message.created_at), 'h:mm a')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No messages yet</p>
                    <p className="text-sm">Start the conversation by sending a message</p>
                  </div>
                </div>
              )}
            </div>

            {/* Send Message - WhatsApp Style */}
            <div className="p-4 border-t border-border bg-background">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 min-h-[44px] max-h-32 resize-none rounded-full px-4 py-3 border-2 focus:border-primary/50"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                </div>
                <Button 
                  onClick={sendMessage} 
                  disabled={!newMessage.trim()}
                  size="icon"
                  className="h-11 w-11 rounded-full bg-primary hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Select a conversation to start messaging</p>
              <p className="text-sm">Choose from the list or start a new conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Communications;