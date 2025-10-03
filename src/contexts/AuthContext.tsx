import { createContext, useContext, useState } from 'react';

type AuthContextType = {
  role: 'interviewer' | 'interviewee' | null;
  candidateId: string | null;
  login: (role: 'interviewer' | 'interviewee', id?: string) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<'interviewer' | 'interviewee' | null>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);

  const login = (newRole: 'interviewer' | 'interviewee', id?: string) => {
    setRole(newRole);
    setCandidateId(id || null);
  };

  const logout = () => {
    setRole(null);
    setCandidateId(null);
  };

  return (
    <AuthContext.Provider value={{ role, candidateId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}