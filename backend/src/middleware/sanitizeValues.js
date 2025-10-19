// middleware/sanitizeValues.js

export function sanitizeValues(req, res, next) {
  const checkValues = (obj) => {
    for (const key in obj) {
      const val = obj[key];
      if (typeof val === "object" && val !== null) {
        if (checkValues(val)) return true;
      } else if (typeof val === "string" && val.trim().startsWith("$")) {
        return true;
      }
    }
    return false;
  };

  if (checkValues(req.body)) {
    return res.status(400).json({ message: "Invalid input: contains MongoDB operator syntax" });
  }

  next();
}
