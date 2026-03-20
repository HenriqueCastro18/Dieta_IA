const DB_KEY = "@dietafacil:users";
const HISTORY_KEY = "@dietafacil:history";
const WATER_KEY = "@dietafacil:water"; 

const formatKey = (dateStr: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;
  return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
};

export const DBLite = {
  // --- GESTÃO DE USUÁRIOS & PERFIL ---
  getUsers: () => {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveUser: (newUser: any) => {
    const users = DBLite.getUsers();
    const index = users.findIndex((u: any) => u.email === newUser.email);
    
    const userWithId = { 
      ...newUser, 
      id: newUser.id || Date.now().toString(),
      // Inicializa histórico de peso se não existir
      weightHistory: newUser.weightHistory || (newUser.weight ? [{ date: new Date().toISOString(), weight: Number(newUser.weight) }] : [])
    };

    if (index !== -1) {
      users[index] = userWithId;
    } else {
      users.push(userWithId);
    }

    localStorage.setItem(DB_KEY, JSON.stringify(users));
    return userWithId;
  },

  validateLogin: (credentials: any) => {
    const users = DBLite.getUsers();
    const user = users.find(
      (u: any) => u.email === credentials.email && u.password === credentials.password
    );
    if (!user) throw new Error("E-mail ou senha incorretos.");
    return user;
  },

  // --- GESTÃO DE PESO (NOVO) ---
  updateUserWeight: (userId: string, newWeight: number) => {
    const users = DBLite.getUsers();
    const userIndex = users.findIndex((u: any) => u.id === userId);
    
    if (userIndex !== -1) {
      const user = users[userIndex];
      const weightEntry = { date: new Date().toISOString(), weight: Number(newWeight) };
      
      user.weight = Number(newWeight);
      user.weightHistory = [...(user.weightHistory || []), weightEntry];
      
      users[userIndex] = user;
      localStorage.setItem(DB_KEY, JSON.stringify(users));
      return user;
    }
    return null;
  },

  // --- GESTÃO DE HISTÓRICO UNIFICADO ---
  getHistory: () => {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  },

  saveMeal: (meal: any) => {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      const history = data ? JSON.parse(data) : {};
      const dateKey = formatKey(meal.date);

      if (!history[dateKey]) history[dateKey] = [];

      const newEntry = {
        ...JSON.parse(JSON.stringify(meal)),
        date: dateKey,
        id: `meal-${Date.now()}`
      };

      history[dateKey].push(newEntry);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      return true;
    } catch (error) {
      console.error("Erro ao salvar refeição:", error);
      return false;
    }
  },

  // --- LÓGICA DE PERFORMANCE (CORREÇÃO DE 0%) ---
  getConsistencyScore: (userId: string, mode: 'week' | 'month', offset: number) => {
    try {
      const history = DBLite.getHistory();
      let activeDays = 0;
      let totalDaysInPeriod = mode === 'week' ? 7 : 30;
      
      const targetDate = new Date();
      if (mode === 'month') targetDate.setMonth(targetDate.getMonth() - offset);
      else targetDate.setDate(targetDate.getDate() - (offset * 7));

      for (let i = 0; i < totalDaysInPeriod; i++) {
        const checkDate = new Date(targetDate);
        checkDate.setDate(checkDate.getDate() - i);
        const dateKey = checkDate.toLocaleDateString('pt-BR');
        
        // Verifica se existem REFEIÇÕES (não apenas água) para o usuário neste dia
        const hasMeal = history[dateKey]?.some((e: any) => e.userId === userId && e.type !== 'water');
        if (hasMeal) activeDays++;
      }

      // Se não houve atividade, retorna 0 fixo (Resolve o problema das imagens)
      if (activeDays === 0) return 0;

      return Math.round((activeDays / totalDaysInPeriod) * 100);
    } catch (error) {
      return 0;
    }
  },

  // --- GESTÃO DE HIDRATAÇÃO ---
  saveWaterIntake: (dateStr: string, userId: string, amount: number) => {
    try {
      const dateKey = formatKey(dateStr);
      const waterData = localStorage.getItem(WATER_KEY);
      const waterHistory = waterData ? JSON.parse(waterData) : {};
      const storageKey = `${userId}_${dateKey}`;

      waterHistory[storageKey] = {
        amount: Number(amount),
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(WATER_KEY, JSON.stringify(waterHistory));

      const historyData = localStorage.getItem(HISTORY_KEY);
      const history = historyData ? JSON.parse(historyData) : {};
      if (!history[dateKey]) history[dateKey] = [];

      history[dateKey] = history[dateKey].filter(
        (entry: any) => !(entry.type === 'water' && entry.userId === userId)
      );

      history[dateKey].push({
        id: `water-${userId}-${Date.now()}`,
        type: 'water',
        userId: userId,
        amount: Number(amount),
        date: dateKey,
        timestamp: Date.now()
      });

      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      return true;
    } catch (error) {
      return false;
    }
  },

  getWaterHistory: (dateStr: string, userId: string) => {
    try {
      const dateKey = formatKey(dateStr);
      const storageKey = `${userId}_${dateKey}`;
      const data = localStorage.getItem(WATER_KEY);
      if (data) {
        const waterHistory = JSON.parse(data);
        if (waterHistory[storageKey]) return waterHistory[storageKey];
      }
      return { amount: 0 };
    } catch (error) {
      return { amount: 0 };
    }
  }
};