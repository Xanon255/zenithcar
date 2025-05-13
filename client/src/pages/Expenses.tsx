import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertExpenseSchema, expenseCategoryEnum, Expense } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Expenses() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // Fetch expenses
  const expensesQuery = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });
  
  // Create a form schema
  const formSchema = insertExpenseSchema.extend({
    category: expenseCategoryEnum,
    amount: z.string().min(1, "Tutar zorunludur")
      .transform(val => Number(val) || 0),
    expenseDate: z.string().transform(val => new Date(val)),
  });
  
  // Define the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      amount: "",
      category: "malzeme",
      notes: "",
      expenseDate: format(new Date(), "yyyy-MM-dd"),
    },
  });
  
  // Reset form when add dialog opens
  const handleAddOpen = () => {
    form.reset({
      name: "",
      amount: "",
      category: "malzeme",
      notes: "",
      expenseDate: format(new Date(), "yyyy-MM-dd"),
    });
    setIsAddOpen(true);
  };
  
  // Open edit dialog with expense data
  const handleEditOpen = (expense: Expense) => {
    setEditingExpense(expense);
    form.reset({
      name: expense.name,
      amount: expense.amount.toString(),
      category: expense.category,
      notes: expense.notes || "",
      expenseDate: format(new Date(expense.date), "yyyy-MM-dd"),
    });
    setIsEditOpen(true);
  };
  
  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/expenses", {
        name: data.name,
        amount: data.amount,
        category: data.category,
        notes: data.notes,
        date: data.expenseDate,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/net-profit"] });
      setIsAddOpen(false);
      toast({
        title: "Başarılı",
        description: "Gider başarıyla eklendi",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Gider eklenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });
  
  // Update expense mutation
  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof formSchema> }) => {
      const res = await apiRequest("PUT", `/api/expenses/${id}`, {
        name: data.name,
        amount: data.amount,
        category: data.category,
        notes: data.notes,
        date: data.expenseDate,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/net-profit"] });
      setIsEditOpen(false);
      setEditingExpense(null);
      toast({
        title: "Başarılı",
        description: "Gider başarıyla güncellendi",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Gider güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });
  
  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/net-profit"] });
      toast({
        title: "Başarılı",
        description: "Gider başarıyla silindi",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Gider silinirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (isEditOpen && editingExpense) {
      updateExpenseMutation.mutate({ id: editingExpense.id, data });
    } else {
      createExpenseMutation.mutate(data);
    }
  };
  
  // Get category display name
  const getCategoryName = (category: string) => {
    switch (category) {
      case "malzeme": return "Malzeme";
      case "kira": return "Kira";
      case "su": return "Su";
      case "elektrik": return "Elektrik";
      case "personel": return "Personel";
      case "diger": return "Diğer";
      default: return category;
    }
  };
  
  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-darkest">Giderler</h1>
          <div className="text-sm text-gray-500 mt-1">
            Oto yıkama işletmenizin giderlerini buradan yönetebilirsiniz
          </div>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 md:mt-0" onClick={handleAddOpen}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Yeni Gider Ekle
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Yeni Gider Ekle</DialogTitle>
              <DialogDescription>
                Gider bilgilerini doldurun ve ekleyin.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gider Adı</FormLabel>
                      <FormControl>
                        <Input placeholder="Gider adını girin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tutar (TL)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Kategori seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="malzeme">Malzeme</SelectItem>
                          <SelectItem value="kira">Kira</SelectItem>
                          <SelectItem value="su">Su</SelectItem>
                          <SelectItem value="elektrik">Elektrik</SelectItem>
                          <SelectItem value="personel">Personel</SelectItem>
                          <SelectItem value="diger">Diğer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="expenseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarih</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notlar</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Gider hakkında ek bilgiler" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createExpenseMutation.isPending}
                  >
                    {createExpenseMutation.isPending ? "Ekleniyor..." : "Ekle"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Gider Düzenle</DialogTitle>
              <DialogDescription>
                Gider bilgilerini güncelleyin.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gider Adı</FormLabel>
                      <FormControl>
                        <Input placeholder="Gider adını girin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tutar (TL)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Kategori seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="malzeme">Malzeme</SelectItem>
                          <SelectItem value="kira">Kira</SelectItem>
                          <SelectItem value="su">Su</SelectItem>
                          <SelectItem value="elektrik">Elektrik</SelectItem>
                          <SelectItem value="personel">Personel</SelectItem>
                          <SelectItem value="diger">Diğer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="expenseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarih</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notlar</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Gider hakkında ek bilgiler" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={updateExpenseMutation.isPending}
                  >
                    {updateExpenseMutation.isPending ? "Güncelleniyor..." : "Güncelle"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Gider Listesi</CardTitle>
          <CardDescription>Oto yıkama işletmenizin tüm giderleri</CardDescription>
        </CardHeader>
        <CardContent>
          {expensesQuery.isLoading ? (
            <div className="flex items-center justify-center py-6">
              <p>Yükleniyor...</p>
            </div>
          ) : expensesQuery.isError ? (
            <div className="flex items-center justify-center py-6">
              <p>Giderler yüklenirken bir hata oluştu</p>
            </div>
          ) : expensesQuery.data && expensesQuery.data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Gider Adı</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expensesQuery.data.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {format(new Date(expense.date), "dd.MM.yyyy")}
                      </TableCell>
                      <TableCell>{expense.name}</TableCell>
                      <TableCell>{getCategoryName(expense.category)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(expense.amount)} TL</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditOpen(expense)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Gideri Sil</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bu gideri silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteExpenseMutation.mutate(expense.id)}
                                >
                                  Sil
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex items-center justify-center py-6">
              <p>Henüz hiç gider eklenmemiş</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}