// Test script to verify login API and user credentials
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.test
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@test.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'Test123456';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

console.log('='.repeat(60));
console.log('TESTING LOGIN TO SUPABASE');
console.log('='.repeat(60));
console.log('Email:', TEST_USER_EMAIL);
console.log('Password:', TEST_USER_PASSWORD ? '***' + TEST_USER_PASSWORD.slice(-3) : 'NOT SET');
console.log('Supabase URL:', SUPABASE_URL);
console.log('Supabase Key:', SUPABASE_KEY ? SUPABASE_KEY.substring(0, 20) + '...' : 'NOT SET');
console.log('='.repeat(60));

async function testLogin() {
  try {
    console.log('\n1. Testing direct Supabase Auth API...');

    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
      },
      body: JSON.stringify({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);

    const data = await response.json();

    if (response.ok) {
      console.log('\n✅ LOGIN SUCCESSFUL!');
      console.log('User ID:', data.user?.id);
      console.log('User Email:', data.user?.email);
      console.log('Access token exists:', !!data.access_token);
    } else {
      console.log('\n❌ LOGIN FAILED!');
      console.log('Error:', JSON.stringify(data, null, 2));
    }

    console.log('\n2. Testing local API endpoint...');

    const localResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      }),
    });

    console.log('Local API status:', localResponse.status);
    const localData = await localResponse.json();

    if (localResponse.ok) {
      console.log('\n✅ LOCAL API LOGIN SUCCESSFUL!');
      console.log('Response:', JSON.stringify(localData, null, 2));
    } else {
      console.log('\n❌ LOCAL API LOGIN FAILED!');
      console.log('Error:', JSON.stringify(localData, null, 2));
    }

  } catch (error) {
    console.error('\n💥 ERROR:', error.message);
    console.error(error);
  }
}

testLogin();
