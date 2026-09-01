import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import mongoose from "mongoose";
import multer from "multer";
import { BlobServiceClient } from "@azure/storage-blob";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserModel from "./models/User.js";
import VehicleModel from "./models/Vehicle.js";
import AlertModel from "./models/Alert.js";
import BiometricLog from "./models/BiometricLog.js";

dotenv.config();

const upload = multer({ storage: multer.memoryStorage() });

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const AZURE_STORAGE_CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME || "vshield";

let blobServiceClient: BlobServiceClient | null = null;
if (AZURE_STORAGE_CONNECTION_STRING) {
  try {
    blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    console.log("Connected to Azure Storage");
  } catch (e) {
    console.error("Failed to initialize Azure Storage:", e);
  }
} else {
  console.warn("AZURE_STORAGE_CONNECTION_STRING not found. File uploads will be mocked.");
}

// Models are now imported from the /models directory

import crypto from "crypto";
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGOBD_URI;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.JWT_SECRET) {
  console.warn("JWT_SECRET is not set. A random secret will be used, but all sessions will be invalidated upon server restart.");
}


// Mongoose connection moved inside startServer
async function startServer() {
  const app = express();

  console.log("SERVER ENTRY EXECUTED");
  if (MONGODB_URI) {
    console.log("MONGODB CONNECTION ATTEMPTED");
    try {
      await mongoose.connect(MONGODB_URI);
      console.log("MONGODB CONNECTED");
      
      const count = await UserModel.countDocuments();
      if (count === 0) {
        if (process.env.INITIAL_ADMIN_PASSWORD) {
          const hashedPassword = await bcrypt.hash(process.env.INITIAL_ADMIN_PASSWORD, 10);
          const admin = await UserModel.create({
            email: process.env.INITIAL_ADMIN_EMAIL || "manager@vshield.ng",
            password: hashedPassword,
            name: "Fleet Manager",
          });
          await VehicleModel.create([
            { name: "Toyota Hilux", plate_number: "KJA-234AB", status: "Armed", user_id: admin._id },
            { name: "Honda Accord", plate_number: "LSD-123XY", status: "Driving", user_id: admin._id },
          ]);
          console.log("Database seeded");
        }
      }

      const hasBootstrapVars = Boolean(process.env.BOOTSTRAP_ADMIN_EMAIL && process.env.BOOTSTRAP_ADMIN_PASSWORD);
      console.log(`BOOTSTRAP VARIABLES PRESENT: ${hasBootstrapVars ? 'YES' : 'NO'}`);
      
      if (hasBootstrapVars) {
        console.log("BOOTSTRAP FUNCTION ENTERED");
        const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase().trim();
        const existingAdmin = await UserModel.findOne({ email: bootstrapEmail });
        const hashedBootstrapPassword = await bcrypt.hash(process.env.BOOTSTRAP_ADMIN_PASSWORD, 10);
        
        if (existingAdmin) {
          existingAdmin.password = hashedBootstrapPassword;
          await existingAdmin.save();
        } else {
          await UserModel.create({
            email: bootstrapEmail,
            password: hashedBootstrapPassword,
            name: "Bootstrap Admin",
          });
        }
        console.log("BOOTSTRAP COMPLETE");
      }
    } catch (err) {
      console.error("MongoDB connection error:", err);
    }
  } else {
    console.warn("MONGODB_URI not found.");
  }
  const PORT = 3000;

  app.use(express.json());

  // API routes
  const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.headers.authorization;
    if (!token || !token.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (MONGODB_URI) {
      try {
        const tokenString = token.split(" ")[1];
        const decoded = jwt.verify(tokenString, JWT_SECRET) as { userId: string };
        const userId = decoded.userId;
        
        if (!userId) return res.status(401).json({ error: "Unauthorized" });
        const user = await UserModel.findById(userId);
        if (!user) return res.status(401).json({ error: "Unauthorized" });
        (req as any).user = user;
        next();
      } catch (err) {
        return res.status(401).json({ error: "Unauthorized" });
      }
    } else {
      if (token === "Bearer mock-jwt-token") {
        (req as any).user = { name: "Fleet Manager", email: "manager@vshield.ng" };
        next();
      } else {
        return res.status(401).json({ error: "Unauthorized" });
      }
    }
  };

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  let ai: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  app.post("/api/ai/analyze-threat", authMiddleware, async (req, res) => {
    try {
      const { location, time, movement_pattern } = req.body;
      
      if (!ai) {
        return res.json({
          success: true,
          riskScore: 85,
          reasoning: "[MOCK ANALYSIS - GEMINI NOT CONFIGURED] The combination of high-risk zone and erratic movement at 2AM suggests a severe security threat.",
          recommendation: "Immobilize the vehicle immediately and dispatch security personnel."
        });
      }

      const prompt = `Analyze security context: Location: ${location} Time: ${time} Movement: ${movement_pattern}
      Return JSON with riskScore (0-100), reasoning (string), recommendation (string). Make sure the JSON is clean and strictly matches the schema.`;

      let parsedResponse;
      let attempt = 0;
      const maxRetries = 2;
      
      while (attempt <= maxRetries) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.7-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  riskScore: { type: Type.NUMBER },
                  reasoning: { type: Type.STRING },
                  recommendation: { type: Type.STRING },
                },
                required: ["riskScore", "reasoning", "recommendation"],
              },
            },
          });
          parsedResponse = JSON.parse(response.text || "{}");
          break; // Success
        } catch (error: any) {
          const status = error?.status || error?.response?.status;
          const errorMessage = error?.message?.toLowerCase() || "";
          const rawError = JSON.stringify(error) || "";
          
          const isTransient = status === 429 || status === 503 || 
                             errorMessage.includes("429") || errorMessage.includes("503") || 
                             errorMessage.includes("high demand") || errorMessage.includes("overloaded") || 
                             errorMessage.includes("resource_exhausted") || errorMessage.includes("unavailable") ||
                             errorMessage.includes("too many requests") || errorMessage.includes("temporarily") ||
                             rawError.includes("503") || rawError.includes("429");
          
          if (!isTransient) {
            throw error; // Bubble up permanent error
          }
          
          if (attempt < maxRetries) {
            attempt++;
            const backoffTime = Math.pow(2, attempt) * 500;
            console.log(`Gemini API transient error. Retrying in ${backoffTime}ms (Attempt ${attempt}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
          } else {
            return res.status(503).json({
              success: false,
              error: "AI_SERVICE_TEMPORARILY_UNAVAILABLE",
              message: "Gemini is temporarily busy. Please try the analysis again in a moment.",
              retryable: true
            });
          }
        }
      }
      
      const normalizedResponse = {
        success: true,
        riskScore: Number(parsedResponse.riskScore) || (parsedResponse.risk_score != null ? Number(parsedResponse.risk_score) * 100 : 0),
        reasoning: parsedResponse.reasoning || "No reasoning provided.",
        recommendation: parsedResponse.recommendation || "No recommendation provided."
      };

      if (MONGODB_URI && normalizedResponse.riskScore >= 70) {
        try {
          const vehicle = await VehicleModel.findOne({ user_id: (req as any).user._id });
          if (vehicle) {
            await AlertModel.create({
              vehicle_id: vehicle._id,
              type: "Threat Detected",
              severity: normalizedResponse.riskScore >= 90 ? "Critical" : "High",
              message: normalizedResponse.reasoning,
              status: "Active",
              location: { address: location },
            });
          }
        } catch (dbErr) {
          console.error("Failed to create alert from threat analysis:", dbErr);
        }
      }

      res.json(normalizedResponse);
    } catch (error: any) {
      console.error("Threat analysis permanent error:", error.message);
      res.status(500).json({ success: false, error: "AI_ANALYSIS_FAILED", message: "Threat analysis could not be completed.", retryable: false });
    }
  });

  // Auth & Vehicle Routes
  let mockSession = false;
  let mockVehicles = [
    { id: 1, name: "Toyota Hilux", plate_number: "KJA-234AB", status: "Armed" },
    { id: 2, name: "Honda Accord", plate_number: "LSD-123XY", status: "Driving" },
  ];

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    
    if (MONGODB_URI) {
      try {
        const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
        if (user && user.password && await bcrypt.compare(password, user.password)) {
          const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '24h' });
          res.json({ success: true, token });
        } else {
          res.status(401).json({ error: "Invalid credentials" });
        }
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    } else {
      if (email && password) {
        mockSession = true;
        res.json({ success: true, token: "mock-jwt-token" });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    mockSession = false;
    res.json({ success: true });
  });

  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    res.json({ user: (req as any).user });
  });

  app.get("/api/vehicles", authMiddleware, async (req, res) => {
    if (MONGODB_URI) {
      try {
        // Only return vehicles for the current user
        const dbVehicles = await VehicleModel.find({ user_id: (req as any).user._id });
        res.json(dbVehicles.map((v: any) => ({ id: v._id, name: v.name, plate_number: v.plate_number, status: v.status })));
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    } else {
      res.json(mockVehicles);
    }
  });

  app.post("/api/vehicles", authMiddleware, async (req, res) => {
    if (!MONGODB_URI) return res.status(501).json({ error: "Not implemented in mock mode" });
    try {
      const { name, plate_number, status } = req.body;
      const newVehicle = await VehicleModel.create({
        name,
        plate_number,
        status,
        user_id: (req as any).user._id
      });
      res.json({ id: newVehicle._id, name: newVehicle.name, plate_number: newVehicle.plate_number, status: newVehicle.status });
    } catch (err: any) {
      if (err.code === 11000) {
        return res.status(400).json({ error: "A vehicle with this plate number already exists." });
      }
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/vehicles/:id", authMiddleware, async (req, res) => {
    if (!MONGODB_URI) return res.status(501).json({ error: "Not implemented in mock mode" });
    try {
      const { name, plate_number, status } = req.body;
      const vehicle = await VehicleModel.findOne({ _id: req.params.id, user_id: (req as any).user._id });
      if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
      
      if (name) vehicle.name = name;
      if (plate_number) vehicle.plate_number = plate_number;
      if (status) vehicle.status = status;
      
      await vehicle.save();
      res.json({ id: vehicle._id, name: vehicle.name, plate_number: vehicle.plate_number, status: vehicle.status });
    } catch (err: any) {
      if (err.code === 11000) {
        return res.status(400).json({ error: "A vehicle with this plate number already exists." });
      }
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/vehicles/:id", authMiddleware, async (req, res) => {
    if (!MONGODB_URI) return res.status(501).json({ error: "Not implemented in mock mode" });
    try {
      const vehicle = await VehicleModel.findOne({ _id: req.params.id, user_id: (req as any).user._id });
      if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
      
      await VehicleModel.deleteOne({ _id: vehicle._id });
      // Notice: We do not delete related alerts to preserve history
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/alerts", authMiddleware, async (req, res) => {
    if (MONGODB_URI) {
      try {
        // Fetch all vehicles owned by the current user
        const userVehicles = await VehicleModel.find({ user_id: (req as any).user._id });
        const vehicleIds = userVehicles.map(v => v._id);
        
        const dbAlerts = await AlertModel.find({ vehicle_id: { $in: vehicleIds } }).populate('vehicle_id', 'name plate_number').sort({ timestamp: -1 }).limit(50);
        res.json(dbAlerts.map((a: any) => ({
          id: a._id,
          vehicle: a.vehicle_id?.name || 'Unknown',
          plate: a.vehicle_id?.plate_number || 'Unknown',
          type: a.type,
          severity: a.severity,
          message: a.message,
          status: a.status,
          timestamp: a.timestamp,
          location: a.location
        })));
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    } else {
      res.json([
        { id: 1, vehicle: "Toyota Hilux", plate: "KJA-234AB", type: "Geofence Breach", severity: "High", message: "Left authorized zone", status: "Active", timestamp: new Date() }
      ]);
    }
  });

  app.put("/api/alerts/:id/status", authMiddleware, async (req, res) => {
    if (!MONGODB_URI) return res.status(501).json({ error: "Not implemented in mock mode" });
    try {
      const { status } = req.body;
      if (!['Active', 'Acknowledged', 'Resolved'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const alert = await AlertModel.findById(req.params.id).populate('vehicle_id');
      if (!alert) return res.status(404).json({ error: "Alert not found" });
      
      const vehicle = alert.vehicle_id as any;
      if (!vehicle || vehicle.user_id.toString() !== (req as any).user._id.toString()) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      alert.status = status;
      await alert.save();
      res.json({ success: true, status: alert.status });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/dashboard/stats", authMiddleware, async (req, res) => {
    if (MONGODB_URI) {
      try {
        const totalVehicles = await VehicleModel.countDocuments();
        const immobilized = await VehicleModel.countDocuments({ status: "Immobilized" });
        const activeAlerts = await AlertModel.countDocuments({ status: "Active" });
        res.json({
          totalVehicles,
          activeAlerts,
          immobilized,
        });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    } else {
      res.json({
        totalVehicles: mockVehicles.length,
        activeAlerts: 1,
        immobilized: mockVehicles.filter(v => v.status === "Immobilized").length
      });
    }
  });

  app.get("/api/biometrics/logs", authMiddleware, async (req, res) => {
    try {
      if (!MONGODB_URI) {
        return res.status(501).json({ error: "Not implemented in mock mode" });
      }

      // Fetch vehicles for the current user to tie logs to actual vehicles
      const vehicles = await VehicleModel.find({ user_id: (req as any).user._id });
      const vehicleIds = vehicles.map(v => v._id);

      const logs = await BiometricLog.find({ vehicle_id: { $in: vehicleIds } })
        .sort({ timestamp: -1 })
        .limit(50)
        .populate('vehicle_id', 'name plate_number');

      const events = logs.map(log => ({
        id: log._id.toString(),
        vehicleId: log.vehicle_id._id,
        vehicleName: (log.vehicle_id as any)?.name || 'Unknown Vehicle',
        plate_number: (log.vehicle_id as any)?.plate_number || 'Unknown Plate',
        eventType: "Face Verification", // Metadata context
        result: log.result,
        confidence: log.confidence / 100, // Frontend expects 0-1
        timestamp: log.timestamp.toISOString(),
        deviceId: log.device_id
      }));
      
      res.json({
        status: "success",
        events,
        azureConfigured: !!blobServiceClient
      });
    } catch (err: any) {
      console.error("Biometrics log fetch error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/biometrics/logs", async (req, res) => {
    // In production, this would be authenticated via edge-device certificates or API keys.
    // For VShield preview, we'll accept basic metadata.
    try {
      const { vehicle_id, result, confidence, timestamp, device_id } = req.body;
      if (!vehicle_id || !result || confidence === undefined) {
        return res.status(400).json({ error: "Missing required metadata" });
      }

      const log = await BiometricLog.create({
        vehicle_id,
        result,
        confidence, // Expects 0-100
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        device_id: device_id || 'EDGE-UNKNOWN'
      });

      res.status(201).json({ status: "logged", id: log._id });
    } catch (err) {
      console.error("Biometrics log save error:", err);
      res.status(500).json({ error: "Failed to save log" });
    }
  });

  app.post("/api/vehicles/:id/documents", authMiddleware, upload.single("file"), async (req, res) => {
    try {
      if (!blobServiceClient || !AZURE_STORAGE_CONTAINER_NAME) {
        return res.status(503).json({ error: "Azure Storage is not configured on the server." });
      }

      const vehicleId = req.params.id;
      const file = req.file;
      const { category } = req.body;

      if (!file) return res.status(400).json({ error: "No file provided" });

      // Validate ownership
      const vehicle = await VehicleModel.findOne({ _id: vehicleId, user_id: (req as any).user._id });
      if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });

      // Security: Prevent biometric files
      if (category === 'biometric' || file.mimetype.includes('biometric')) {
         return res.status(403).json({ error: "Biometric data upload is strictly forbidden." });
      }

      const allowedCategories = ['vehicle_photo', 'inspection_photo', 'registration_document', 'ownership_document', 'maintenance_document', 'incident_photo', 'incident_document'];
      const safeCategory = allowedCategories.includes(category) ? category : 'other_vehicle_document';

      const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER_NAME);
      
      // Enforce private container (no public access)
      await containerClient.createIfNotExists();

      const blobName = `${safeCategory}-${vehicleId}-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: { blobContentType: file.mimetype }
      });

      const documentMeta = {
        blobId: blobName,
        fileName: file.originalname,
        category: safeCategory,
        contentType: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
        url: `/api/vehicles/${vehicleId}/documents/${encodeURIComponent(blobName)}` // Proxy URL instead of direct Azure URL
      };

      vehicle.documents = vehicle.documents || [];
      vehicle.documents.push(documentMeta);
      await vehicle.save();

      res.status(201).json({ message: "Document uploaded successfully", document: documentMeta });
    } catch (err: any) {
      console.error("Azure upload error:", err);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  app.get("/api/vehicles/:id/documents/:blobId", authMiddleware, async (req, res) => {
    try {
      const vehicleId = req.params.id;
      const blobId = req.params.blobId;

      // Validate ownership
      const vehicle = await VehicleModel.findOne({ _id: vehicleId, user_id: (req as any).user._id });
      if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });

      const documentMeta = vehicle.documents.find(doc => doc.blobId === blobId);
      if (!documentMeta) return res.status(404).json({ error: "Document not found" });

      if (!blobServiceClient || !AZURE_STORAGE_CONTAINER_NAME) {
        return res.status(503).json({ error: "Azure Storage is not configured on the server." });
      }

      const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER_NAME);
      const blockBlobClient = containerClient.getBlockBlobClient(blobId);

      const downloadBlockBlobResponse = await blockBlobClient.download(0);
      
      res.setHeader('Content-Type', documentMeta.contentType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${documentMeta.fileName}"`);
      
      if (downloadBlockBlobResponse.readableStreamBody) {
        downloadBlockBlobResponse.readableStreamBody.pipe(res);
      } else {
        res.status(500).json({ error: "Failed to read document stream" });
      }
    } catch (err: any) {
      console.error("Azure download error:", err);
      res.status(500).json({ error: "Failed to download document" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }

  return app;
}

export const appPromise = startServer();

