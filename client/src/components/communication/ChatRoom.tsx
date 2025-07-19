import { useEffect, useState, useRef } from "react";
import { pusher } from "@/lib/pusher";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Send, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  from: string;
  text: string;
  date: string;
}

interface DeliveryStatus {
  playerId: number;
  playerName: string;
  channel: string;
  status: string;
  messageId?: string;
}

export function ChatRoom() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [deliveryStatuses, setDeliveryStatuses] = useState<DeliveryStatus[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Try to connect to Pusher for real-time updates
    try {
      const channel = pusher.subscribe("global-chat");
      
      channel.bind("message", (data: Message) => {
        setMessages((prev) => {
          // Avoid duplicates by checking if message already exists
          const exists = prev.some(msg => msg.id === data.id);
          return exists ? prev : [...prev, data];
        });
      });
      
      channel.bind("delivery_status", (data: DeliveryStatus) => {
        setDeliveryStatuses((prev) => {
          // Remove old status for same player/message combo and add new one
          const filtered = prev.filter(
            (status) => !(status.playerId === data.playerId && status.messageId === data.messageId)
          );
          return [...filtered, data];
        });
      });

      return () => {
        channel.unbind_all();
        pusher.unsubscribe("global-chat");
      };
    } catch (error) {
      console.warn("Pusher connection failed, using local updates only:", error);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    setSending(true);
    try {
      const response = await apiRequest("/api/chat/send", {
        method: "POST",
        body: JSON.stringify({ 
          text: input, 
          senderId: user?.username || user?.name || "Unknown"
        }),
      });
      
      const result = await response.json();
      
      // Add message locally if real-time isn't working
      if (result.message) {
        setMessages(prev => [...prev, result.message]);
        
        // Add delivery statuses locally
        if (result.deliveryResults) {
          const newDeliveryStatuses = result.deliveryResults.map((delivery: any) => ({
            playerId: delivery.playerId,
            playerName: delivery.playerName,
            channel: delivery.channel,
            status: delivery.status,
            messageId: result.message.id,
          }));
          setDeliveryStatuses(prev => [...prev, ...newDeliveryStatuses]);
        }
      }
      
      setInput("");
      toast({
        title: "Message sent",
        description: `Your message has been broadcast to ${result.deliveryResults?.length || 0} players`,
      });
    } catch (error) {
      console.error("Send message error:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Group delivery statuses by message
  const groupedDeliveryStatuses = deliveryStatuses.reduce((acc, status) => {
    const messageId = status.messageId || "unknown";
    if (!acc[messageId]) {
      acc[messageId] = [];
    }
    acc[messageId].push(status);
    return acc;
  }, {} as Record<string, DeliveryStatus[]>);

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[#56A0D3]" />
            Team Communication
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No messages yet. Send the first message to communicate with all team members!
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="space-y-2">
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 mb-1">
                            From: {msg.from} • {new Date(msg.date).toLocaleTimeString()}
                          </div>
                          <div className="text-sm">{msg.text}</div>
                        </div>
                      </div>
                    </div>
                    {groupedDeliveryStatuses[msg.id] && (
                      <div className="ml-4 p-2 bg-green-50 dark:bg-green-900/20 rounded border-l-2 border-green-200">
                        <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-400 mb-1">
                          <CheckCircle className="h-3 w-3" />
                          Delivered to {groupedDeliveryStatuses[msg.id].length} recipients
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {groupedDeliveryStatuses[msg.id].map((status, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {status.playerName} ({status.channel})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <Separator />
          
          <div className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message to all team members..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={sending}
                className="flex-1"
              />
              <Button 
                onClick={sendMessage} 
                disabled={!input.trim() || sending}
                className="bg-[#56A0D3] hover:bg-[#4a8bc2] text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Messages will be sent to all players via their preferred communication method
              {!import.meta.env.VITE_PUSHER_KEY && (
                <span className="text-amber-600"> • Real-time updates disabled</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}