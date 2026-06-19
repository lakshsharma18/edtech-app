import { jwtDecode } from 'jwt-decode';

interface TokenPayload {
  user_id: number;
  email: string;
  first_name: string;
  role: string;
  exp: number;
}

export const getAuthUser = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    // Check if token is expired
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
};
