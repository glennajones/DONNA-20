import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageCircle, ThumbsUp, ThumbsDown, Send, Calendar, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EpisodePlayer({ episode, onBack }) {
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [pollVote, setPollVote] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (episode?.id) {
      fetchComments();
      fetchPollVote();
    }
  }, [episode?.id]);

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/podcast/episodes/${episode.id}/comments`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const fetchPollVote = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const res = await fetch(`/api/podcast/episodes/${episode.id}/poll-vote`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPollVote(data.vote);
      }
    } catch (error) {
      console.error('Failed to fetch poll vote:', error);
    }
  };

  const handleAddComment = async () => {
    if (commentInput.trim() === "") return;
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      toast({
        title: "Authentication required",
        description: "Please log in to post comments",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/podcast/episodes/${episode.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: commentInput })
      });

      if (res.ok) {
        const newComment = await res.json();
        setComments(prev => [newComment, ...prev]);
        setCommentInput("");
        toast({
          title: "Comment posted",
          description: "Your comment has been added successfully"
        });
      } else {
        throw new Error('Failed to post comment');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (vote) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      toast({
        title: "Authentication required",
        description: "Please log in to vote in polls",
        variant: "destructive"
      });
      return;
    }

    try {
      const res = await fetch(`/api/podcast/episodes/${episode.id}/poll-vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ vote })
      });

      if (res.ok) {
        setPollVote(vote);
        toast({
          title: "Vote recorded",
          description: `You voted: ${vote === 'like' ? 'Yes' : 'No'}`
        });
      } else {
        throw new Error('Failed to record vote');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record vote. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!episode) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Episodes
        </Button>
        <Badge variant={episode.status === 'published' ? 'default' : 'secondary'}>
          {episode.status || 'published'}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{episode.title}</CardTitle>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(episode.publishedAt || episode.createdAt).toLocaleDateString()}
            </div>
            {episode.duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {episode.duration}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {episode.description && (
            <div>
              <h3 className="font-semibold mb-2">Episode Description</h3>
              <p className="text-gray-700 dark:text-gray-300">{episode.description}</p>
            </div>
          )}

          {/* Audio Player */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              🎙️ Audio Player
            </h3>
            {episode.audioUrl ? (
              <audio
                className="w-full"
                src={episode.audioUrl}
                controls
                preload="metadata"
              />
            ) : (
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                <p className="text-gray-500">Audio not available for this episode</p>
              </div>
            )}
          </div>

          {/* Poll */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                📊 Quick Poll
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Did you enjoy this episode?</p>
              <div className="flex gap-3">
                <Button
                  variant={pollVote === 'like' ? 'default' : 'outline'}
                  onClick={() => handleVote('like')}
                  className="flex-1"
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Yes
                </Button>
                <Button
                  variant={pollVote === 'dislike' ? 'default' : 'outline'}
                  onClick={() => handleVote('dislike')}
                  className="flex-1"
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  No
                </Button>
              </div>
              {pollVote && (
                <p className="mt-3 text-sm text-green-600 font-medium">
                  ✅ You voted: {pollVote === 'like' ? 'Yes' : 'No'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Comments ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Comment */}
              <div className="space-y-2">
                <Textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Share your thoughts about this episode..."
                  className="min-h-[100px]"
                />
                <Button 
                  onClick={handleAddComment} 
                  disabled={loading || !commentInput.trim()}
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>

              {/* Comments List */}
              <div className="space-y-3">
                {comments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-sm">{comment.authorName || 'Anonymous'}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}