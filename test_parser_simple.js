/**
 * Gemini API Diagnostic Script
 * 
 * Step 1: Lists all available models for the API key/project
 * Step 2: Tests the timetable PDF parsing with the first working model
 *
 * If you switch API keys or projects, run this script first to verify
 * which models are available before updating processTimetable.js
 */

require('dotenv').config({ path: '.env.local' });
const apiKey = process.env.GEMINI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

if (!apiKey) {
    console.error('[ERROR] GEMINI_API_KEY is not set in .env.local');
    process.exit(1);
}
console.log('[INFO] Using GEMINI_API_KEY:', apiKey.slice(0, 10) + '...');

// ── Step 1: List all available models ──────────────────────────────────────
async function listAvailableModels() {
    console.log('\n[STEP 1] Fetching list of available Gemini models...');
    const url = `${BASE_URL}/models?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
        console.error('[ERROR] Failed to list models. Status:', response.status);
        console.error('[ERROR] Response:', JSON.stringify(data, null, 2));
        return [];
    }

    const models = (data.models || []).map(m => m.name);
    console.log(`[OK] Found ${models.length} models:`);
    models.forEach(m => console.log('  -', m));
    return models;
}

// ── Step 2: Test generation with a given model ─────────────────────────────
async function testGenerate(modelName) {
    console.log(`\n[STEP 2] Testing generateContent with model: ${modelName}`);
    const url = `${BASE_URL}/${modelName}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Say "WORKING" in one word.' }] }],
            generationConfig: { responseMimeType: 'text/plain' }
        })
    });

    const data = await response.json();
    if (!response.ok) {
        console.error(`[FAIL] Model ${modelName} returned ${response.status}:`, data?.error?.message);
        return false;
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '(no text)';
    console.log(`[OK] Model responded: "${text.trim()}"`);
    return true;
}

// ── Main ────────────────────────────────────────────────────────────────────
(async () => {
    const models = await listAvailableModels();

    // Filter to only models that support generateContent
    const flashModels = models.filter(m => m.includes('flash') || m.includes('pro'));
    if (flashModels.length === 0) {
        console.error('[ERROR] No flash/pro models found. Check your API key and project settings.');
        return;
    }

    // Test the first available model
    const firstModel = flashModels[0];
    const worked = await testGenerate(firstModel);

    if (worked) {
        console.log(`\n[ACTION NEEDED] Update processTimetable.js "modelsToTry" to use: "${firstModel}"`);
    } else {
        console.log('\n[ACTION NEEDED] No models responded. Verify that "Generative Language API" is enabled');
        console.log('  -> https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com');
    }
})();
