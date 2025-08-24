import bcrypt from "bcryptjs";

const password = "admin";
const hash = await bcrypt.hash(password, 12);

console.log("New bcrypt hash:", hash);
