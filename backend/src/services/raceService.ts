import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define core paths
const SCRIPT_DIR = path.join(__dirname, '../../../data_scripts');
const SCRIPT_PATH = path.join(SCRIPT_DIR, 'full_race_generator.py');
const CACHE_DIR = path.join(__dirname, '../cache'); 

// Fallback to your specific path if env var isn't set
const PYTHON_BIN = process.env.PYTHON_BIN || "/Users/heisenberg/Desktop/GridLock/data_scripts/venv/bin/python";

export const checkCache = (year: string, gp: string, session: string): string | null => {
    const safeGpName = gp.toLowerCase().replace(/ /g, "_");
    const safeSession = session.toLowerCase();
    const targetFilePath = path.join(CACHE_DIR, year, safeGpName, safeSession, 'data.json');

    if (fs.existsSync(targetFilePath)) {
        return targetFilePath;
    }
    return null;
};

export const runPythonGenerator = (year: string, gp: string, session: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const command = `"${PYTHON_BIN}" "${SCRIPT_PATH}" --year ${year} --gp "${gp}" --session ${session}`;
        
        console.log(`⏳ Executing: ${command}`);

        exec(command, { cwd: SCRIPT_DIR }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error generating telemetry: ${error.message}`);
                console.error(`stderr: ${stderr}`);
                return reject(error);
            }
            console.log(`Python Output: ${stdout}`);
            resolve(stdout);
        });
    });
};

export const getAvailableRaces = () => {
    const races: any[] = [];
    if (!fs.existsSync(CACHE_DIR)) return races;

    const years = fs.readdirSync(CACHE_DIR);
    years.forEach(year => {
        const yearPath = path.join(CACHE_DIR, year);
        if (fs.statSync(yearPath).isDirectory()) {
            const gps = fs.readdirSync(yearPath);
            gps.forEach(gp => {
                const gpPath = path.join(yearPath, gp);
                if (fs.statSync(gpPath).isDirectory()) {
                    const sessions = fs.readdirSync(gpPath);
                    sessions.forEach(session => {
                        const dataPath = path.join(gpPath, session, 'data.json');
                        if (fs.existsSync(dataPath)) {
                            races.push({ year, gp, session });
                        }
                    });
                }
            });
        }
    });
    return races;
};