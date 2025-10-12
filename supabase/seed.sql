-- seed data for local development

-- insert default test user in auth.users first
-- this will automatically trigger the creation of the profile via the trigger
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values (
  '4a36e7c5-ec7a-4ec2-9966-67e616e4feea',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Test User"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) on conflict (id) do nothing;

-- update the profile with additional data
update profiles
set
  full_name = 'Test User',
  tax_id = '1234567890',
  street = 'Test Street 123',
  city = 'Warszawa',
  postal_code = '00-001',
  country = 'Polska',
  email = 'test@example.com',
  phone = '+48 123 456 789',
  bank_account = '12 3456 7890 1234 5678 9012 3456',
  onboarding_completed = true,
  onboarding_step = 4
where id = '4a36e7c5-ec7a-4ec2-9966-67e616e4feea';

