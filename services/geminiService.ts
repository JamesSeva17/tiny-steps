
import { GoogleGenAI, Type } from "@google/genai";
import { ActivityEntry, ActivityType, AIInsight } from "../types";

export const getBabyInsights = async (
  entries: ActivityEntry[],
  activityTypes: ActivityType[]
): Promise<AIInsight | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    // Prepare simple data for AI context
    const enrichedData = entries.map(e => ({
      activity: activityTypes.find(t => t.id === e.typeId)?.name || 'Unknown',
      time: new Date(e.timestamp).toLocaleString(),
      value: e.value,
      note: e.note
    })).slice(-20); // Last 20 activities for context

    const prompt = `
      Analyze the following baby activity logs and provide a brief summary of the baby's patterns 
      and 2-3 helpful suggestions for the parents. Keep it supportive and medical-advice-free.
      
      Logs: ${JSON.stringify(enrichedData)}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["summary", "suggestions"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error fetching AI insights:", error);
    return null;
  }
};
