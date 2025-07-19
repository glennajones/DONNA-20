-- Insert sample podcast episodes with correct user ID (13)
INSERT INTO podcast_episodes (title, description, audio_url, duration, status, published_at, created_by) VALUES 
('Welcome to VolleyClub Podcast', 'Our inaugural episode introducing the VolleyClub Pro podcast! Learn about what we have planned and meet your hosts.', 'https://example.com/audio/episode1.mp3', '25:30', 'published', NOW() - INTERVAL '7 days', 13),
('Summer Training Tips', 'Coach Sarah shares her top 10 training tips for the summer season. Perfect for players of all levels looking to improve their game.', 'https://example.com/audio/episode2.mp3', '42:15', 'published', NOW() - INTERVAL '3 days', 13),
('Volleyball Nutrition Guide', 'Sports nutritionist Dr. Mike discusses optimal nutrition strategies for volleyball athletes, including pre-game meals and hydration tips.', 'https://example.com/audio/episode3.mp3', '38:45', 'published', NOW() - INTERVAL '1 day', 13),
('Mental Game Strategies', 'Coming soon: Learn how to develop mental toughness and overcome performance anxiety on the court.', NULL, '35:00', 'draft', NULL, 13);
