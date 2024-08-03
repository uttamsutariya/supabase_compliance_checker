import { useState } from 'react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useUser } from '@/context/UserContext';
import { useToast } from '../ui/use-toast';
import { ToastAction } from '../ui/toast';
import { API_BASE_URL } from '@/constants';
import axiosInstance from '@/axiosInstance';

const ConnectSupabase = () => {
  const [personalAccessToken, setPersonalAccessToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { setUser } = useUser();
  const { toast } = useToast();

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!personalAccessToken) {
      toast({ title: 'Please enter a personal access token', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    await axiosInstance
      .post(`${API_BASE_URL}/connectSupabase`, {
        personalAccessToken,
      })
      .then((response) => {
        const { session, message } = response.data;
        setUser(session);
        toast({ title: message });
      })
      .catch((error) => {
        const errMsg = error.response?.data?.message || error.message || 'Something went wrong';
        toast({
          variant: 'destructive',
          title: errMsg,
          action: (
            <ToastAction altText="Try again" onClick={() => setOpen(true)}>
              Try again
            </ToastAction>
          ),
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        setPersonalAccessToken('');
      }}
    >
      <DialogTrigger asChild>
        <Button>Connect your supabase account</Button>
      </DialogTrigger>
      <DialogContent onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Connect your supabase account</DialogTitle>
          <DialogDescription>
            Please provide your supabase access token to connect your account.
            <br />
            <a
              className="text-blue-600 underline"
              href="https://supabase.com/dashboard/account/tokens"
              target="_blank"
              rel="noreferrer"
            >
              You can find or create it from here
            </a>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col my-2">
          <div className="flex flex-col items-start gap-1">
            <Label htmlFor="name" className="text-left text-md">
              Access Token
            </Label>
            <Input
              id="name"
              value={personalAccessToken}
              onChange={(e) => setPersonalAccessToken(e.target.value)}
              placeholder="sbp_af29••••••••••••••••••••••••••••••••4fce"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <DialogClose asChild>
            <Button disabled={isLoading} type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Connecting...' : 'Connect'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectSupabase;
