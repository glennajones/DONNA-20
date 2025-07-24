import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, MessageSquare, User, Calendar, Filter, Search } from 'lucide-react';
import { format } from 'date-fns';

interface EventFeedback {
  id: number;
  eventId: number;
  userId: number;
  rating: number;
  comment: string | null;
  submittedAt: string;
  userName: string;
  userRole: string;
}

interface EventFeedbackAdminProps {
  eventId: number;
  eventName?: string;
}

export default function EventFeedbackAdmin({ eventId, eventName }: EventFeedbackAdminProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');

  // Fetch feedback for the event
  const { data: feedback = [], isLoading, error } = useQuery<EventFeedback[]>({
    queryKey: ['/api/event-feedback', eventId],
    enabled: !!eventId
  });

  // Filter feedback based on search and rating
  const filteredFeedback = feedback.filter(fb => {
    const matchesSearch = !searchTerm || 
      fb.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fb.comment && fb.comment.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRating = ratingFilter === 'all' || fb.rating.toString() === ratingFilter;
    
    return matchesSearch && matchesRating;
  });

  // Calculate statistics
  const averageRating = feedback.length > 0 
    ? (feedback.reduce((sum, fb) => sum + fb.rating, 0) / feedback.length).toFixed(1)
    : '0.0';

  const ratingCounts = feedback.reduce((acc, fb) => {
    acc[fb.rating] = (acc[fb.rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'manager': return 'default';
      case 'coach': return 'secondary';
      case 'player': return 'outline';
      case 'parent': return 'outline';
      default: return 'outline';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading feedback...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="pt-6">
          <p className="text-red-600">Failed to load feedback. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
            Event Feedback
            {eventName && <span className="ml-2 text-gray-500">({eventName})</span>}
          </CardTitle>
          <CardDescription>
            Review feedback from participants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{feedback.length}</div>
              <div className="text-sm text-blue-700">Total Responses</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <Star className="h-5 w-5 text-yellow-500 fill-current mr-1" />
                <span className="text-2xl font-bold text-yellow-600">{averageRating}</span>
              </div>
              <div className="text-sm text-yellow-700">Average Rating</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {feedback.filter(fb => fb.comment && fb.comment.trim()).length}
              </div>
              <div className="text-sm text-green-700">With Comments</div>
            </div>
          </div>

          {/* Rating Distribution */}
          {feedback.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Rating Distribution</h4>
              {[5, 4, 3, 2, 1].map(rating => (
                <div key={rating} className="flex items-center space-x-2">
                  <span className="text-sm w-8">{rating}★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{
                        width: `${feedback.length > 0 ? ((ratingCounts[rating] || 0) / feedback.length) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8">{ratingCounts[rating] || 0}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {feedback.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No feedback yet</p>
              <p className="text-sm">Feedback will appear here once participants submit their responses.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search" className="text-sm font-medium">Search Feedback</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by name or comment..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Filter by Rating</Label>
                  <Select value={ratingFilter} onValueChange={setRatingFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All ratings" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ratings</SelectItem>
                      <SelectItem value="5">5 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="2">2 Stars</SelectItem>
                      <SelectItem value="1">1 Star</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feedback List */}
          <div className="space-y-4">
            {filteredFeedback.map((fb) => (
              <Card key={fb.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{fb.userName}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={getRoleBadgeVariant(fb.userRole)}>
                            {fb.userRole}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {format(new Date(fb.submittedAt), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {renderStars(fb.rating)}
                    </div>
                  </div>
                  
                  {fb.comment && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">{fb.comment}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredFeedback.length === 0 && (searchTerm || ratingFilter !== 'all') && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-gray-500">
                  <Filter className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No feedback matches your filters</p>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearchTerm('');
                      setRatingFilter('all');
                    }}
                    className="mt-2"
                  >
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}