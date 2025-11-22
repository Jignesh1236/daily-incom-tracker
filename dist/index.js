// server/index.ts
import express2 from "express";
import helmet from "helmet";

// server/routes.ts
import { createServer } from "http";

// server/mongodb.ts
import { MongoClient, ObjectId } from "mongodb";
var client = null;
var db = null;
async function connectToMongoDB() {
  if (db) return db;
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.warn("\x1B[33m\u26A0 MONGODB_URI not set - storage features will be limited\x1B[0m");
    return null;
  }
  let finalUri = mongoUri;
  if (!mongoUri.includes("retryWrites")) {
    const separator = mongoUri.includes("?") ? "&" : "?";
    finalUri = `${mongoUri}${separator}retryWrites=true&w=majority`;
  }
  try {
    client = new MongoClient(finalUri, {
      serverSelectionTimeoutMS: 1e4,
      connectTimeoutMS: 15e3,
      tls: true,
      tlsAllowInvalidCertificates: true
    });
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    db = client.db("adsc_reports");
    console.log("\x1B[32m\u2713 Connected to MongoDB successfully\x1B[0m");
    return db;
  } catch (error) {
    console.warn("\x1B[33m\u26A0 MongoDB connection failed - app will run with limited features\x1B[0m");
    console.warn("\x1B[90m  Error:", error instanceof Error ? error.message : error, "\x1B[0m");
    return null;
  }
}
var MongoStorage = class {
  collection = null;
  async getCollection() {
    if (this.collection) return this.collection;
    const database = await connectToMongoDB();
    if (!database) return null;
    this.collection = database.collection("reports");
    try {
      await this.collection.dropIndex("date_1");
    } catch (error) {
    }
    await this.collection.createIndex({ date: 1 });
    return this.collection;
  }
  async createReport(insertReport) {
    const collection = await this.getCollection();
    if (!collection) {
      throw new Error("Database not available - please set MONGODB_URI");
    }
    const report = {
      date: insertReport.date,
      services: insertReport.services || [],
      expenses: insertReport.expenses || [],
      totalServices: insertReport.totalServices,
      totalExpenses: insertReport.totalExpenses,
      netProfit: insertReport.netProfit,
      onlinePayment: insertReport.onlinePayment || "0",
      createdBy: insertReport.createdBy,
      createdByUsername: insertReport.createdByUsername,
      createdAt: /* @__PURE__ */ new Date()
    };
    const result = await collection.insertOne(report);
    return {
      id: result.insertedId.toString(),
      ...report
    };
  }
  async getReports() {
    const collection = await this.getCollection();
    if (!collection) {
      return [];
    }
    const reports = await collection.find({}).sort({ date: -1 }).toArray();
    return reports.map((doc) => ({
      id: doc._id.toString(),
      date: doc.date,
      services: doc.services,
      expenses: doc.expenses,
      totalServices: doc.totalServices,
      totalExpenses: doc.totalExpenses,
      netProfit: doc.netProfit,
      onlinePayment: doc.onlinePayment || "0",
      createdBy: doc.createdBy,
      createdByUsername: doc.createdByUsername,
      createdAt: doc.createdAt
    }));
  }
  async getReportById(id) {
    const collection = await this.getCollection();
    if (!collection) {
      return void 0;
    }
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return void 0;
    }
    const doc = await collection.findOne({ _id: objectId });
    if (!doc) return void 0;
    return {
      id: doc._id.toString(),
      date: doc.date,
      services: doc.services,
      expenses: doc.expenses,
      totalServices: doc.totalServices,
      totalExpenses: doc.totalExpenses,
      netProfit: doc.netProfit,
      onlinePayment: doc.onlinePayment || "0",
      createdBy: doc.createdBy,
      createdByUsername: doc.createdByUsername,
      createdAt: doc.createdAt
    };
  }
  async getReportsByDate(date) {
    const collection = await this.getCollection();
    if (!collection) {
      return [];
    }
    const docs = await collection.find({ date }).sort({ createdAt: -1 }).toArray();
    return docs.map((doc) => ({
      id: doc._id.toString(),
      date: doc.date,
      services: doc.services,
      expenses: doc.expenses,
      totalServices: doc.totalServices,
      totalExpenses: doc.totalExpenses,
      netProfit: doc.netProfit,
      onlinePayment: doc.onlinePayment || "0",
      createdBy: doc.createdBy,
      createdByUsername: doc.createdByUsername,
      createdAt: doc.createdAt
    }));
  }
  async deleteReport(id) {
    const collection = await this.getCollection();
    if (!collection) {
      throw new Error("Database not available - please set MONGODB_URI");
    }
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      throw new Error("Invalid report ID");
    }
    const result = await collection.deleteOne({ _id: objectId });
    if (result.deletedCount === 0) {
      throw new Error("Report not found");
    }
    return { success: true };
  }
  async updateReport(id, reportData) {
    const collection = await this.getCollection();
    if (!collection) {
      throw new Error("Database not available - please set MONGODB_URI");
    }
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      throw new Error("Invalid report ID");
    }
    const updateFields = {};
    if (reportData.date) updateFields.date = reportData.date;
    if (reportData.services) updateFields.services = reportData.services;
    if (reportData.expenses) updateFields.expenses = reportData.expenses;
    if (reportData.totalServices !== void 0) updateFields.totalServices = reportData.totalServices;
    if (reportData.totalExpenses !== void 0) updateFields.totalExpenses = reportData.totalExpenses;
    if (reportData.netProfit !== void 0) updateFields.netProfit = reportData.netProfit;
    const result = await collection.updateOne(
      { _id: objectId },
      { $set: updateFields }
    );
    if (result.matchedCount === 0) {
      throw new Error("Report not found");
    }
    return { success: true };
  }
};
var mongoStorage = new MongoStorage();

