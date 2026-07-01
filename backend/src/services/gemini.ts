// import { GoogleGenAI } from '@google/genai';
// import dotenv from 'dotenv';

// dotenv.config();

// if (!process.env.GEMINI_API_KEY) {
//   throw new Error("Missing GEMINI_API_KEY in environment variables.");
// }

// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// export async function askRaceEngineer(userPrompt: string) {
//   const systemInstruction = `
//     You are an expert Formula 1 Race Engineer. Your job is to answer fans' questions and explain complex data to complete beginners.
//     Be highly technical but use intuitive analogies so beginners understand concepts like DRS, aerodynamics, downforce, and tire degradation.
//     Keep your tone professional, crisp, and analytical—just like a real pit wall radio transmission.
//   `;

//   try {
//     const response = await ai.models.generateContent({
//       model: 'gemini-2.5-flash',
//       contents: userPrompt,
//       config: {
//         systemInstruction: systemInstruction,
//         temperature: 0.7,
//       }
//     });

//     return response.text;
//   } catch (error) {
//     console.error("Gemini API Error:", error);
//     throw new Error("Failed to communicate with your AI Race Engineer.");
//   }
// }

import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 1. Added the optional raceContext parameter here
export async function askRaceEngineer(userPrompt: string, raceContext?: Record<string, any>) {
  const systemInstruction = `
    You are an expert Formula 1 Race Engineer. Your job is to answer fans' questions and explain complex data to complete beginners.
    Be highly technical but use intuitive analogies so beginners understand concepts like DRS, aerodynamics, downforce, and tire degradation.
    Keep your tone professional, crisp, and analytical—just like a real pit wall radio transmission.
  `;

  // 2. Wrap the user's prompt with the injected data if it exists
  let fullPrompt = userPrompt;
  if (raceContext && Object.keys(raceContext).length > 0) {
    fullPrompt = `
[SYSTEM: INJECTED RACE CONTEXT]
${JSON.stringify(raceContext, null, 2)}
[/SYSTEM: INJECTED RACE CONTEXT]

User Query: ${userPrompt}
`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt, // 3. Pass the newly combined fullPrompt here
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to communicate with your AI Race Engineer.");
  }
}