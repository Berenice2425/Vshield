const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// We want to move the mongoose connection and bootstrap logic into startServer().
// First, let's remove it from the top level.

const mongoStart = code.indexOf('if (MONGODB_URI) {\n  mongoose');
const asyncFuncStart = code.indexOf('async function startServer() {');

if (mongoStart !== -1 && asyncFuncStart !== -1) {
    const mongooseBlock = code.substring(mongoStart, asyncFuncStart);
    code = code.replace(mongooseBlock, '\n// Mongoose connection moved inside startServer\n');
    
    // Now insert it inside startServer()
    const appDef = '  const app = express();\n';
    const insertPos = code.indexOf(appDef) + appDef.length;
    
    let newMongooseBlock = `
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
      console.log(\`BOOTSTRAP VARIABLES PRESENT: \${hasBootstrapVars ? 'YES' : 'NO'}\`);
      
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
`;
    code = code.substring(0, insertPos) + newMongooseBlock + code.substring(insertPos);
    fs.writeFileSync('server.ts', code);
    console.log("Patch applied");
} else {
    console.log("Could not find blocks");
}