// server/storage.ts
var storage = mongoStorage;

// shared/schema.ts
import { z } from "zod";
var serviceItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Service name is required"),
  amount: z.number().min(0, "Amount must be positive")
});
var expenseItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Expense name is required"),
  amount: z.number().min(0, "Amount must be positive")
});
var insertReportSchema = z.object({
  date: z.string(),
  services: z.array(serviceItemSchema).default([]),
  expenses: z.array(expenseItemSchema).default([]),
  totalServices: z.string(),
  totalExpenses: z.string(),
  netProfit: z.string(),
  onlinePayment: z.string().optional().default("0"),
  createdBy: z.string().optional(),
  createdByUsername: z.string().optional()
});
var reportSchema = insertReportSchema.extend({
  id: z.string(),
  createdAt: z.date()
});
var userRoleSchema = z.enum(["admin", "manager", "employee"]);
var insertUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username must not exceed 30 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100, "Password must not exceed 100 characters").regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[a-z]/, "Password must contain at least one lowercase letter").regex(/[0-9]/, "Password must contain at least one number").regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  email: z.string().email("Valid email is required").optional(),
  role: userRoleSchema.default("employee")
});
var userSchema = insertUserSchema.extend({
  id: z.string(),
  createdAt: z.date(),
  isActive: z.boolean().default(true),
  lastLogin: z.date().optional()
});
var updateUserSchema = z.object({
  email: z.string().email("Valid email is required").optional(),
  role: userRoleSchema.optional(),
  isActive: z.boolean().optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});
var activityLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  username: z.string(),
  action: z.enum([
    "login",
    "logout",
    "report_created",
    "report_updated",
    "report_deleted",
    "report_viewed",
    "report_exported",
    "report_shared",
    "user_created",
    "user_updated",
    "user_deleted"
  ]),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.date()
});

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import MemoryStore from "memorystore";
import rateLimit from "express-rate-limit";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { MongoClient as MongoClient2, ObjectId as ObjectId2 } from "mongodb";
var scryptAsync = promisify(scrypt);
var MemorySessionStore = MemoryStore(session);
var client2 = null;
var dbConnected = false;
var loginAttempts = /* @__PURE__ */ new Map();
var loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 5,
  // 5 attempts per window
  message: { error: "Too many login attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});
var registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1e3,
  // 1 hour
  max: 3,
  // 3 registrations per hour per IP
  message: { error: "Too many accounts created. Please try again after 1 hour." },
  standardHeaders: true,
  legacyHeaders: false
});
async function getDb() {
  if (!client2) {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.warn("\x1B[33m\u26A0 MONGODB_URI not set - authentication features will be limited\x1B[0m");
      return null;
    }
    let finalUri = mongoUri;
    if (!mongoUri.includes("retryWrites")) {
      const separator = mongoUri.includes("?") ? "&" : "?";
      finalUri = `${mongoUri}${separator}retryWrites=true&w=majority`;
    }
    try {
      client2 = new MongoClient2(finalUri, {
        serverSelectionTimeoutMS: 1e4,
        connectTimeoutMS: 15e3,
        tls: true,
        tlsAllowInvalidCertificates: true
      });
      await client2.connect();
      dbConnected = true;
      console.log("\x1B[32m\u2713 MongoDB connected for authentication\x1B[0m");
    } catch (error) {
      console.warn("\x1B[33m\u26A0 MongoDB connection failed - app will run with limited features\x1B[0m");
      console.warn("\x1B[90m  Error:", error instanceof Error ? error.message : error, "\x1B[0m");
      return null;
    }
  }
  return client2 ? client2.db("adsc_reports") : null;
}
function checkAccountLockout(username) {
  const attempt = loginAttempts.get(username);
  if (!attempt) return { locked: false };
  if (attempt.lockedUntil && attempt.lockedUntil > Date.now()) {
    const remainingTime = Math.ceil((attempt.lockedUntil - Date.now()) / 1e3 / 60);
    return { locked: true, remainingTime };
  }
  if (attempt.lockedUntil && attempt.lockedUntil <= Date.now()) {
    loginAttempts.delete(username);
    return { locked: false };
  }
  return { locked: false };
}
function recordFailedLogin(username) {
  const attempt = loginAttempts.get(username) || { count: 0, lastAttempt: Date.now() };
  const timeSinceLastAttempt = Date.now() - attempt.lastAttempt;
  if (timeSinceLastAttempt > 15 * 60 * 1e3) {
    attempt.count = 1;
  } else {
    attempt.count += 1;
  }
  attempt.lastAttempt = Date.now();
  if (attempt.count >= 5) {
    attempt.lockedUntil = Date.now() + 30 * 60 * 1e3;
  }
  loginAttempts.set(username, attempt);
}
function clearFailedLogins(username) {
  loginAttempts.delete(username);
}
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
async function getUserByUsername(username) {
  const db2 = await getDb();
  if (!db2) return null;
  const usersCollection = db2.collection("users");
  return await usersCollection.findOne({ username });
}
async function getUserById(id) {
  const db2 = await getDb();
  if (!db2) return null;
  const usersCollection = db2.collection("users");
  return await usersCollection.findOne({ _id: new ObjectId2(id) });
}
async function logActivity(userId, username, action, options) {
  try {
    const db2 = await getDb();
    if (!db2) return;
    const activityLogsCollection = db2.collection("activity_logs");
    await activityLogsCollection.insertOne({
      userId,
      username,
      action,
      resourceType: options?.resourceType,
      resourceId: options?.resourceId,
      metadata: options?.metadata,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      timestamp: /* @__PURE__ */ new Date()
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
async function ensureAdminUser() {
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  try {
    const db2 = await getDb();
    if (!db2) {
      console.warn("\x1B[33m\u26A0 Skipping admin user creation - database not connected\x1B[0m");
      return;
    }
    const usersCollection = db2.collection("users");
    const existingAdmin = await usersCollection.findOne({ username: adminUsername });
    if (!existingAdmin) {
      await usersCollection.insertOne({
        username: adminUsername,
        password: await hashPassword(adminPassword),
        role: "admin",
        email: process.env.ADMIN_EMAIL || void 0,
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      });
      console.log(`\x1B[32m\u2713 Admin user created: ${adminUsername}\x1B[0m`);
    } else {
      console.log(`\x1B[32m\u2713 Admin user already exists: ${adminUsername}\x1B[0m`);
    }
  } catch (error) {
    console.error("\x1B[31m\u2717 Failed to create admin user\x1B[0m");
    console.error("\x1B[90m  Error:", error, "\x1B[0m");
  }
}
function setupAuth(app2) {
  ensureAdminUser();
  const store = new MemorySessionStore({ checkPeriod: 864e5 });
  const sessionSecret = process.env.SESSION_SECRET || randomBytes(32).toString("hex");
  if (!process.env.SESSION_SECRET) {
    console.warn("\x1B[33m\u26A0 SESSION_SECRET not set - using random generated secret (sessions will not persist across restarts)\x1B[0m");
  }
  const sessionSettings = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      maxAge: 24 * 60 * 60 * 1e3,
      // 24 hours instead of 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
      // CSRF protection
    },
    name: "sessionId"
    // Hide default session cookie name
  };
  app2.set("trust proxy", 1);
  app2.use(session(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const lockout = checkAccountLockout(username);
        if (lockout.locked) {
          return done(null, false, {
            message: `Account temporarily locked. Try again in ${lockout.remainingTime} minutes.`
          });
        }
        const user = await getUserByUsername(username);
        if (!user || !await comparePasswords(password, user.password)) {
          recordFailedLogin(username);
          return done(null, false, { message: "Invalid username or password" });
        }
        if (user.isActive === false) {
          return done(null, false, { message: "Account is deactivated" });
        }
        clearFailedLogins(username);
        const db2 = await getDb();
        if (db2) {
          await db2.collection("users").updateOne(
            { _id: user._id },
            { $set: { lastLogin: /* @__PURE__ */ new Date() } }
          );
        }
        return done(null, {
          id: user._id.toString(),
          username: user.username,
          role: user.role || "employee",
          email: user.email,
          createdAt: user.createdAt
        });
      } catch (error) {
        return done(error);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await getUserById(id);
      if (!user) {
        return done(null, false);
      }
      done(null, {
        id: user._id.toString(),
        username: user.username,
        role: user.role || "employee",
        email: user.email,
        createdAt: user.createdAt
      });
    } catch (error) {
      done(error);
    }
  });
  app2.post("/api/login", loginLimiter, (req, res, next) => {
    passport.authenticate("local", async (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Invalid credentials" });
      }
      req.logIn(user, async (err2) => {
        if (err2) {
          return next(err2);
        }
        await logActivity(user.id, user.username, "login", {
          ipAddress: req.ip,
          userAgent: req.get("user-agent")
        });
        return res.status(200).json(user);
      });
    })(req, res, next);
  });
  app2.post("/api/logout", async (req, res, next) => {
    const user = req.user;
    req.logout((err) => {
      if (err) return next(err);
      if (user) {
        logActivity(user.id, user.username, "logout", {
          ipAddress: req.ip,
          userAgent: req.get("user-agent")
        }).catch((e) => console.error("Failed to log logout:", e));
      }
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You don't have permission to access this resource"
      });
    }
    next();
  };
}

