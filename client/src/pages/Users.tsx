import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import UserForm from "@/components/users/UserForm";
import UsersTable from "@/components/users/UsersTable";
import { User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

export default function Users() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Fetch users (only if user is admin)
  const { data: users, isLoading, isError } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: user?.isAdmin === true,
    retry: false,
    onSuccess: () => {
      setError(null);
    },
    onError: () => {
      setError("Kullanıcı verileri alınamadı. Yetki hatası olabilir.");
    }
  });
  
  // Artık onError callback'inde hata işlemesi yapıldığı için bu useEffect'e gerek kalmadı
  
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
        <Button 
          onClick={handleAddUser} 
          className="flex items-center"
          disabled={!user?.isAdmin}
        >
          <Plus className="mr-2 h-4 w-4" /> Yeni Kullanıcı
        </Button>
      </div>
      
      {!user?.isAdmin && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Yetki Hatası</AlertTitle>
          <AlertDescription>
            Bu sayfayı görüntülemek için yönetici haklarına sahip olmanız gerekmektedir.
          </AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Kullanıcı Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <UsersTable 
            users={users ?? []} 
            isLoading={isLoading && user?.isAdmin === true} 
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
