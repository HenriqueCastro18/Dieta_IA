import Groq from "groq-sdk";

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const groq = new Groq({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true 
});

export interface UserData {
    name: string;
    gender: string;
    weight: number;
    height: number;
    duration: number;
    isCustomDuration?: boolean;
    splitType: string;
    goal: string;
    level: string;
    frequency: number;
    offDays: number[];
    limitations: string;
    focusMuscles: string;
    chemicalCockpit?: any;
    recoverySpeed?: string;
    intensity?: string;
}

export interface Exercise {
    name: string;
    group: string;
    sets: number | string;
    reps: string;
    rest: string;
    notes?: string;
    analysis?: string;
    substitute?: string;
}

export interface WorkoutSplit {
    title: string;
    exercises: Exercise[];
}

export interface WeeklyPlan {
    [key: string]: WorkoutSplit | string | undefined;
    observations?: string;
}

export const GroqService = {
  async generateWorkout(userData: UserData): Promise<WeeklyPlan> {
    if (!API_KEY) throw new Error("VITE_GROQ_API_KEY não encontrada no .env.");

    console.log("🚀 [V8 ENGINE] Injetando Protocolo de Elite (Balanceado) para:", userData.name);

    const daysMap = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const offDaysNames = userData.offDays?.map(d => daysMap[d]).join(", ") || "Nenhum";

    const systemPrompt = `Você é o CORE Engine V8, treinador de Fisiculturismo de Elite (Mountain Dog / FST-7).
    O atleta pesa ${userData.weight}kg, tem ${userData.height}cm, e possui 90 MINUTOS de treino.
    
    REGRA DE OURO 1 - ESTRUTURA INQUEBRÁVEL DO TREINO:
    O atleta treina em um split ABC (Push/Pull/Legs). Você DEVE gerar EXATAMENTE esta quantidade de exercícios por sessão:
    - TREINO A (Push): EXATAMENTE 4 exercícios de Peito, EXATAMENTE 3 exercícios de Ombro, e EXATAMENTE 3 exercícios de Tríceps. Total: 10 exercícios.
    - TREINO B (Pull): EXATAMENTE 5 exercícios de Costas, EXATAMENTE 3 exercícios de Bíceps, e EXATAMENTE 1 exercício de Antebraço ou Trapézio. Total: 9 exercícios.
    - TREINO C (Legs): EXATAMENTE 4 exercícios de Quadríceps, EXATAMENTE 3 exercícios de Posterior de Coxa (Isquiotibiais), e EXATAMENTE 2 exercícios de Panturrilha. Total: 9 exercícios.

    REGRA DE OURO 2 - SELEÇÃO DE EXERCÍCIOS PESADOS:
    Use variações reais de academias completas. (Ex: Tríceps Testa, Elevação Lateral na Polia, Remada Serrote, Hack Squat).

    REGRA DE OURO 3 - BIOMECÂNICA: O campo 'analysis' deve ser uma justificativa técnica focada em hipertrofia.

    ESTRUTURA JSON (Responda APENAS com o JSON usando as chaves "A", "B", "C"):
    {
      "A": { 
        "title": "Treino A - Peito, Ombro e Tríceps", 
        "exercises": [
          { 
            "name": "NOME DO EXERCÍCIO", 
            "group": "MÚSCULO (Peito/Ombro/Tríceps...)", 
            "sets": "4", 
            "reps": "8-12 + Falha", 
            "rest": "90s", 
            "analysis": "Justificativa biomecânica.", 
            "notes": "Técnica: Rest-Pause, Drop-Set, etc.",
            "substitute": "Exercício reserva"
          }
        ] 
      }
    }`;

    const userPrompt = `ATLETA: ${userData.name}. 
    OBJETIVO: ${userData.goal}. 
    COCKPIT (Hormônios Ativos): ${userData.focusMuscles}. 
    DIVISÃO: ${userData.splitType}. 
    TEMPO DISPONÍVEL: ${userData.duration} minutos. 
    FOLGAS: ${offDaysNames}.
    LIMITAÇÕES: ${userData.limitations || 'Nenhuma'}.
    
    Gere o JSON respeitando ESTRITAMENTE a Regra de Ouro 1 (quantidade exata de exercícios para o músculo principal E sinergistas).`;

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.15, 
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0]?.message?.content || "{}";
      const parsedData = JSON.parse(content.trim());

      const workoutKeys = Object.keys(parsedData).filter(key => key !== "Descanso" && key !== "observations");
      if (workoutKeys.length === 0) throw new Error("A IA gerou um JSON vazio.");

      workoutKeys.forEach(key => {
        const section = parsedData[key];
        if (typeof section === 'object' && section.exercises) {
          const hasCardio = section.exercises.some((e: any) => e.name.toLowerCase().includes('cardio'));
          if (!hasCardio) {
            section.exercises.push({
              name: "Cardio V8 - Protocolo HIIT",
              group: "Cardiovascular",
              sets: 1,
              reps: "15-20 min",
              rest: "0s",
              analysis: "Aumento da biogênese mitocondrial e otimização do particionamento de nutrientes pós-treino.",
              notes: "Tiros de 1 minuto em alta intensidade seguidos de 2 minutos de caminhada.",
              substitute: "Escada Ergométrica"
            });
          }
        }
      });

      const jsonString = JSON.stringify(parsedData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `PROTOCOLO_V8_${userData.name.replace(/\s/g, '_').toUpperCase()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return parsedData as WeeklyPlan;

    } catch (error) {
      console.error("🔥 [V8 ENGINE] Erro Fatal:", error);
      throw new Error(error instanceof Error ? error.message : "Falha na geração do protocolo.");
    }
  }
};