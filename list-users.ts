import mongoose from "mongoose";
import User from "./models/User.js";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const users = await User.find({});
  console.log("Users in DB:");
  users.forEach(u => console.log(`- Email: ${u.email}`));
  process.exit(0);
}
run().catch(console.error);
