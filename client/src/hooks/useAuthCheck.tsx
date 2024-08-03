import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '@/constants';
import axios from 'axios';
import { User, useUser } from '@/context/UserContext';

const useAuthCheck = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { setUser } = useUser();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/auth/secret`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        const user = response.data.session as User;

        if (user) {
          setUser(user);
          localStorage.setItem('user', JSON.stringify(user));
        }

        if (response.status === 401) {
          logout();
          navigate('/');
        }
      } catch (error) {
        console.error('Failed to verify token', error);
        logout();
        navigate('/');
      }
    };

    checkAuth();
  }, [logout, navigate]);
};

export default useAuthCheck;
