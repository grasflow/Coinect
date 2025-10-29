#!/usr/bin/env node

/**
 * Weryfikacja użytkownika testowego - sprawdź czy istnieje i czy można się zalogować
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.test'), override: true });

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEST_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD;

async function verifyUser() {
  try {
    console.log('🔍 Weryfikacja użytkownika testowego...');
    console.log(`📧 Email: ${TEST_EMAIL}`);
    console.log(`🔑 Password: ${TEST_PASSWORD}`);
    console.log(`🌐 URL: ${SUPABASE_URL}\n`);

    // 1. Sprawdź czy użytkownik istnieje w auth.users
    console.log('1️⃣ Sprawdzanie czy użytkownik istnieje...');
    const listResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });

    if (listResponse.ok) {
      const data = await listResponse.json();
      const user = data.users?.find(u => u.email === TEST_EMAIL);

      if (user) {
        console.log(`✅ Użytkownik istnieje!`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Email confirmed: ${user.email_confirmed_at ? 'TAK' : 'NIE'}`);
        console.log(`   Created: ${user.created_at}\n`);
      } else {
        console.log(`❌ Użytkownik ${TEST_EMAIL} NIE ISTNIEJE w bazie!\n`);
        return;
      }
    } else {
      console.log('⚠️  Nie można pobrać listy użytkowników (prawdopodobnie Service Role Key jest nieprawidłowy)\n');
    }

    // 2. Spróbuj zalogować przez Supabase Auth API
    console.log('2️⃣ Próba logowania przez Auth API...');
    const loginResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    const loginData = await loginResponse.json();

    if (loginResponse.ok) {
      console.log('✅ Logowanie przez Auth API UDANE!');
      console.log(`   Access token: ${loginData.access_token.substring(0, 30)}...`);
      console.log(`   User ID: ${loginData.user?.id}\n`);
    } else {
      console.log('❌ Logowanie przez Auth API NIEUDANE!');
      console.log(`   Status: ${loginResponse.status}`);
      console.log(`   Error: ${JSON.stringify(loginData, null, 2)}\n`);
    }

    // 3. Spróbuj zalogować przez aplikację (endpoint /api/auth/login)
    console.log('3️⃣ Próba logowania przez aplikację...');
    const appLoginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    const appLoginData = await appLoginResponse.text();

    if (appLoginResponse.ok) {
      console.log('✅ Logowanie przez aplikację UDANE!');
      console.log(`   Response: ${appLoginData.substring(0, 100)}...\n`);
    } else {
      console.log('❌ Logowanie przez aplikację NIEUDANE!');
      console.log(`   Status: ${appLoginResponse.status}`);
      console.log(`   Error: ${appLoginData}\n`);
    }

  } catch (error) {
    console.error('❌ Błąd:', error.message);
  }
}

verifyUser();
