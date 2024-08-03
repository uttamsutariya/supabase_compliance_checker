import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { IOrganization } from '@/types';
import { Button } from '../ui/button';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/solid';

interface DetailedComplianceProps {
  org: IOrganization;
  openDrawer: boolean;
  setOpenDrawer: React.Dispatch<React.SetStateAction<boolean>>;
  selectedOrgData: IOrganization | null;
  setSelectedOrgData: React.Dispatch<React.SetStateAction<IOrganization | null>>;
}

const DetailedCompliance: React.FC<DetailedComplianceProps> = ({
  org,
  openDrawer,
  setOpenDrawer,
  selectedOrgData,
  setSelectedOrgData,
}) => {
  return (
    <Drawer
      open={openDrawer}
      onClose={() => {
        setOpenDrawer(false);
        setSelectedOrgData(null);
      }}
    >
      <DrawerTrigger asChild>
        <Button
          onClick={() => {
            setOpenDrawer(true);
            setSelectedOrgData(org);
          }}
          size={'sm'}
        >
          View In Details
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{selectedOrgData?.name}</DrawerTitle>
          <DrawerDescription>{selectedOrgData?._id}</DrawerDescription>
        </DrawerHeader>
        <div className="flex gap-5 px-2 items-end">
          <div className="flex-1 border border-gray-300 rounded-lg p-2">
            <Table>
              <TableCaption>A list of users in this organization</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>MFA Enabled</TableHead>
                  <TableHead>Id</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedOrgData?.users.map((user) => {
                  return (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">
                        {user.mfaEnabled ? (
                          <CheckIcon className="size-5 text-green-500" />
                        ) : (
                          <XMarkIcon className="size-5 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>{user.userId}</TableCell>
                      <TableCell>{user.roleName}</TableCell>
                      <TableCell className="text-right">{user.email}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="flex justify-between items-center"></div>
          </div>
          <div className="flex-1 border border-gray-300 rounded-lg p-2">
            <Table>
              <TableCaption>A list of databases / projects in this organization</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>RLS Enabled</TableHead>
                  <TableHead>PITR Enabled</TableHead>
                  <TableHead>DB Host</TableHead>
                  <TableHead className="text-right">Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedOrgData?.databases.map((db) => {
                  return (
                    <TableRow key={db._id}>
                      <TableCell className="font-medium">
                        {db.rlsEnabledForAllTables ? (
                          <CheckIcon className="size-5 text-green-500" />
                        ) : (
                          <XMarkIcon className="size-5 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        {db.pitrEnabled ? (
                          <CheckIcon className="size-5 text-green-500" />
                        ) : (
                          <XMarkIcon className="size-5 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>{db.host}</TableCell>
                      <TableCell className="text-right">{db.name}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
        <DrawerFooter className="flex justify-start">
          <DrawerClose className="flex justify-start">
            <Button onClick={() => setOpenDrawer(false)} size={'sm'}>
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default DetailedCompliance;
