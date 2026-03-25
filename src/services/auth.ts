import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { auth } from "./firebase"; // Importa a config que fizemos antes

export const AuthService = {
  // 1. Criar conta (Cadastro)
  async register(email: string, pass: string, name: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    // Atualiza o nome do usuário no Firebase logo após criar
    await updateProfile(userCredential.user, { displayName: name });
    return userCredential.user;
  },

  // 2. Login
  async login(email: string, pass: string) {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    return userCredential.user;
  },

  // 3. Logout
  async logout() {
    await signOut(auth);
  },

  // 4. Observador de estado (O coração do App.tsx)
  onUserChanged(callback: (user: any) => void) {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        // Retorna um objeto limpo para o seu estado do React
        callback({
          uid: user.uid,
          email: user.email,
          name: user.displayName,
        });
      } else {
        callback(null);
      }
    });
  }
};