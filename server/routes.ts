import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertReportSchema, insertUserSchema, updateUserSchema, insertCustomRoleSchema, defaultRolePermissions } from "@shared/schema";
import { setupAuth, requireAuth, requireRole, requireAdmin, hashPassword, comparePasswords, getUserByUsername, logActivity } from "./auth";
import { MongoClient, ObjectId } from "mongodb";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Change password endpoint
  app.post("/api/change-password", requireAuth, async (req: Request, res: Response) => {
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
      if (!mongoUri.includes('retryWrites')) {
        const separator = mongoUri.includes('?') ? '&' : '?';
        finalUri = `${mongoUri}${separator}retryWrites=true&w=majority`;
      }

      const client = new MongoClient(finalUri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 15000,
        tls: true,
        tlsAllowInvalidCertificates: true,
      });

      await client.connect();
      const db = client.db('adsc_reports');
      const usersCollection = db.collection('users');

      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { password: hashedNewPassword } }
      );

      await client.close();

      res.json({ message: "Password changed successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/reports", requireAuth, async (req: Request, res: Response) => {
    try {
      const reportData = {
        ...req.body,
        createdBy: req.user?.id,
        createdByUsername: req.user?.username,
      };
      
      const validatedData = insertReportSchema.parse(reportData);
      const report = await storage.createReport(validatedData);
      
      if (req.user) {
        await logActivity(req.user.id, req.user.username, "report_created", {
          resourceType: "report",
          resourceId: report.id,
          metadata: { date: report.date },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });
      }
      
      res.json(report);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/reports", requireAuth, async (req: Request, res: Response) => {
    try {
      const reports = await storage.getReports();
      
      if (req.user?.role === "employee") {
        const filteredReports = reports.filter(r => r.createdBy === req.user?.id);
        return res.json(filteredReports);
      }
      
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const report = await storage.getReportById(req.params.id);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      
      if (req.user?.role === "employee" && report.createdBy !== req.user?.id) {
        return res.status(403).json({ error: "Forbidden: You can only access reports you created" });
      }
      
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports/date/:date", requireAuth, async (req: Request, res: Response) => {
    try {
      const reports = await storage.getReportsByDate(req.params.date);
      
      if (req.user?.role === "employee") {
        const filteredReports = reports.filter(r => r.createdBy === req.user?.id);
        return res.json(filteredReports);
      }
      
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update a report (requires authentication)
  app.put("/api/reports/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const reportId = req.params.id;
      const reportData = req.body;
      const result = await storage.updateReport(reportId, reportData);
      
      if (req.user) {
        await logActivity(req.user.id, req.user.username, "report_updated", {
          resourceType: "report",
          resourceId: reportId,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });
      }
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Delete a report (admin only)
  app.delete("/api/reports/:id", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const reportId = req.params.id;
      const result = await storage.deleteReport(reportId);
      
      if (req.user) {
        await logActivity(req.user.id, req.user.username, "report_deleted", {
          resourceType: "report",
          resourceId: reportId,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });
      }
      
      res.json({ success: true, message: "Report deleted successfully" });
    } catch (error: any) {
      const statusCode = error.message === 'Report not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  });


  // User Management Routes (Admin only)
  
  // Get all users (Admin only)
  app.get("/api/users", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
      if (!mongoUri) {
        return res.status(500).json({ error: "Database not configured" });
      }

      let finalUri = mongoUri;
      if (!mongoUri.includes('retryWrites')) {
        const separator = mongoUri.includes('?') ? '&' : '?';
        finalUri = `${mongoUri}${separator}retryWrites=true&w=majority`;
      }

      const client = new MongoClient(finalUri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 15000,
        tls: true,
        tlsAllowInvalidCertificates: true,
      });

      await client.connect();
      const db = client.db('adsc_reports');
      const usersCollection = db.collection('users');
      
      const users = await usersCollection
        .find({}, { projection: { password: 0 } })
        .sort({ createdAt: -1 })
        .toArray();
      
      await client.close();
      
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create new user (Admin only)
  app.post("/api/users", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
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
      if (!mongoUri.includes('retryWrites')) {
        const separator = mongoUri.includes('?') ? '&' : '?';
        finalUri = `${mongoUri}${separator}retryWrites=true&w=majority`;
      }

      const client = new MongoClient(finalUri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 15000,
        tls: true,
        tlsAllowInvalidCertificates: true,
      });

      await client.connect();
      const db = client.db('adsc_reports');
      const usersCollection = db.collection('users');
      
      const existingUser = await usersCollection.findOne({ username });
      if (existingUser) {
        await client.close();
        return res.status(400).json({ error: "Username already exists" });
      }
      
      const hashedPassword = await hashPassword(password);
      const newUser = {
        username,
        password: hashedPassword,
        email: email || undefined,
        role: role || 'employee',
        isActive: true,
        createdAt: new Date(),
      };
      
      const result = await usersCollection.insertOne(newUser);
      await client.close();
      
      if (req.user) {
        await logActivity(req.user.id, req.user.username, "user_created", {
          resourceType: "user",
          resourceId: result.insertedId.toString(),
          metadata: { username, role: role || 'employee' },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });
      }
      
      res.json({ 
        id: result.insertedId.toString(),
        username,
        email,
        role: role || 'employee',
        message: "User created successfully" 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update user (Admin only)
  app.put("/api/users/:id", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
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
      if (!mongoUri.includes('retryWrites')) {
        const separator = mongoUri.includes('?') ? '&' : '?';
        finalUri = `${mongoUri}${separator}retryWrites=true&w=majority`;
      }

      const client = new MongoClient(finalUri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 15000,
        tls: true,
        tlsAllowInvalidCertificates: true,
      });

      await client.connect();
      const db = client.db('adsc_reports');
      const usersCollection = db.collection('users');
      
      const updateData: any = {};
      if (email !== undefined) updateData.email = email;
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;
      
      const result = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateData }
      );
      
      await client.close();
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (req.user) {
        await logActivity(req.user.id, req.user.username, "user_updated", {
          resourceType: "user",
          resourceId: userId,
          metadata: updateData,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });
      }
      
      res.json({ message: "User updated successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete user (Admin only)
  app.delete("/api/users/:id", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
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
      if (!mongoUri.includes('retryWrites')) {
        const separator = mongoUri.includes('?') ? '&' : '?';
        finalUri = `${mongoUri}${separator}retryWrites=true&w=majority`;
      }

      const client = new MongoClient(finalUri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 15000,
        tls: true,
        tlsAllowInvalidCertificates: true,
      });

      await client.connect();
      const db = client.db('adsc_reports');
      const usersCollection = db.collection('users');
      
      const result = await usersCollection.deleteOne({ _id: new ObjectId(userId) });
      await client.close();
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (req.user) {
        await logActivity(req.user.id, req.user.username, "user_deleted", {
          resourceType: "user",
          resourceId: userId,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });
      }
      
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Change user password (Admin only)
  app.post("/api/users/:id/change-password", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({ error: "New password is required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long" });
      }

      const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
      if (!mongoUri) {
        return res.status(500).json({ error: "Database not configured" });
      }

      let finalUri = mongoUri;
      if (!mongoUri.includes('retryWrites')) {
        const separator = mongoUri.includes('?') ? '&' : '?';
        finalUri = `${mongoUri}${separator}retryWrites=true&w=majority`;
      }

      const client = new MongoClient(finalUri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 15000,
        tls: true,
        tlsAllowInvalidCertificates: true,
      });

      await client.connect();
      const db = client.db('adsc_reports');
      const usersCollection = db.collection('users');

      const hashedPassword = await hashPassword(newPassword);
      const result = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { password: hashedPassword } }
      );

      await client.close();

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      if (req.user) {
        await logActivity(req.user.id, req.user.username, "user_password_changed", {
          resourceType: "user",
          resourceId: userId,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });
      }

      res.json({ message: "Password changed successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Activity Log Routes (Admin/Manager only - PROTECTED)
  app.get("/api/activity-logs", requireAuth, requireRole("admin", "manager"), async (req: Request, res: Response) => {
    try {
      const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
      if (!mongoUri) {
        return res.status(500).json({ error: "Database not configured" });
      }

      let finalUri = mongoUri;
      if (!mongoUri.includes('retryWrites')) {
        const separator = mongoUri.includes('?') ? '&' : '?';
        finalUri = `${mongoUri}${separator}retryWrites=true&w=majority`;
      }

      const client = new MongoClient(finalUri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 15000,
        tls: true,
        tlsAllowInvalidCertificates: true,
      });

      await client.connect();
      const db = client.db('adsc_reports');
      const activityLogsCollection = db.collection('activity_logs');
      
      const limit = parseInt(req.query.limit as string) || 100;
      const userId = req.query.userId as string;
      
      const filter = userId ? { userId } : {};
      
      const logs = await activityLogsCollection
        .find(filter)
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      
      await client.close();
      
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Custom Roles Management (Admin only)
  
  // Get all roles (including system and custom)
  app.get("/api/roles", requireAuth, async (req: Request, res: Response) => {
    try {
      const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
      if (!mongoUri) {
        return res.status(500).json({ error: "Database not configured" });
      }

      let finalUri = mongoUri;
      if (!mongoUri.includes('retryWrites')) {
        const separator = mongoUri.includes('?') ? '&' : '?';
        finalUri = `${mongoUri}${separator}retryWrites=true&w=majority`;
      }

      const client = new MongoClient(finalUri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 15000,
        tls: true,
        tlsAllowInvalidCertificates: true,
      });

      await client.connect();
      const db = client.db('adsc_reports');
      const rolesCollection = db.collection('roles');
      
      const customRoles = await rolesCollection.find({}).sort({ createdAt: -1 }).toArray();
      await client.close();
      
      const systemRoles = [
        { id: 'admin', name: 'Admin', description: 'Full system access', permissions: defaultRolePermissions.admin, isSystem: true },
        { id: 'manager', name: 'Manager', description: 'Can manage reports and view activity', permissions: defaultRolePermissions.manager, isSystem: true },
        { id: 'employee', name: 'Employee', description: 'Can create and view own reports', permissions: defaultRolePermissions.employee, isSystem: true },
      ];
      
      const allRoles = [
        ...systemRoles,
        ...customRoles.map(r => ({ ...r, id: r._id.toString() }))
      ];
      
      res.json(allRoles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create custom role (Admin only)
  app.post("/api/roles", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const validationResult = insertCustomRoleSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: fromZodError(validationResult.error).message 
        });
      }
      
      const { name, description, permissions } = validationResult.data;
      
      const systemRoleNames = ['admin', 'manager', 'employee'];
      if (systemRoleNames.includes(name.toLowerCase())) {
        return res.status(400).json({ error: "Cannot create role with system role name" });
      }

      const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
      if (!mongoUri) {
        return res.status(500).json({ error: "Database not configured" });
      }

      let finalUri = mongoUri;
      if (!mongoUri.includes('retryWrites')) {
        const separator = mongoUri.includes('?') ? '&' : '?';
        finalUri = `${mongoUri}${separator}retryWrites=true&w=majority`;
      }

      const client = new MongoClient(finalUri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 15000,
        tls: true,
        tlsAllowInvalidCertificates: true,
      });

      await client.connect();
      const db = client.db('adsc_reports');
      const rolesCollection = db.collection('roles');
      
      const existingRole = await rolesCollection.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (existingRole) {
        await client.close();
        return res.status(400).json({ error: "Role with this name already exists" });
      }
      
      const newRole = {
        name,
        description: description || '',
        permissions,
        isSystem: false,
        createdAt: new Date(),
        createdBy: req.user?.id,
      };
      
      const result = await rolesCollection.insertOne(newRole);
      await client.close();
      
      if (req.user) {
        await logActivity(req.user.id, req.user.username, "role_created", {
          resourceType: "role",
          resourceId: result.insertedId.toString(),
          metadata: { name, permissions },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });
      }
      
      res.json({ 
        id: result.insertedId.toString(),
        name,
        description,
        permissions,
        message: "Role created successfully" 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update custom role (Admin only)
  app.put("/api/roles/:id", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const roleId = req.params.id;
      
      const systemRoleIds = ['admin', 'manager', 'employee'];
      if (systemRoleIds.includes(roleId)) {
        return res.status(400).json({ error: "Cannot modify system roles" });
      }
      
      const { name, description, permissions } = req.body;

      const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
      if (!mongoUri) {
        return res.status(500).json({ error: "Database not configured" });
      }

      let finalUri = mongoUri;
      if (!mongoUri.includes('retryWrites')) {
        const separator = mongoUri.includes('?') ? '&' : '?';
        finalUri = `${mongoUri}${separator}retryWrites=true&w=majority`;
      }

      const client = new MongoClient(finalUri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 15000,
        tls: true,
        tlsAllowInvalidCertificates: true,
      });

      await client.connect();
      const db = client.db('adsc_reports');
      const rolesCollection = db.collection('roles');
      
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (permissions !== undefined) updateData.permissions = permissions;
      
      const result = await rolesCollection.updateOne(
        { _id: new ObjectId(roleId) },
        { $set: updateData }
      );
      
      await client.close();
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Role not found" });
      }
      
      if (req.user) {
        await logActivity(req.user.id, req.user.username, "role_updated", {
          resourceType: "role",
          resourceId: roleId,
          metadata: updateData,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });
      }
      
      res.json({ message: "Role updated successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete custom role (Admin only)
  app.delete("/api/roles/:id", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const roleId = req.params.id;
      
      const systemRoleIds = ['admin', 'manager', 'employee'];
      if (systemRoleIds.includes(roleId)) {
        return res.status(400).json({ error: "Cannot delete system roles" });
      }

      const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
      if (!mongoUri) {
        return res.status(500).json({ error: "Database not configured" });
      }

      let finalUri = mongoUri;
      if (!mongoUri.includes('retryWrites')) {
        const separator = mongoUri.includes('?') ? '&' : '?';
        finalUri = `${mongoUri}${separator}retryWrites=true&w=majority`;
      }

      const client = new MongoClient(finalUri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 15000,
        tls: true,
        tlsAllowInvalidCertificates: true,
      });

      await client.connect();
      const db = client.db('adsc_reports');
      const rolesCollection = db.collection('roles');
      const usersCollection = db.collection('users');
      
      const role = await rolesCollection.findOne({ _id: new ObjectId(roleId) });
      if (!role) {
        await client.close();
        return res.status(404).json({ error: "Role not found" });
      }
      
      const usersWithRole = await usersCollection.countDocuments({ role: role.name });
      if (usersWithRole > 0) {
        await client.close();
        return res.status(400).json({ 
          error: `Cannot delete role: ${usersWithRole} user(s) are assigned to this role. Please reassign them first.` 
        });
      }
      
      await rolesCollection.deleteOne({ _id: new ObjectId(roleId) });
      await client.close();
      
      if (req.user) {
        await logActivity(req.user.id, req.user.username, "role_deleted", {
          resourceType: "role",
          resourceId: roleId,
          metadata: { name: role.name },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });
      }
      
      res.json({ message: "Role deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get role permissions for a specific role
  app.get("/api/roles/:roleId/permissions", requireAuth, async (req: Request, res: Response) => {
    try {
      const roleId = req.params.roleId;
      
      if (defaultRolePermissions[roleId]) {
        return res.json(defaultRolePermissions[roleId]);
      }

      const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
      if (!mongoUri) {
        return res.status(500).json({ error: "Database not configured" });
      }

      let finalUri = mongoUri;
      if (!mongoUri.includes('retryWrites')) {
        const separator = mongoUri.includes('?') ? '&' : '?';
        finalUri = `${mongoUri}${separator}retryWrites=true&w=majority`;
      }

      const client = new MongoClient(finalUri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 15000,
        tls: true,
        tlsAllowInvalidCertificates: true,
      });

      await client.connect();
      const db = client.db('adsc_reports');
      const rolesCollection = db.collection('roles');
      
      let role = null;
      if (ObjectId.isValid(roleId)) {
        role = await rolesCollection.findOne({ _id: new ObjectId(roleId) });
      }
      if (!role) {
        role = await rolesCollection.findOne({ name: roleId });
      }
      
      await client.close();
      
      if (!role) {
        return res.json(defaultRolePermissions.employee);
      }
      
      res.json(role.permissions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk Restore Reports (Admin only - PROTECTED)
  app.post("/api/reports/bulk-restore", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { reports } = req.body;
      
      if (!Array.isArray(reports)) {
        return res.status(400).json({ error: "Reports must be an array" });
      }

      if (reports.length === 0) {
        return res.status(400).json({ error: "No reports to restore" });
      }

      const createdReports = [];
      const errors = [];

      for (const reportData of reports) {
        try {
          const enrichedData = {
            ...reportData,
            createdBy: req.user?.id,
            createdByUsername: req.user?.username,
          };
          
          const validatedData = insertReportSchema.parse(enrichedData);
          const report = await storage.createReport(validatedData);
          createdReports.push(report);
        } catch (error: any) {
          errors.push({ date: reportData.date, error: error.message });
        }
      }

      if (req.user) {
        await logActivity(req.user.id, req.user.username, "report_created", {
          resourceType: "bulk_restore",
          metadata: { 
            totalReports: reports.length,
            successCount: createdReports.length,
            errorCount: errors.length
          },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });
      }

      res.json({
        success: true,
        restored: createdReports.length,
        total: reports.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
