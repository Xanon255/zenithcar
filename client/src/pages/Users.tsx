import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UserForm from "@/components/users/UserForm";
import UsersTable from "@/components/users/UsersTable";
import { User } from "@shared/schema";

export default function Users() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  
  // Fetch users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  const handleAddUser = () => {
    setSelectedUserId(undefined);
    setIsDialogOpen(true);
  };
  
  const handleEditUser = (id: number) => {
    setSelectedUserId(id.toString());
    setIsDialogOpen(true);
  };
  
  return (
    <main className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-darkest">Kullanıcılar</h1>
        </div>
        <Button onClick={handleAddUser} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" /> Yeni Kullanıcı
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Kullanıcı Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <UsersTable 
            users={users || []} 
            isLoading={isLoading} 
            onEdit={handleEditUser}
          />
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedUserId ? "Kullanıcı Düzenle" : "Yeni Kullanıcı Ekle"}
            </DialogTitle>
          </DialogHeader>
          <UserForm userId={selectedUserId} />
        </DialogContent>
      </Dialog>
    </main>
  );
}
