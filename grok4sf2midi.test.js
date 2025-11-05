// FILE: grok4sf2midi.test.js
import { grok4sf2midi } from './grok4sf2midi.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

describe('SoundFontParser', () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const testSf2Path = path.join(__dirname, 'test-data', 'example.sf2');
    const testMidiOutputPath = path.join(__dirname, 'test-data', 'output.mid');

    afterEach(() => {
        // Clean up generated MIDI file after each test
        if (fs.existsSync(testMidiOutputPath)) {
            fs.unlinkSync(testMidiOutputPath);
        }
    });

    test('should parse SoundFont and generate MIDI file', async () => {
        const result = await grok4sf2midi(testSf2Path, testMidiOutputPath);
        expect(result).toBe(true);
        expect(fs.existsSync(testMidiOutputPath)).toBe(true);
        const stats = fs.statSync(testMidiOutputPath);
        expect(stats.size).toBeGreaterThan(0); // Ensure file is not empty
    });

    test('should throw error for non-existent SoundFont file', async () => {
        await expect(grok4sf2midi('nonexistent.sf2', testMidiOutputPath))
            .rejects
            .toThrow('SoundFont file not found');
    });
});