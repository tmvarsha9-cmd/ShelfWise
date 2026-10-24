// server/test-gemini.mjs
import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenAI } from '@google/genai';

async function testKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY is missing from environment variables.');
    return;
  }

  console.log('🔑 Initializing GoogleGenAI client...');
  const ai = new GoogleGenAI({ apiKey });

  try {
    console.log('🚀 Sending test prompt to gemini-2.5-flash...');
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: 'Respond with the exact text: "Gemini API is working successfully!"',
    });

    console.log('✅ Success! Response text:');
    console.log(response.text?.trim());
  } catch (error) {
    console.error('❌ API Call Failed:', error);
  }
}

testKey();