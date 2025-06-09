import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
  } from "firebase/auth";
  import { auth } from "./firebase";
  
  export const register = async (email: string, password: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // Link any anonymous papers after successful registration
    const token = await result.user.getIdToken();
    await fetch("https://ai-examiner-79zf.onrender.com/link-anonymous-papers", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    return result;
  };
  
  export const login = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    // Link any anonymous papers after successful login
    const token = await result.user.getIdToken();
    await fetch("https://ai-examiner-79zf.onrender.com/link-anonymous-papers", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    return result;
  };
  
  export const logout = () => signOut(auth);
  
  export const onAuthChange = (cb: (user: any) => void) =>
    onAuthStateChanged(auth, cb);
  