import { API_BASE_URL, GOOGLE_CLIENT_ID } from '@/constants';
import { useAuth } from '@/context/AuthContext';
import { useUser } from '@/context/UserContext';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import axios, { AxiosResponse } from 'axios';
import { useNavigate } from 'react-router-dom';

const GoogleAuth: React.FC = () => {
  const { login } = useAuth();
  const { setUser } = useUser();
  const navigate = useNavigate();

  const onSuccess = async (credentialResponse: any) => {
    await axios
      .post(`${API_BASE_URL}/auth/google`, {
        credential: credentialResponse.credential,
        client_id: credentialResponse.clientId,
      })
      .then((response: AxiosResponse) => {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        setUser(user);
        login();
        navigate('/dashboard');
      })
      .catch((error: any) => {
        console.error('Login error', error.response.data);
      });
  };

  const onFailure = () => {
    console.error('Login failed');
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <GoogleLogin onSuccess={onSuccess} onError={onFailure} />
    </GoogleOAuthProvider>
  );
};

export default GoogleAuth;
