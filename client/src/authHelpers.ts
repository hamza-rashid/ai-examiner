import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
  } from "firebase/auth";
  import { auth } from "./firebase";
  
  export const register = (email: string, password: string) =>
    createUserWithEmailAndPassword(auth, email, password);
  
  export const login = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password);
  
  export const logout = () => signOut(auth);
  
  export const onAuthChange = (cb: (user: any) => void) =>
    onAuthStateChanged(auth, cb);
  