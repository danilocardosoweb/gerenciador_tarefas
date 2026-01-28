
import { GoogleGenAI } from "@google/genai";
import { Task } from "../types";

/**
 * Performs a bottleneck analysis on the task list using Gemini AI.
 * Uses gemini-3-pro-preview for complex industrial reasoning and performance insights.
 */
export const getBottleneckAnalysis = async (tasks: Task[]) => {
  const prompt = `Analise a seguinte lista de atividades de uma indústria de extrusão de alumínio e identifique possíveis gargalos, setores sobrecarregados ou riscos de atraso iminente. Resuma em 3 parágrafos curtos. Atividades: ${JSON.stringify(tasks)}`;

  // Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "Você é um consultor especialista em gestão de produção industrial (Lean Manufacturing e PCP). Sua linguagem deve ser profissional, direta e voltada para resultados.",
      }
    });
    // Accessing .text property as per guidelines
    return response.text || "Não foi possível gerar a análise no momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao processar análise inteligente.";
  }
};
