#!/usr/bin/env node

/**
 * Skrypt do tworzenia użytkownika testowego w Supabase Cloud
 * Używa Admin API z SERVICE_ROLE_KEY
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Załaduj zmienne z .env.test (nadpisz inne pliki .env)
config({ path: resolve(process.cwd(), '.env.test'), override: true });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEST_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !TEST_EMAIL || !TEST_PASSWORD) {
  console.error('❌ Brak wymaganych zmiennych środowiskowych w .env.test');
  console.error('Wymagane: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TEST_USER_EMAIL, TEST_USER_PASSWORD');
  process.exit(1);
}

async function createTestUser() {
  try {
    console.log('🔧 Tworzenie użytkownika testowego w Supabase Cloud...');
    console.log(`📧 Email: ${TEST_EMAIL}`);
    console.log(`🌐 URL: ${SUPABASE_URL}`);

    // Utwórz użytkownika przez Admin API
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true, // Auto-potwierdź email
        user_metadata: {
          full_name: 'Test User',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();

      // Jeśli użytkownik już istnieje, to OK
      if (response.status === 422 || error.includes('already registered')) {
        console.log('⚠️  Użytkownik już istnieje');

        // Sprawdź czy możemy się zalogować
        await verifyLogin();
        return;
      }

      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const data = await response.json();
    console.log('✅ Użytkownik utworzony pomyślnie!');
    console.log(`👤 ID: ${data.user?.id}`);

    // Weryfikuj że możemy się zalogować
    await verifyLogin();

  } catch (error) {
    console.error('❌ Błąd podczas tworzenia użytkownika:', error.message);
    process.exit(1);
  }
}

async function verifyLogin() {
  try {
    console.log('\n🔐 Weryfikacja logowania...');

    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Login failed: ${error}`);
    }

    const data = await response.json();
    console.log('✅ Logowanie działa poprawnie!');
    console.log(`🎟️  Access token: ${data.access_token.substring(0, 20)}...`);

  } catch (error) {
    console.error('❌ Nie można zalogować użytkownika testowego:', error.message);
    process.exit(1);
  }
}

createTestUser();
