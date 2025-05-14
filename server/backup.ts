import fs from 'fs';
import path from 'path';
import { storage } from './storage';

// Yedekleme klasörü
const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Yedekleme dosyası formatı
interface BackupFileInfo {
  filename: string;
  path: string;
  timestamp: Date;
  size: number;
}

// Otomatik yedekleme ayarlarını kontrol et
async function checkAutoBackupSettings(): Promise<boolean> {
  try {
    const autoBackupEnabled = await storage.getSetting('auto_backup_enabled');
    return autoBackupEnabled === 'true';
  } catch (error) {
    console.error('Otomatik yedekleme ayarları kontrol edilirken hata oluştu:', error);
    return false;
  }
}

// Yedekleme klasörünü kontrol et veya oluştur
async function ensureBackupDir(): Promise<void> {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      console.log(`Yedekleme klasörü oluşturuldu: ${BACKUP_DIR}`);
    }
  } catch (error) {
    console.error('Yedekleme klasörü oluşturulurken hata oluştu:', error);
  }
}

// Otomatik yedekleme yap
export async function performAutoBackup(): Promise<string | null> {
  try {
    // Otomatik yedekleme açık mı kontrol et
    const isAutoBackupEnabled = await checkAutoBackupSettings();
    if (!isAutoBackupEnabled) {
      return null;
    }

    // Yedekleme klasörünü oluştur
    await ensureBackupDir();

    // Yedekleme verilerini al
    const backupData = await storage.exportBackup();
    
    // Dosya adını oluştur
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `zenith_car_backup_${timestamp}.json`;
    const filePath = path.join(BACKUP_DIR, filename);
    
    // Dosyayı kaydet
    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
    
    // Eski yedekleri temizle (son 10 yedek kalsın)
    await cleanupOldBackups(10);
    
    console.log(`Otomatik yedekleme tamamlandı: ${filename}`);
    return filePath;
  } catch (error) {
    console.error('Otomatik yedekleme sırasında hata oluştu:', error);
    return null;
  }
}

// Manuel yedekleme yap
export async function performManualBackup(): Promise<string | null> {
  try {
    // Yedekleme klasörünü oluştur
    await ensureBackupDir();

    // Yedekleme verilerini al
    const backupData = await storage.exportBackup();
    
    // Dosya adını oluştur
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `zenith_car_manual_backup_${timestamp}.json`;
    const filePath = path.join(BACKUP_DIR, filename);
    
    // Dosyayı kaydet
    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
    
    console.log(`Manuel yedekleme tamamlandı: ${filename}`);
    return filePath;
  } catch (error) {
    console.error('Manuel yedekleme sırasında hata oluştu:', error);
    return null;
  }
}

// Eski yedeklemeleri temizle
async function cleanupOldBackups(keepCount: number): Promise<void> {
  try {
    const backups = await getBackupFiles();
    
    // Tarih sırasına göre sırala (yeniden eskiye)
    backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Saklanacak sayının dışındaki dosyaları sil
    if (backups.length > keepCount) {
      for (let i = keepCount; i < backups.length; i++) {
        fs.unlinkSync(backups[i].path);
        console.log(`Eski yedek silindi: ${backups[i].filename}`);
      }
    }
  } catch (error) {
    console.error('Eski yedeklemeler temizlenirken hata oluştu:', error);
  }
}

// Mevcut yedekleme dosyalarını listele
export async function getBackupFiles(): Promise<BackupFileInfo[]> {
  try {
    await ensureBackupDir();
    
    const files = fs.readdirSync(BACKUP_DIR);
    const backupFiles: BackupFileInfo[] = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        
        backupFiles.push({
          filename: file,
          path: filePath,
          timestamp: stats.mtime,
          size: stats.size
        });
      }
    }
    
    // Dosyaları tarihe göre sırala (en yeni en üstte)
    backupFiles.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return backupFiles;
  } catch (error) {
    console.error('Yedekleme dosyaları listelenirken hata oluştu:', error);
    return [];
  }
}

// Yedeklemeyi planla (her gece saat 00:00'da)
export function scheduleAutoBackup(): NodeJS.Timeout {
  const now = new Date();
  const tonight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1, // Yarın
    0, // Saat 00:00
    0,
    0
  );
  
  // Şimdi ile gece yarısı arasındaki milisaniye
  const msUntilMidnight = tonight.getTime() - now.getTime();
  
  console.log(`Otomatik yedekleme planlandı: ${msUntilMidnight / (1000 * 60 * 60)} saat sonra`);
  
  // İlk yedeklemeyi planla
  const timer = setTimeout(async () => {
    await performAutoBackup();
    
    // Sonraki yedeklemeleri her 24 saatte bir planla
    setInterval(async () => {
      await performAutoBackup();
    }, 24 * 60 * 60 * 1000); // 24 saat
  }, msUntilMidnight);
  
  return timer;
}