// server/routes.ts
import { MongoClient as MongoClient3, ObjectId as ObjectId3 } from "mongodb";
import { fromZodError } from "zod-validation-error";
async function registerRoutes(app2) {
  setupAuth(app2);
  app2.post("/api/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters long" });
      }
      const username = req.user?.username;
      if (!username) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const user = await getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const isValidPassword = await comparePasswords(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
      const hashedNewPassword = await hashPassword(newPassword);
      const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
      if (!mongoUri) {
        return res.status(500).json({ error: "Database not configured" });
      }
      let finalUri = mongoUri;
      if (!mongoUri.includes("retryWrites")) {
        const separator = mongoUri.includes("?") ? "&" : "?";
        finalUri = `${mongoUri}${separator}retryWrites=true&w=majority`;
      }
      const client3 = new MongoClient3(finalUri, {
        serverSelectionTimeoutMS: 1e4,
        connectTimeoutMS: 15e3,
        tls: true,
        tlsAllowInvalidCertificates: true
      });
      await client3.connect();
      const db2 = client3.db("adsc_reports");
      const usersCollection = db2.collection("users");
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { password: hashedNewPassword } }
      );
      await client3.close();
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/reports", async (req, res) => {
    try {
      const reportData = {
        ...req.body,
        createdBy: req.user?.id,
        createdByUsername: req.user?.username
      };
      const validatedData = insertReportSchema.parse(reportData);
      const report = await storage.createReport(validatedData);
      if (req.user) {
        await logActivity(req.user.id, req.user.username, "report_created", {
          resourceType: "report",
          resourceId: report.id,
          metadata: { date: report.date },
          ipAddress: req.ip,
          userAgent: req.get("user-agent")
        });
      }
      res.json(report);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.get("/api/reports", async (req, res) => {
    try {
      const reports = await storage.getReports();
      if (req.user?.role === "employee") {
        const filteredReports = reports.filter((r) => r.createdBy === req.user?.id);
        return res.json(filteredReports);
      }
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/reports/:id", async (req, res) => {
    try {
      const report = await storage.getReportById(req.params.id);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      if (req.user?.role === "employee" && report.createdBy !== req.user?.id) {
        return res.status(403).json({ error: "Forbidden: You can only access reports you created" });
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/reports/date/:date", async (req, res) => {
    try {
      const reports = await storage.getReportsByDate(req.params.date);
      if (req.user?.role === "employee") {
        const filteredReports = reports.filter((r) => r.createdBy === req.user?.id);
        return res.json(filteredReports);
      }
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.put("/api/reports/:id", async (req, res) => {
    try {
      const reportId = req.params.id;
      const reportData = req.body;
      const result = await storage.updateReport(reportId, reportData);
      if (req.user) {
        await logActivity(req.user.id, req.user.username, "report_updated", {
          resourceType: "report",
          resourceId: reportId,
          ipAddress: req.ip,
          userAgent: req.get("user-agent")
        });
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.delete("/api/reports/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const reportId = req.params.id;
      const result = await storage.deleteReport(reportId);
      if (req.user) {
        await logActivity(req.user.id, req.user.username, "report_deleted", {
          resourceType: "report",
          resourceId: reportId,
          ipAddress: req.ip,
          userAgent: req.get("user-agent")
        });
      }
      res.json({ success: true, message: "Report deleted successfully" });
    } catch (error) {
      const statusCode = error.message === "Report not found" ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  });
  app2.get("/api/users", requireRole("admin"), async (req, res) => {
    try {
      const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
      if (!mongoUri) {
        return res.status(500).json({ error: "Database not configured" });
      }
      let finalUri = mongoUri;
      if (!mongoUri.includes("retryWrites")) {
        const separator = mongoUri.includes("?") ? "&" : "?";
        finalUri = `${mongoUri}${separator}retryWrites=true&w=majority`;
      }
      const client3 = new MongoClient3(finalUri, {
        serverSelectionTimeoutMS: 1e4,
        connectTimeoutMS: 15e3,
        tls: true,
        tlsAllowInvalidCertificates: true
      });
      await client3.connect();
      const db2 = client3.db("adsc_reports");
      const usersCollection = db2.collection("users");
      const users = await usersCollection.find({}, { projection: { password: 0 } }).sort({ createdAt: -1 }).toArray();
      await client3.close();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/users", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const validationResult = insertUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: fromZodError(validationResult.error).message
        });
      }
      const { username, password, email, role } = validationResult.data;
      const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
      if (!mongoUri) {
        return res.status(500).json({ error: "Database not configured" });
      }
      let finalUri = mongoUri;
      if (!mongoUri.includes("retryWrites")) {
        const separator = mongoUri.includes("?") ? "&" : "?";
        finalUri = `${mongoUri}${separator}retryWrites=true&w=majority`;
      }
      const client3 = new MongoClient3(finalUri, {
        serverSelectionTimeoutMS: 1e4,
        connectTimeoutMS: 15e3,
        tls: true,
        tlsAllowInvalidCertificates: true
      });
      await client3.connect();
      const db2 = client3.db("adsc_reports");
      const usersCollection = db2.collection("users");
      const existingUser = await usersCollection.findOne({ username });
      if (existingUser) {
        await client3.close();
        return res.status(400).json({ error: "Username already exists" });
      }
      const hashedPassword = await hashPassword(password);
      const newUser = {
        username,
        password: hashedPassword,
        email: email || void 0,
        role: role || "employee",
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      };
      const result = await usersCollection.insertOne(newUser);
      await client3.close();
      if (req.user) {
        await logActivity(req.user.id, req.user.username, "user_created", {
          resourceType: "user",
          resourceId: result.insertedId.toString(),
          metadata: { username, role: role || "employee" },
          ipAddress: req.ip,
          userAgent: req.get("user-agent")
        });
      }
      res.json({
        id: result.insertedId.toString(),
        username,
        email,
        role: role || "employee",
        message: "User created successfully"
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.put("/api/users/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const userId = req.params.id;
      const validationResult = updateUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: fromZodError(validationResult.error).message
        });
      }
      const { email, role, isActive } = validationResult.data;
      if (req.user?.id === userId && role && role !== req.user.role) {
        return res.status(400).json({ error: "Cannot change your own role" });
      }
      const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
      if (!mongoUri) {
        return res.status(500).json({ error: "Database not configured" });
      }
      let finalUri = mongoUri;
      if (!mongoUri.includes("retryWrites")) {
        const separator = mongoUri.includes("?") ? "&" : "?";
        finalUri = `${mongoUri}${separator}retryWrites=true&w=majority`;
      }
      const client3 = new MongoClient3(finalUri, {
        serverSelectionTimeoutMS: 1e4,
        connectTimeoutMS: 15e3,
        tls: true,
        tlsAllowInvalidCertificates: true
      });
      await client3.connect();
      const db2 = client3.db("adsc_reports");
      const usersCollection = db2.collection("users");
      const updateData = {};
      if (email !== void 0) updateData.email = email;
      if (role !== void 0) updateData.role = role;
      if (isActive !== void 0) updateData.isActive = isActive;
      const result = await usersCollection.updateOne(
        { _id: new ObjectId3(userId) },
        { $set: updateData }
      );
      await client3.close();
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      if (req.user) {
        await logActivity(req.user.id, req.user.username, "user_updated", {
          resourceType: "user",
          resourceId: userId,
          metadata: updateData,
          ipAddress: req.ip,
          userAgent: req.get("user-agent")
        });
      }
      res.json({ message: "User updated successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.delete("/api/users/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const userId = req.params.id;
      if (req.user?.id === userId) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }
      const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
      if (!mongoUri) {
        return res.status(500).json({ error: "Database not configured" });
      }
      let finalUri = mongoUri;
      if (!mongoUri.includes("retryWrites")) {
        const separator = mongoUri.includes("?") ? "&" : "?";
        finalUri = `${mongoUri}${separator}retryWrites=true&w=majority`;
      }
      const client3 = new MongoClient3(finalUri, {
        serverSelectionTimeoutMS: 1e4,
        connectTimeoutMS: 15e3,
        tls: true,
        tlsAllowInvalidCertificates: true
      });
      await client3.connect();
      const db2 = client3.db("adsc_reports");
      const usersCollection = db2.collection("users");
      const result = await usersCollection.deleteOne({ _id: new ObjectId3(userId) });
      await client3.close();
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      if (req.user) {
        await logActivity(req.user.id, req.user.username, "user_deleted", {
          resourceType: "user",
          resourceId: userId,
          ipAddress: req.ip,
          userAgent: req.get("user-agent")
        });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/activity-logs", requireAuth, requireRole("admin", "manager"), async (req, res) => {
    try {
      const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
      if (!mongoUri) {
        return res.status(500).json({ error: "Database not configured" });
      }
      let finalUri = mongoUri;
      if (!mongoUri.includes("retryWrites")) {
        const separator = mongoUri.includes("?") ? "&" : "?";
        finalUri = `${mongoUri}${separator}retryWrites=true&w=majority`;
      }
      const client3 = new MongoClient3(finalUri, {
        serverSelectionTimeoutMS: 1e4,
        connectTimeoutMS: 15e3,
        tls: true,
        tlsAllowInvalidCertificates: true
      });
      await client3.connect();
      const db2 = client3.db("adsc_reports");
      const activityLogsCollection = db2.collection("activity_logs");
      const limit = parseInt(req.query.limit) || 100;
      const userId = req.query.userId;
      const filter = userId ? { userId } : {};
      const logs = await activityLogsCollection.find(filter).sort({ timestamp: -1 }).limit(limit).toArray();
      await client3.close();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: "0.0.0.0",
    port: 5e3,
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`\x1B[36m${formattedTime}\x1B[0m [\x1B[35m${source}\x1B[0m] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  },
  crossOriginEmbedderPolicy: false
}));
app.use(express2.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
