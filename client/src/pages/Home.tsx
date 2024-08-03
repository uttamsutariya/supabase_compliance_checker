import GoogleAuth from '@/components/internal/GoogleAuth';
import Navbar from '@/components/internal/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center min-h-screen py-2">
      <div className="w-[70%] text-center flex flex-col gap-10">
        <Navbar />
        <div className="mt-8 flex flex-col items-center justify-center gap-8">
          <p className="text-center text-gray-600 text-2xl font-bold">
            Connect your Supabase account and <br /> Get compliance in a second!
          </p>
          <GoogleAuth />
        </div>
      </div>
    </div>
  );
};

export default Home;
