import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { auth } from "./firebase"; 

export const AuthService = {

  async register(email: string, pass: string, name: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(userCredential.user, { displayName: name });
    return userCredential.user;
  },


  async login(email: string, pass: string) {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    return userCredential.user;
  },


  async logout() {
    await signOut(auth);
  },

  onUserChanged(callback: (user: any) => void) {
    return onAuthStateChanged(auth, (user) => {
      if (user) {

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