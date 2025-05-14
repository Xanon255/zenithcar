import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  // Örnek kullanıcı verisi
  const [formData, setFormData] = useState({
    name: "ZENITH CAR",
    email: "info@zenithcar.com",
    phone: "+90 555 123 4567",
    position: "Yönetici"
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSave = () => {
    // Burada API çağrısı yapılabilir
    setIsEditing(false);
    toast({
      title: "Profil güncellendi",
      description: "Bilgileriniz başarıyla kaydedildi."
    });
  };
  
  return (
    <main className="container mx-auto px-4 py-6 max-w-6xl">
      <h1 className="text-2xl font-bold mb-4">Profil</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Profil Bilgileri</CardTitle>
              <CardDescription>Kişisel ve iletişim bilgilerinizi yönetin</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold mb-4">
                ZC
              </div>
              <h3 className="text-lg font-semibold">{formData.name}</h3>
              <p className="text-gray-500">{formData.position}</p>
            </CardContent>
            <CardFooter>
              {!isEditing ? (
                <Button
                  className="w-full"
                  onClick={() => setIsEditing(true)}
                >
                  Düzenle
                </Button>
              ) : (
                <div className="flex w-full gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsEditing(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSave}
                  >
                    Kaydet
                  </Button>
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Profil Bilgileriniz</CardTitle>
              <CardDescription>Temel bilgilerinizi güncelleyin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">İsim</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="position">Pozisyon</Label>
                  <Input
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Şifre</Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    disabled={true}
                  />
                  <Button
                    variant="outline"
                    className="shrink-0"
                    onClick={() => toast({
                      title: "Şifre sıfırlama",
                      description: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi."
                    })}
                  >
                    Sıfırla
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Bildirim Ayarları</CardTitle>
              <CardDescription>Bildirim tercihlerinizi yönetin</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Bildirim ayarları şu anda kullanılamıyor.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}