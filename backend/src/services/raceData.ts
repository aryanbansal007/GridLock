// import fs from 'fs/promises';
// import path from 'path';

// // Helper to resolve the path to our JSON file
// const dataPath = path.join(__dirname, '../data/races.json');

// export const getRaceContextById = async (raceId: string): Promise<Record<string, any> | null> => {
//     try {
//         const fileContent = await fs.readFile(dataPath, 'utf-8');
//         const races = JSON.parse(fileContent);
        
//         // Return the specific race or null if it doesn't exist
//         return races[raceId] || null;
//     } catch (error) {
//         console.error(`Error reading race data:`, error);
//         return null;
//     }
// };

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Reconstruct __dirname in ES Module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Now path.join works perfectly
const dataPath = path.join(__dirname, '../data/races.json');

export const getRaceContextById = async (raceId: string): Promise<Record<string, any> | null> => {
    try {
        const fileContent = await fs.readFile(dataPath, 'utf-8');
        const races = JSON.parse(fileContent);
        
        return races[raceId] || null;
    } catch (error) {
        console.error(`Error reading race data:`, error);
        return null;
    }
};