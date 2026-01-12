
// Mock implementation of Firebase Auth
export interface User {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
}

const STORAGE_KEY = 'meu_contador_auth_user';

export const auth = {
  currentUser: null as User | null,
};

// Initialize auth state from localStorage
const storedUser = localStorage.getItem(STORAGE_KEY);
if (storedUser) {
  auth.currentUser = JSON.parse(storedUser);
}

export const onAuthStateChanged = (
  authObj: any,
  callback: (user: User | null) => void
) => {
  // Call immediately with current state
  callback(auth.currentUser);

  // Return unsubscribe function (mock)
  return () => {};
};

export const signInWithEmailAndPassword = async (authObj: any, email: string, password?: string) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const user: User = {
    uid: 'mock-user-123',
    email: email,
    displayName: email.split('@')[0],
  };

  auth.currentUser = user;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  
  // Trigger auth state change would happen here effectively in a real app, 
  // but since we are mocking, the component re-render will likely handle reading the user if we structured it right,
  // or we rely on the direct return.
  
  return { user };
};

export const createUserWithEmailAndPassword = async (authObj: any, email: string, password: string) => {
  return signInWithEmailAndPassword(authObj, email, password);
};

export const signInWithPopup = async (authObj: any, provider: any) => {
   // Simulate network delay
   await new Promise(resolve => setTimeout(resolve, 800));

   const user: User = {
    uid: 'mock-google-user-123',
    email: 'usuario@exemplo.com',
    displayName: 'Usuário Google Mock',
    photoURL: 'https://ui-avatars.com/api/?name=User+Google',
  };

  auth.currentUser = user;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

  return { user };
};

export const signOut = async (authObj: any) => {
   // Simulate network delay
   await new Promise(resolve => setTimeout(resolve, 300));
   
   auth.currentUser = null;
   localStorage.removeItem(STORAGE_KEY);
};

export const googleProvider = {};
