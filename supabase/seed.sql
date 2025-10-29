-- Seed data dla środowiska testowego
-- Dodaj profil dla użytkownika testowego test@test.com

-- Najpierw sprawdź czy użytkownik istnieje
DO $$
DECLARE
  test_user_id uuid;
BEGIN
  -- Pobierz ID użytkownika testowego
  SELECT id INTO test_user_id
  FROM auth.users
  WHERE email = 'test@test.com'
  LIMIT 1;

  -- Jeśli użytkownik istnieje, utwórz dla niego profil
  IF test_user_id IS NOT NULL THEN
    INSERT INTO profiles (
      id,
      email,
      full_name,
      tax_id,
      street,
      city,
      postal_code,
      country,
      phone,
      bank_account,
      bank_name,
      bank_swift,
      accent_color,
      created_at,
      updated_at
    ) VALUES (
      test_user_id,
      'test@test.com',
      'Test User',
      '1234567890',
      'ul. Testowa 1',
      'Warszawa',
      '00-001',
      'Polska',
      '+48123456789',
      'PL12345678901234567890123456',
      'Bank Testowy SA',
      'TESTPLPW',
      '#2563eb',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      tax_id = EXCLUDED.tax_id,
      street = EXCLUDED.street,
      city = EXCLUDED.city,
      postal_code = EXCLUDED.postal_code,
      country = EXCLUDED.country,
      phone = EXCLUDED.phone,
      bank_account = EXCLUDED.bank_account,
      bank_name = EXCLUDED.bank_name,
      bank_swift = EXCLUDED.bank_swift,
      accent_color = EXCLUDED.accent_color,
      updated_at = NOW();

    RAISE NOTICE 'Profil dla test@test.com został utworzony/zaktualizowany';
  ELSE
    RAISE WARNING 'Użytkownik test@test.com nie istnieje w auth.users. Najpierw utwórz konto przez UI lub migrację.';
  END IF;
END $$;
