import { auth, db } from './firebase';
import bcrypt from 'bcryptjs';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail 
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  arrayUnion,
  Timestamp,
  orderBy,
  limit,
  deleteDoc 
} from "firebase/firestore";


interface FailedAttemptResult {
  attempts: number;
  blocked: boolean;
}


const formatKey = (dateInput: any): string => {
  if (!dateInput) return new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  
  let dateStr = typeof dateInput === 'string' ? dateInput : new Date(dateInput).toLocaleDateString('pt-BR');
  
  if (dateStr.includes('-')) return dateStr;

  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr.replace(/\//g, '-');
  
  return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
};

export const DBService = {


  hashData: async (value: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(value, salt);
  },

  compareHash: async (value: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(value, hash);
  },

  checkAccountLockout: async (email: string): Promise<boolean> => {
    try {
      const emailKey = email.toLowerCase().trim();
      const lockoutRef = doc(db, "login_lockouts", emailKey);
      const snap = await getDoc(lockoutRef);

      if (snap.exists()) {
        const data = snap.data();
        const lockoutUntil = data.lockoutUntil;
        
        if (lockoutUntil && lockoutUntil.toDate() > new Date()) {
          const diff = lockoutUntil.toDate().getTime() - Date.now();
          const minutes = Math.ceil(diff / (1000 * 60));
          throw new Error(`BLOQUEADO|${minutes}`);
        }
      }
      return true;
    } catch (error: any) {
      if (error.message.includes("BLOQUEADO")) throw error;
      return true; 
    }
  },

  registerFailedAttempt: async (email: string): Promise<FailedAttemptResult> => {
    try {
      const emailKey = email.toLowerCase().trim();
      const lockoutRef = doc(db, "login_lockouts", emailKey);
      const snap = await getDoc(lockoutRef);
      
      let attempts = 1;
      if (snap.exists()) {
        attempts = (snap.data().count || 0) + 1;
      }

      const updateData: any = {
        count: attempts,
        lastAttempt: Timestamp.now(),
        email: emailKey,
        blocked: false
      };

      if (attempts >= 3) {
        const lockoutDate = new Date();
        lockoutDate.setMinutes(lockoutDate.getMinutes() + 15);
        updateData.lockoutUntil = Timestamp.fromDate(lockoutDate);
        updateData.blocked = true;
      }

      await setDoc(lockoutRef, updateData, { merge: true });
      return { attempts, blocked: !!updateData.blocked };
    } catch (e) {
      console.error("Erro ao registrar tentativa:", e);
      return { attempts: 0, blocked: false };
    }
  },

  resetLoginAttempts: async (email: string): Promise<void> => {
    try {
      const emailKey = email.toLowerCase().trim();
      await deleteDoc(doc(db, "login_lockouts", emailKey));
    } catch (e) {
      console.warn("Erro ao resetar tentativas:", e);
    }
  },


  sendPasswordReset: async (email: string): Promise<void> => {
    try {
      auth.languageCode = 'pt-br'; 
      await sendPasswordResetEmail(auth, email.toLowerCase().trim());
    } catch (error: any) {
      console.error("Erro ao enviar e-mail de recuperação:", error);
      throw error;
    }
  },

  login: async (credentials: any) => {
    const { email, password } = credentials;
    await DBService.checkAccountLockout(email);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      await DBService.resetLoginAttempts(email);
      const userSnap = await getDoc(doc(db, "users", uid));
      return userSnap.exists() ? { uid, ...userSnap.data() } : { uid, email };
    } catch (error: any) {
      const invalidCodes = ['auth/wrong-password', 'auth/user-not-found', 'auth/invalid-credential'];
      if (invalidCodes.includes(error.code)) {
        await DBService.registerFailedAttempt(email);
      }
      throw error;
    }
  },

  register: async (userData: any) => {
    const { email, password, name } = userData;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    const newUser = {
      uid,
      name,
      email: email.toLowerCase().trim(),
      weight: Number(userData.weight) || 80,
      goalWater: 3500,
      goalCalories: 2200,
      goalProtein: 160,
      goalCarbs: 250,
      goalFat: 70,
      consistency: 0,
      mfaEnabled: true,
      weightHistory: [{
        date: new Date().toISOString(),
        weight: Number(userData.weight || 80)
      }],
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "users", uid), newUser);
    return newUser;
  },

  logout: async () => await signOut(auth),



  getUserWorkout: async (uid: string) => {
    if (!uid) return null;
    try {
      const workoutRef = doc(db, "workouts", uid);
      const snap = await getDoc(workoutRef);
      return snap.exists() ? (snap.data() as any) : null;
    } catch (e) {
      console.error("Erro ao buscar treino:", e);
      return null;
    }
  },

  saveUserWorkout: async (uid: string, workoutData: any) => {
    if (!uid) return false;
    try {
      const workoutRef = doc(db, "workouts", uid);
      await setDoc(workoutRef, {
        ...workoutData,
        updatedAt: Timestamp.now()
      }, { merge: true });
      return true;
    } catch (e) {
      console.error("Erro ao salvar treino:", e);
      throw e;
    }
  },


  saveCustomFood: async (foodData: any) => {
    try {
      const foodId = `${foodData.searchKey}_${foodData.unitGroup}`;
      const foodRef = doc(db, "learned_foods", foodId);
      
      await setDoc(foodRef, {
        ...foodData,
        learnedAt: Timestamp.now()
      });
      return true;
    } catch (e) {
      console.error("Erro ao salvar alimento aprendido:", e);
      return false;
    }
  },

  findCustomFood: async (queryStr: string, unit: string) => {
    try {
      const searchKey = queryStr.toLowerCase().trim();
      const foodsRef = collection(db, "learned_foods");
      
      const q = query(
        foodsRef, 
        where("searchKey", "==", searchKey), 
        where("unitGroup", "==", unit)
      );
      
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data();
      }
      return null;
    } catch (e) {
      console.error("Erro ao buscar alimento aprendido:", e);
      return null;
    }
  },


  getUserData: async (uid: string) => {
    if (!uid) return null;
    try {
      const userSnap = await getDoc(doc(db, "users", uid));
      return userSnap.exists() ? { uid, ...userSnap.data() } : null;
    } catch (e) {
      console.error("Erro getUserData:", e);
      return null;
    }
  },

  updateProfile: async (userId: string, data: any) => {
    if (!userId) return false;
    const userRef = doc(db, "users", userId);
    const updateData: any = { ...data, lastUpdate: new Date().toISOString() };
    if (data.weight) {
      updateData.weight = Number(data.weight);
      updateData.weightHistory = arrayUnion({
        date: new Date().toISOString(),
        weight: Number(data.weight)
      });
    }
    await updateDoc(userRef, updateData);
    return true;
  },

  updateUserProfile: async (userId: string, data: any) => {
    return DBService.updateProfile(userId, data);
  },

  getMealsByDate: async (userId: string, dateStr: string) => {
    if (!userId) return [];
    try {
      const mealsRef = collection(db, "users", userId, "meals");
      const q = query(mealsRef, where("date", "==", dateStr));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Erro ao buscar refeições por data:", error);
      return [];
    }
  },

  saveMeal: async (userId: string, mealData: any) => {
    if (!userId) return false;
    try {
      const mealRef = doc(collection(db, "users", userId, "meals"));
      const timestamp = Date.now();
      
      const rawDate = mealData.date || new Date();
      const displayDate = typeof rawDate === 'string' ? rawDate : new Date(rawDate).toLocaleDateString('pt-BR');

      const fullMeal = { 
        ...mealData, 
        id: mealRef.id,
        timestamp,
        date: displayDate,
        createdAt: Timestamp.now(),
        calories: Number(mealData.calories || 0),
        protein: Number(mealData.protein || 0),
        carbs: Number(mealData.carbs || 0),
        fat: Number(mealData.fat || 0)
      };

      await setDoc(mealRef, fullMeal);

      const historyRef = doc(db, "users", userId, "history", `${mealRef.id}_meal`);
      await setDoc(historyRef, {
        type: 'meal',
        name: mealData.name || "Refeição",
        date: displayDate,
        timestamp,
        calories: Number(mealData.calories || 0)
      });

      await DBService.updateUserConsistency(userId);
      return true;
    } catch (error) {
      console.error("Erro ao salvar refeição:", error);
      throw error;
    }
  },

  saveWater: async (userId: string, amount: number, dateInput: any) => {
    if (!userId) return false;
    try {
      const dateKey = formatKey(dateInput);
      const displayDate = typeof dateInput === 'string' ? dateInput : new Date(dateInput).toLocaleDateString('pt-BR');

      const waterRef = doc(db, "users", userId, "water", dateKey);
      
      await setDoc(waterRef, {
        amount: Number(amount),
        date: displayDate,
        updatedAt: Timestamp.now()
      }, { merge: true });

      const historyRef = doc(db, "users", userId, "history", `${dateKey}_water`);
      await setDoc(historyRef, {
        type: 'water',
        amount: Number(amount),
        timestamp: Date.now(),
        date: displayDate
      });

      await DBService.updateUserConsistency(userId);
      return true;
    } catch (e) {
      console.error("Erro ao salvar água:", e);
      throw e;
    }
  },

  saveWaterIntake: async (userId: string, dateStr: any, amount: number) => {
    return DBService.saveWater(userId, amount, dateStr);
  },

  getWaterHistory: async (userId: string, dateStr: any) => {
    if (!userId) return { amount: 0 };
    const dateKey = formatKey(dateStr);
    const snap = await getDoc(doc(db, "users", userId, "water", dateKey));
    return snap.exists() ? snap.data() : { amount: 0 };
  },


  getConsistencyScore: async (userId: string, days: number = 30, offset: number = 0) => {
    if (!userId) return 0;
    try {
      const historyRef = collection(db, "users", userId, "history");
      const now = new Date();
      now.setHours(23, 59, 59, 999);
      
      const endTime = now.getTime() - (offset * days * 24 * 60 * 60 * 1000);
      const startTime = endTime - (days * 24 * 60 * 60 * 1000);
      
      const q = query(historyRef, where("timestamp", ">=", startTime), where("timestamp", "<=", endTime));
      const querySnapshot = await getDocs(q);
      
      const uniqueDays = new Set();
      querySnapshot.forEach(doc => {
        const d = doc.data();
        if (d && d.date) uniqueDays.add(d.date);
      });
      return Math.round((uniqueDays.size / days) * 100);
    } catch (e) {
      console.error("Erro Score:", e);
      return 0;
    }
  },

  updateUserConsistency: async (userId: string) => {
    if (!userId) return;
    const score = await DBService.getConsistencyScore(userId, 30, 0);
    await updateDoc(doc(db, "users", userId), { consistency: score });
  },

  getGlobalRanking: async () => {
    try {
      const q = query(collection(db, "users"), orderBy("consistency", "desc"), limit(10));
      const snap = await getDocs(q);
      return snap.docs
        .map(doc => {
          const data = doc.data();
          if (!data) return null;
          return {
            uid: doc.id,
            name: data.name || "Atleta",
            consistency: data.consistency || 0
          };
        })
        .filter(item => item !== null);
    } catch (err) {
      console.error("Erro ranking:", err);
      return [];
    }
  }
};