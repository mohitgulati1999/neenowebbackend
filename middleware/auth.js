import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const authMiddleware = (roles) => (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    console.log("No token provided");
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded);
    req.user = decoded;

    if (!roles.includes(req.user.role)) {
      console.log("Access Denied: Role not permitted");
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  } catch (error) {
    console.log("JWT Verification Failed:", error.message);
    res.status(401).json({ message: "Invalid token" });
  }
};

export default authMiddleware;
