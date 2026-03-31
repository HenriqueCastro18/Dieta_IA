import Groq from "groq-sdk";
import { Exercise, UserData } from "./groq";

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const groq = new Groq({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true 
});

export const WorkoutAnalysisService = {

  async getSubstitutes(exercise: Exercise, user: UserData): Promise<Record<string, Exercise[]>> {
    if (!API_KEY) throw new Error("VITE_GROQ_API_KEY não configurada.");

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `Você é o Módulo de Inteligência Biomecânica CORE V4.
            Sua missão é gerar um CATÁLOGO DE RESERVAS para o grupo muscular: ${exercise.group}.

            DIRETRIZES DE ENGENHARIA:
            1. CATEGORIZAÇÃO: Identifique as subdivisões anatômicas do grupo ${exercise.group}. 
               (Ex: Se Peito: gerar para Superior, Médio e Inferior. Se Tríceps: Cabeça Longa, Lateral, etc).
            2. DENSIDADE: Gere EXATAMENTE 3 exercícios para CADA subdivisão identificada.
            3. FIDELIDADE: Mantenha o nível "${user.level}" e respeite as limitações: "${user.limitations || 'Nenhuma'}".
            4. ESTRUTURA: Cada exercício deve ter: name, sets, reps, rest, analysis (max 12 palavras).

            RESPOSTA OBRIGATÓRIA EM JSON NESTE FORMATO:
            {
              "Subgrupo A (ex: Peito Superior)": [ {Exercise}, {Exercise}, {Exercise} ],
              "Subgrupo B (ex: Peito Médio)": [ {Exercise}, {Exercise}, {Exercise} ]
            }`
          },
          {
            role: "user",
            content: `Gere a reserva biomecânica completa para substituir ${exercise.name} no treino de ${exercise.group}.`
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.1, 
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0]?.message?.content || "{}";
      const parsedData = JSON.parse(content);


      const normalizedPool: Record<string, Exercise[]> = {};

      Object.keys(parsedData).forEach(subgroup => {
        normalizedPool[subgroup] = parsedData[subgroup].map((ex: any) => ({
          name: ex.name,
          group: exercise.group,
          sets: ex.sets || exercise.sets,
          reps: ex.reps || exercise.reps,
          rest: ex.rest || exercise.rest,
          analysis: ex.analysis || "Equivalência motora confirmada."
        }));
      });

      return normalizedPool;

    } catch (error) {
      console.error("FALHA NA ENGINE V4:", error);
      return {};
    }
  }
};