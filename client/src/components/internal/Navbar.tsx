import { useAuth } from '@/context/AuthContext';
import { Button } from '../ui/button';
import { useUser } from '@/context/UserContext';

const Navbar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const { user } = useUser();

  return (
    <nav className="bg-white shadow-custom my-4 py-2 px-6 rounded-lg">
      <div>
        {isAuthenticated ? (
          <>
            <div className="flex justify-between">
              <h1 className="text-2xl font-bold text-gray-800">Delve.com</h1>
              <div className="flex items-center gap-2">
                {user && (
                  <div className="flex items-center">
                    <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                    <span className="ml-2 text-gray-800 text-sm">{user.name}</span>
                  </div>
                )}
                <Button onClick={logout} size={'sm'}>
                  Logout
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-center">
              <h1 className="text-2xl font-bold text-gray-800">Delve.com</h1>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
