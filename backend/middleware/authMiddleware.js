const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization"); // Get token from header

  if (!token) {
    return res.status(401).json({ message: "Access Denied. No Token Provided" });
  }

  try {
    // 🔹 Remove "Bearer " prefix if present
    const tokenWithoutBearer = token.startsWith("Bearer ") ? token.split(" ")[1] : token;

    // 🔹 Verify token using JWT_SECRET
    const decoded = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded user info to req.user
    next(); // Proceed to next middleware
  } catch (error) {
    res.status(401).json({ message: "Invalid Token", error: error.message });
  }
};

module.exports = authMiddleware;
