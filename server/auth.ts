import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// PostgreSQL session store
const PostgresSessionStore = connectPg(session);

const scryptAsync = promisify(scrypt);

// Şifre hashleme fonksiyonu
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Şifre karşılaştırma fonksiyonu
async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Session ayarları
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'zenith-car-wash-secret-key',
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({
      pool,
      tableName: 'sessions',
      createTableIfMissing: true
    }),
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 gün
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Production modunda sadece HTTPS
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy kurulumu
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: "Kullanıcı adı veya şifre hatalı" });
        }
        
        // Şifre kontrolü
        const isPasswordValid = await comparePasswords(password, user.password);
        
        if (!isPasswordValid) {
          return done(null, false, { message: "Kullanıcı adı veya şifre hatalı" });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  // Serialize ve deserialize işlemleri
  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Kullanıcı kaydı API'si
  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      
      if (existingUser) {
        return res.status(400).json({ error: "Bu kullanıcı adı zaten kullanılıyor" });
      }

      // Şifreyi hashle
      const hashedPassword = await hashPassword(req.body.password);
      
      // Kullanıcıyı oluştur
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      // Otomatik giriş yap
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Şifreyi API yanıtından çıkart
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  // Giriş API'si
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      
      if (!user) {
        return res.status(401).json({ error: info.message || "Giriş başarısız" });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Şifreyi API yanıtından çıkart
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Çıkış API'si
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Mevcut kullanıcı bilgisini al
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Oturum açılmamış" });
    }
    
    // Şifreyi API yanıtından çıkart
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  // Şifre değiştirme API'si
  app.post("/api/change-password", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Oturum açılmamış" });
      }
      
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Mevcut şifre ve yeni şifre gerekli" });
      }
      
      // Mevcut şifreyi doğrula
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      }
      
      const isPasswordValid = await comparePasswords(currentPassword, user.password);
      
      if (!isPasswordValid) {
        return res.status(400).json({ error: "Mevcut şifre hatalı" });
      }
      
      // Yeni şifreyi hashle ve güncelle
      const hashedNewPassword = await hashPassword(newPassword);
      
      await storage.updateUser(req.user.id, { password: hashedNewPassword });
      
      res.status(200).json({ success: true, message: "Şifre başarıyla değiştirildi" });
    } catch (error) {
      next(error);
    }
  });
}

// Middleware: Kimlik doğrulama gerektiren rotaları korumak için
export function requireAuth(req: Express.Request, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor" });
}

// Mevcut şifreleri hashleme fonksiyonu (veritabanı migrasyonu için)
export async function hashExistingPasswords() {
  try {
    // Tüm kullanıcıları getir
    const users = await storage.getUsers();
    
    for (const user of users) {
      // Hash kontrolü (hash'lenmiş şifreler nokta içerir)
      if (!user.password.includes('.')) {
        // Şifre hash'lenmemiş, hash'le ve güncelle
        const hashedPassword = await hashPassword(user.password);
        await storage.updateUser(user.id, { password: hashedPassword });
        console.log(`Kullanıcı ${user.username} için şifre hashlendi`);
      }
    }
    
    console.log('Tüm şifreler kontrol edildi');
  } catch (error) {
    console.error('Şifre hashleme hatası:', error);
  }
}