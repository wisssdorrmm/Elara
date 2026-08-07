-- Ellara seed data (optional, for local development only)
-- Replace :'seed_user_id' with a real auth.users.id from your Supabase project
-- (Authentication > Users) before running, e.g. via psql:
--   psql "$DATABASE_URL" -v seed_user_id="'00000000-0000-0000-0000-000000000000'" -f seed.sql

insert into public.profiles (
  user_id, full_name, date_of_birth, country, goal,
  average_cycle_length, average_period_length, cycle_is_regular,
  reminder_days_before, reminder_time, onboarding_completed
) values (
  :seed_user_id, 'Sarah Johnson', '2000-04-24', 'United States', 'track_periods',
  28, 5, true,
  '{10,7,5}', '08:00', true
)
on conflict (user_id) do nothing;

insert into public.periods (user_id, start_date, end_date, flow) values
  (:seed_user_id, '2024-04-03', '2024-04-07', 'medium'),
  (:seed_user_id, '2024-03-06', '2024-03-10', 'heavy'),
  (:seed_user_id, '2024-02-05', '2024-02-09', 'medium'),
  (:seed_user_id, '2024-01-08', '2024-01-12', 'light');

insert into public.logs (user_id, log_date, symptoms, mood, notes) values
  (:seed_user_id, '2024-04-04', '{"Cramps","Fatigue"}', 'Happy', 'Felt tired on Day 2.');
