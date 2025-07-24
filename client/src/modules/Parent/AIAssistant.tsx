import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bot, MessageCircle, Sparkles, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function AIAssistant() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [eventsFound, setEventsFound] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      toast({
        title: "Question Required",
        description: "Please enter a question to get help from our AI assistant",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setAnswer('');
    setEventsFound(null);

    try {
      const response = await apiRequest('/api/ai-assist', {
        method: 'POST',
        body: JSON.stringify({ question: question.trim() })
      });
      
      const data = await response.json();
      
      setAnswer(data.answer);
      setEventsFound(data.eventsFound);
      
      toast({
        title: "Response Generated",
        description: `Found ${data.eventsFound || 0} relevant training opportunities`,
      });
    } catch (error: any) {
      console.error('AI Assistant error:', error);
      toast({
        title: "Assistant Unavailable", 
        description: "Our AI assistant is temporarily unavailable. Please contact the club directly.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuestion('');
    setAnswer('');
    setEventsFound(null);
  };

  const exampleQuestions = [
    "My 8-year-old has never played volleyball before. What programs would be good for beginners?",
    "I have a 12-year-old who plays school volleyball. Are there competitive training options?",
    "What camps are available for kids during summer break?",
    "My daughter wants to try volleyball but is nervous about joining. Any suggestions?"
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bot className="h-6 w-6 text-blue-600" />
          AI Training Assistant
        </h2>
        <p className="text-muted-foreground">
          Ask our AI assistant about volleyball training options for your child
        </p>
      </div>

      {/* Question Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Ask Your Question
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAsk} className="space-y-4">
            <Textarea
              placeholder="Type your question here... (e.g., 'My 9-year-old wants to start playing volleyball. What programs do you recommend?')"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={4}
              className="min-h-[100px]"
            />
            
            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={loading || !question.trim()}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Thinking...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Ask Assistant
                  </>
                )}
              </Button>
              
              {(question || answer) && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClear}
                  disabled={loading}
                >
                  Clear
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Example Questions */}
      {!answer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Example Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {exampleQuestions.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setQuestion(example)}
                  disabled={loading}
                  className="text-left p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors w-full text-sm"
                >
                  "{example}"
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Response */}
      {answer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              AI Assistant Response
              {eventsFound !== null && (
                <Badge variant="secondary" className="ml-auto">
                  {eventsFound} training opportunities found
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-4">
              <div className="whitespace-pre-line text-sm leading-relaxed">
                {answer}
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">Need more help?</p>
              <p>
                Contact our club directly at{' '}
                <a href="mailto:info@volleyclubpro.com" className="text-blue-600 hover:underline">
                  info@volleyclubpro.com
                </a>
                {' '}or call us for personalized assistance.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium">How it works:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Ask any question about volleyball training for your child</li>
              <li>Our AI assistant analyzes current training programs and events</li>
              <li>Get personalized recommendations based on age, skill level, and interests</li>
              <li>Receive information about specific programs, schedules, and registration</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}