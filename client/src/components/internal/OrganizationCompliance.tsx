import axiosInstance from '@/axiosInstance';
import { useEffect, useState } from 'react';
import { toast } from '../ui/use-toast';
import { ToastAction } from '../ui/toast';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/solid';

import { IOrganization } from '@/types';
import DetailedCompliance from './DetailedCompliance';

const OrganizationCompliance = () => {
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<IOrganization[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('');
  const [openDrawer, setOpenDrawer] = useState(false);
  const [selectedOrgData, setSelectedOrgData] = useState<IOrganization | null>(null);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/getCompliance');
        setOrganizations(res.data.organizations);
        setLastSyncedAt(res.data.updatedAt);
      } catch (error: any) {
        toast({
          title: error?.response?.data?.message || error?.message || 'Error fetching organizations',
          variant: 'destructive',
          action: (
            <ToastAction altText="Try again" onClick={fetchOrganizations}>
              Try again
            </ToastAction>
          ),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  const syncNow = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/syncCompliance');
      setOrganizations(res.data.organizations);
      setLastSyncedAt(res.data.updatedAt);
    } catch (error: any) {
      toast({
        title: error?.response?.data?.message || error?.message || 'Error syncing organizations',
        variant: 'destructive',
        action: (
          <ToastAction altText="Try again" onClick={syncNow}>
            Try again
          </ToastAction>
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-10 justify-center items-center">
      <div className="flex justify-between items-center gap-5">
        <Button onClick={syncNow} size={'sm'} disabled={loading}>
          Sync Now
        </Button>
        <Button variant={'outline'} disabled>
          Last synced at: {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : 'Few seconds ago'}
        </Button>
      </div>
      <div>
        <p className="text-lg font-bold">Compliance Details Of All Organizations</p>
      </div>
      <div className="flex flex-wrap gap-5">
        {loading ? (
          <div className="text-md font-semibold">Loading...</div>
        ) : (
          organizations.map((org) => (
            <Card className="w-[350px]" key={org._id}>
              <CardHeader className="flex justify-between items-start">
                <CardTitle>{org.name}</CardTitle>
                <CardDescription>{org._id}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 items-start">
                <div className="text-sm flex gap-2 flex-row-reverse">
                  <span className="">MFA Enabled For All Users:</span>{' '}
                  {!org.mfaEnabledForAllUsers ? (
                    <XMarkIcon className="size-5 text-red-500" />
                  ) : (
                    <CheckIcon className="size-5 text-green-500" />
                  )}
                </div>
                <div className="text-sm flex gap-2 flex-row-reverse">
                  <span className="">RLS Enabled For All DBs:</span>{' '}
                  {!org.rlsEnabledForAllDbs ? (
                    <XMarkIcon className="size-5 text-red-500" />
                  ) : (
                    <CheckIcon className="size-5 text-green-500" />
                  )}
                </div>
                <div className="text-sm flex gap-2 flex-row-reverse">
                  <span className="">PITR Enabled For All DBs:</span>{' '}
                  {!org.pitrEnabledForAllDbs ? (
                    <XMarkIcon className="size-5 text-red-500" />
                  ) : (
                    <CheckIcon className="size-5 text-green-500" />
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <DetailedCompliance
                  openDrawer={openDrawer}
                  setOpenDrawer={setOpenDrawer}
                  selectedOrgData={selectedOrgData}
                  setSelectedOrgData={setSelectedOrgData}
                  org={org}
                />
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default OrganizationCompliance;
