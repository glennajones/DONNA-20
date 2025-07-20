-- Insert sample coach data for testing the Coach Matching & Outreach module

INSERT INTO coaches (name, email, phone, specialties, availability_windows, past_event_ratings, preferred_channel, location, hourly_rate, status) VALUES
('Morgan Jones', 'morgan.jones@email.com', '555-0123', ARRAY['Serving', 'Defense', 'Court Management'], '[]'::json, ARRAY[4, 5, 4, 5], 'email', 'Downtown', 35.00, 'active'),
('Sarah Williams', 'sarah.williams@email.com', '555-0124', ARRAY['Attacking', 'Setting', 'Team Strategy'], '[]'::json, ARRAY[5, 4, 5, 4, 5], 'email', 'North Side', 40.00, 'active'),
('Mike Rodriguez', 'mike.rodriguez@email.com', '555-0125', ARRAY['Blocking', 'Defense', 'Youth Development'], '[]'::json, ARRAY[4, 4, 5], 'sms', 'West End', 30.00, 'active'),
('Jennifer Liu', 'jennifer.liu@email.com', '555-0126', ARRAY['Setting', 'Court Management', 'Mental Training'], '[]'::json, ARRAY[5, 5, 4], 'email', 'East Side', 45.00, 'active'),
('David Thompson', 'david.thompson@email.com', '555-0127', ARRAY['Serving', 'Attacking', 'Game Strategy'], '[]'::json, ARRAY[4, 5, 4], 'email', 'Downtown', 38.00, 'inactive'),
('Lisa Chen', 'lisa.chen@email.com', '555-0128', ARRAY['Defense', 'Youth Development', 'Fitness Training'], '[]'::json, ARRAY[4, 4, 4, 5], 'sms', 'South Bay', 32.00, 'active');

-- Insert a few sample outreach logs for demonstration
INSERT INTO schedule_events (title, court, date, time, duration, event_type, participants, coach, description, status, created_by) VALUES
('Summer Training Camp', 'Court 1', '2025-07-25', '10:00', 180, 'training', ARRAY['Player 1', 'Player 2', 'Player 3'], NULL, 'Intensive summer training session', 'scheduled', 1);

-- Get the event ID and create sample outreach logs
WITH event_data AS (
  SELECT id FROM schedule_events WHERE title = 'Summer Training Camp' LIMIT 1
)
INSERT INTO coach_outreach_logs (event_id, coach_id, attempt_number, channel, message_id, response, response_details, reminders_sent)
SELECT 
  event_data.id,
  1,
  1,
  'email',
  'init-1721234567-1',
  NULL,
  NULL,
  0
FROM event_data
UNION ALL
SELECT 
  event_data.id,
  2,
  1,
  'email', 
  'init-1721234567-2',
  'accept',
  'Available and excited to help!',
  0
FROM event_data
UNION ALL
SELECT 
  event_data.id,
  3,
  1,
  'sms',
  'init-1721234567-3',
  'decline',
  'Not available that weekend',
  1
FROM event_data;