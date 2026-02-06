
import { GoogleGenAI } from "@google/genai";
import { TechnicalAnalysis } from "../types";

export const getAIAnalysis = async (analysis: TechnicalAnalysis): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // กรองเอาเฉพาะข้อมูลสำคัญจริงๆ เพื่อลด Token
  const trend = analysis.indicators.find(i => i.name.includes('EMA'))?.trend || 'Neutral';
  const support = analysis.levels.filter(l => l.type === 'Support')[0]?.level || 'N/A';
  const resistance = analysis.levels.filter(l => l.type === 'Resistance')[0]?.level || 'N/A';

  const prompt = `
    Analyze ${analysis.symbol} (${analysis.timeframe})
    Price: $${analysis.price}
    Trend: ${trend}
    S/R: ${support} / ${resistance}
    สรุปสั้นๆ ภาษาไทย: แนวโน้ม, กลยุทธ์เข้าเทรด
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "คุณคือ Pro Trader วิเคราะห์กราฟสั้นๆ แม่นยำ ไม่เยิ่นเย้อ",
        temperature: 0.1,
      }
    });

    return response.text || "ไม่มีข้อมูลวิเคราะห์";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // ตรวจสอบ Error 429 จากทุกช่องทางที่อาจเกิดขึ้นได้
    const errorString = JSON.stringify(error);
    const isQuotaExceeded = 
      error?.status === 429 || 
      error?.code === 429 ||
      errorString.includes('429') || 
      errorString.includes('RESOURCE_EXHAUSTED') ||
      errorString.includes('quota');

    if (isQuotaExceeded) {
      throw new Error("QUOTA_EXHAUSTED");
    }
    
    throw new Error(error?.message || "ระบบขัดข้อง");
  }
};
