const { verifyToken } = require('../utils/jwt');

const authMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      const possibleCookies = [
        req.cookies?.admin_token,
        req.cookies?.vendor_token,
        req.cookies?.technician_token,
        req.cookies?.drone_token,
        req.cookies?.customer_token,
        req.cookies?.token
      ].filter(Boolean);

      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        possibleCookies.push(req.headers.authorization.split(' ')[1]);
      }

      if (possibleCookies.length === 0) {
        return res.status(401).json({ success: false, message: 'Authorization token missing' });
      }

      let validUser = null;
      for (const t of possibleCookies) {
        try {
          const decoded = verifyToken(t);
          if (allowedRoles.length === 0 || allowedRoles.includes(decoded.role)) {
            validUser = decoded;
            break;
          }
        } catch (e) {
          // invalid token in loop, ignore
        }
      }

      if (!validUser) {
        return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });
      }

      req.user = validUser;
      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Token is invalid or expired' });
    }
  };
};

module.exports = authMiddleware;
