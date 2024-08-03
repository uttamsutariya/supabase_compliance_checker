import ConnectSupabase from '@/components/internal/ConnectSupabase';
import OrganizationCompliance from '@/components/internal/OrganizationCompliance';
import Navbar from '@/components/internal/Navbar';
import { useUser } from '@/context/UserContext';

const Dashboard: React.FC = () => {
  const { user } = useUser();
  return (
    <div className="flex flex-col items-center min-h-screen py-2">
      <div className="w-[85%] text-center flex flex-col gap-10">
        <Navbar />
        <div className="flex justify-center">
          {!user?.supabaseConnected ? <ConnectSupabase /> : <OrganizationCompliance />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
