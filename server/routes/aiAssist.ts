import { Router } from 'express';
import OpenAI from 'openai';
import { storage } from '../storage';

const router = Router();

// Initialize OpenAI client
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

router.post('/', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required' });
    }

    if (!openai) {
      return res.status(500).json({ 
        error: 'AI service not configured. Please contact administration.' 
      });
    }

    // Get upcoming events from the database
    const now = new Date();
    const allEvents = await storage.getEvents();
    
    // Filter for upcoming training events
    const upcomingEvents = allEvents.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate >= now && ['Practice', 'Training', 'Camp', 'Team Camp'].includes(event.eventType || '');
    });

    // Get upcoming schedule events as well
    const scheduleEvents = await storage.getScheduleEvents();
    const upcomingSchedule = scheduleEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= now && ['training', 'practice', 'camp'].includes(event.eventType);
    });

    // Build context for AI
    const eventsList = upcomingEvents.map(event => 
      `Event: ${event.name}, Type: ${event.eventType}, Date: ${event.start_date}, Time: ${event.time || 'TBD'}, Location: ${event.location || 'TBD'}`
    ).join('\n');

    const scheduleList = upcomingSchedule.map(event => 
      `Training: ${event.title}, Type: ${event.eventType}, Date: ${event.date}, Time: ${event.time}, Court: ${event.court}`
    ).join('\n');

    const allTrainings = [eventsList, scheduleList].filter(list => list.length > 0).join('\n');

    const prompt = `
Parent question: "${question}"

Here are upcoming volleyball training opportunities:
${allTrainings}

Please respond as a helpful volleyball club assistant. Based on the parent's question:
1. Extract any relevant details (child's age, experience level, interests)
2. Suggest specific training events that would be appropriate
3. Keep the tone friendly and encouraging
4. If no specific trainings match, provide general guidance about getting started
5. Include event names and dates when making recommendations

If no training events are available, suggest they contact the club directly for more information.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are a helpful assistant for VolleyClub Pro, a youth volleyball club. You help parents find appropriate training programs for their children.' 
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const answer = completion.choices[0].message.content;

    // Log the interaction for review
    console.log(`AI Assistant Query: "${question}" -> Response length: ${answer?.length || 0} chars`);

    res.json({ 
      answer: answer || 'I apologize, but I was unable to generate a response. Please contact our club directly for assistance.',
      eventsFound: upcomingEvents.length + upcomingSchedule.length
    });

  } catch (error) {
    console.error('AI Assistant error:', error);
    res.status(500).json({ 
      error: 'Sorry, our AI assistant is temporarily unavailable. Please contact the club directly for assistance.' 
    });
  }
});

export default router;