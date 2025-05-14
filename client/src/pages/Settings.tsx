import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Örnek sistem ayarları
  const [systemSettings, setSystemSettings] = useState({
    companyName: "ZENITH CAR Oto Yıkama",
    address: "Yıldız Mah. Atatürk Cad. No:123 İstanbul",
    phone: "+90 555 123 4567",
    email: "info@zenithcar.com",
    taxId: "1234567890",
    receiptFooter: "Bizi tercih ettiğiniz için teşekkür ederiz. Tekrar bekleriz!"
  });
  
  // Örnek bildirim ayarları
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    promotionalMessages: false,
    dailySummary: true
  });
  
  // Yedekleme ayarları
  const [backupSettings, setBackupSettings] = useState({
    autoBackupEnabled: false
  });
  
  // Yedekleme dosyaları listesi
  interface BackupFile {
    filename: string;
    path: string;
    timestamp: string;
    size: number;
  }
  
  // Yedekleme ayarlarını getir
  const { data: backupSettingsData, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/backup/settings'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/backup/settings');
      return res.json();
    }
  });
  
  // Yedekleme dosyalarını getir
  const { data: backupFiles, isLoading: isLoadingBackups } = useQuery({
    queryKey: ['/api/backup/list'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/backup/list');
      return res.json() as Promise<BackupFile[]>;
    }
  });
  
  // Ayarları kaydetme mutation
  const saveBackupSettingsMutation = useMutation({
    mutationFn: async (settings: { autoBackupEnabled: boolean }) => {
      const res = await apiRequest('POST', '/api/backup/settings', settings);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Ayarlar kaydedildi",
        description: "Yedekleme ayarları başarıyla güncellendi."
      });
      // Query cache'i yenile
      queryClient.invalidateQueries({ queryKey: ['/api/backup/settings'] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Ayarlar kaydedilirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  });
  
  // Manuel yedekleme mutation
  const manualBackupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/backup/manual');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Yedekleme tamamlandı",
        description: "Manuel yedekleme başarıyla tamamlandı."
      });
      // Yedekleme listesini yenile
      queryClient.invalidateQueries({ queryKey: ['/api/backup/list'] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Yedekleme yapılırken bir hata oluştu.",
        variant: "destructive"
      });
    }
  });
  
  // Ayarları yükle
  useEffect(() => {
    if (backupSettingsData) {
      setBackupSettings(backupSettingsData);
    }
  }, [backupSettingsData]);
  
  const handleSystemInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSystemSettings((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const handleSystemSave = () => {
    toast({
      title: "Ayarlar kaydedildi",
      description: "Sistem ayarları başarıyla güncellendi."
    });
  };
  
  const handleNotificationSave = () => {
    toast({
      title: "Bildirim ayarları kaydedildi",
      description: "Bildirim tercihleri başarıyla güncellendi."
    });
  };
  
  return (
    <main className="container mx-auto px-4 py-6 max-w-6xl">
      <h1 className="text-2xl font-bold mb-4">Ayarlar</h1>
      
      <Tabs defaultValue="system" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="system">Sistem</TabsTrigger>
          <TabsTrigger value="notifications">Bildirimler</TabsTrigger>
          <TabsTrigger value="appearance">Görünüm</TabsTrigger>
          <TabsTrigger value="backup">Yedekleme</TabsTrigger>
        </TabsList>
        
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>Sistem Ayarları</CardTitle>
              <CardDescription>İşletme bilgilerinizi ve sistem tercihlerinizi yönetin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">İşletme Adı</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={systemSettings.companyName}
                    onChange={handleSystemInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="taxId">Vergi No</Label>
                  <Input
                    id="taxId"
                    name="taxId"
                    value={systemSettings.taxId}
                    onChange={handleSystemInputChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Adres</Label>
                <Input
                  id="address"
                  name="address"
                  value={systemSettings.address}
                  onChange={handleSystemInputChange}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={systemSettings.phone}
                    onChange={handleSystemInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={systemSettings.email}
                    onChange={handleSystemInputChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="receiptFooter">Fiş/Fatura Alt Metni</Label>
                <textarea
                  id="receiptFooter"
                  name="receiptFooter"
                  className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                  value={systemSettings.receiptFooter}
                  onChange={handleSystemInputChange}
                />
              </div>
              
              <Button onClick={handleSystemSave}>Değişiklikleri Kaydet</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Bildirim Ayarları</CardTitle>
              <CardDescription>Bildirim tercihlerinizi yönetin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-md font-medium">E-posta Bildirimleri</h3>
                  <p className="text-sm text-gray-500">İş emirleri için e-posta ile bildirim alın</p>
                </div>
                <Switch 
                  checked={notificationSettings.emailNotifications} 
                  onCheckedChange={(checked) => handleSwitchChange("emailNotifications", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-md font-medium">SMS Bildirimleri</h3>
                  <p className="text-sm text-gray-500">İş emirleri için SMS ile bildirim alın</p>
                </div>
                <Switch 
                  checked={notificationSettings.smsNotifications} 
                  onCheckedChange={(checked) => handleSwitchChange("smsNotifications", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-md font-medium">Randevu Hatırlatmaları</h3>
                  <p className="text-sm text-gray-500">Yaklaşan randevular için hatırlatma alın</p>
                </div>
                <Switch 
                  checked={notificationSettings.appointmentReminders} 
                  onCheckedChange={(checked) => handleSwitchChange("appointmentReminders", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-md font-medium">Promosyon Mesajları</h3>
                  <p className="text-sm text-gray-500">Kampanya ve fırsatlardan haberdar olun</p>
                </div>
                <Switch 
                  checked={notificationSettings.promotionalMessages} 
                  onCheckedChange={(checked) => handleSwitchChange("promotionalMessages", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-md font-medium">Günlük Özet</h3>
                  <p className="text-sm text-gray-500">Günlük işlemlerinizin özetini alın</p>
                </div>
                <Switch 
                  checked={notificationSettings.dailySummary} 
                  onCheckedChange={(checked) => handleSwitchChange("dailySummary", checked)}
                />
              </div>
              
              <Button onClick={handleNotificationSave}>Değişiklikleri Kaydet</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Görünüm Ayarları</CardTitle>
              <CardDescription>Uygulama görünümünü özelleştirin</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Görünüm ayarları şu anda kullanılamıyor.</p>
              
              <div className="mt-4">
                <h3 className="font-medium mb-2">Tema Renkleri</h3>
                <div className="flex space-x-2">
                  <button className="w-8 h-8 bg-blue-600 rounded-full"></button>
                  <button className="w-8 h-8 bg-green-600 rounded-full"></button>
                  <button className="w-8 h-8 bg-purple-600 rounded-full"></button>
                  <button className="w-8 h-8 bg-red-600 rounded-full"></button>
                  <button className="w-8 h-8 bg-gray-600 rounded-full"></button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Yedekleme ve Geri Yükleme</CardTitle>
              <CardDescription>Sistem verilerinizi yedekleyin ve geri yükleyin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Manuel Yedekleme</h3>
                <p className="text-sm text-gray-500 mb-4">Tüm sistem verilerinizin yedeğini alın</p>
                <Button
                  onClick={async () => {
                    try {
                      toast({
                        title: "Yedekleme başlatıldı",
                        description: "Lütfen bekleyin..."
                      });
                      
                      // Fetch ile dosyayı indir
                      const response = await fetch('/api/backup/export');
                      
                      if (!response.ok) {
                        throw new Error(`Yedekleme hatası: ${response.status} ${response.statusText}`);
                      }
                      
                      // Blob olarak al
                      const blob = await response.blob();
                      
                      // İndirme işlemi için bir link oluştur
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      const date = new Date().toISOString().split('T')[0];
                      a.href = url;
                      a.download = `zenith_car_backup_${date}.json`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                      
                      toast({
                        title: "Yedekleme tamamlandı",
                        description: "Yedekleme dosyası indirildi"
                      });
                    } catch (error) {
                      console.error("Yedekleme hatası:", error);
                      
                      toast({
                        title: "Yedekleme hatası",
                        description: error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  Yedek Al
                </Button>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Otomatik Yedekleme</h3>
                <p className="text-sm text-gray-500 mb-4">Sistem verilerinizin otomatik yedeğini alın</p>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-backup" 
                    checked={backupSettings.autoBackupEnabled}
                    disabled={isLoadingSettings || saveBackupSettingsMutation.isPending}
                    onCheckedChange={(checked) => {
                      // Ayarları kaydet
                      saveBackupSettingsMutation.mutate({ autoBackupEnabled: checked });
                    }}
                  />
                  <Label htmlFor="auto-backup">Otomatik yedekleme {isLoadingSettings ? '(Yükleniyor...)' : ''}</Label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {backupSettings.autoBackupEnabled 
                    ? "Otomatik yedekleme aktif: Verileriniz her gece saat 00:00'da yedeklenecektir." 
                    : "Otomatik yedekleme devre dışı."}
                </p>
              </div>
              
              {/* Yedekleme listesi */}
              <div>
                <h3 className="font-medium mb-2">Yedekleme Geçmişi</h3>
                <p className="text-sm text-gray-500 mb-4">Önceki yedeklemeler</p>
                
                <div className="border rounded-md divide-y">
                  {isLoadingBackups ? (
                    <div className="p-4 text-center">Yedeklemeler yükleniyor...</div>
                  ) : backupFiles && backupFiles.length > 0 ? (
                    backupFiles.map((file, index) => (
                      <div key={index} className="p-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium">{file.filename}</div>
                          <div className="text-sm text-gray-500">
                            {formatDate(file.timestamp)} • {(file.size / 1024).toFixed(2)} KB
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">Henüz yedekleme yapılmamış</div>
                  )}
                </div>
                
                <Button 
                  variant="outline" 
                  className="mt-4"
                  disabled={manualBackupMutation.isPending}
                  onClick={() => manualBackupMutation.mutate()}
                >
                  {manualBackupMutation.isPending ? "Yedekleniyor..." : "Manuel Yedek Al"}
                </Button>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Geri Yükleme</h3>
                <p className="text-sm text-gray-500 mb-4">Önceden alınmış bir yedeği geri yükleyin</p>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input 
                      type="file" 
                      id="backup-file"
                      accept=".json"
                      onChange={(e) => {
                        // Seçilen dosyayı göster
                        const fileName = e.target.files?.[0]?.name;
                        if (fileName) {
                          toast({
                            title: "Dosya seçildi",
                            description: fileName
                          });
                        }
                      }}
                    />
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Dosyayı oku ve API'ye gönder
                      const fileInput = document.getElementById('backup-file') as HTMLInputElement;
                      const file = fileInput?.files?.[0];
                      
                      if (!file) {
                        toast({
                          title: "Hata",
                          description: "Lütfen bir yedek dosyası seçin",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      // Onay diyaloğu
                      if (confirm("Dikkat! Bu işlem mevcut tüm verilerinizin üzerine yazacak ve geri alınamaz. Devam etmek istiyor musunuz?")) {
                        const reader = new FileReader();
                        
                        reader.onload = async (event) => {
                          try {
                            const backupData = JSON.parse(event.target?.result as string);
                            
                            // API'ye gönder
                            const response = await fetch('/api/backup/import', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify(backupData)
                            });
                            
                            const result = await response.json();
                            
                            if (response.ok) {
                              toast({
                                title: "Başarılı",
                                description: "Yedek başarıyla geri yüklendi. Sayfa yenilenecek.",
                              });
                              
                              // Kısa bir gecikme sonra sayfayı yenile
                              setTimeout(() => {
                                window.location.reload();
                              }, 2000);
                            } else {
                              toast({
                                title: "Hata",
                                description: result.message || "Geri yükleme sırasında bir hata oluştu",
                                variant: "destructive"
                              });
                            }
                          } catch (error) {
                            console.error("Dosya okuma hatası:", error);
                            toast({
                              title: "Hata",
                              description: "Geçersiz yedek dosyası. JSON formatında olduğundan emin olun.",
                              variant: "destructive"
                            });
                          }
                        };
                        
                        reader.readAsText(file);
                      }
                    }}
                  >
                    Geri Yükle
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}