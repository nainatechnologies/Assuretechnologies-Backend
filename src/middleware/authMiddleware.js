const { verifyToken } = require('../utils/jwt');

const authMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      if (req.user && (allowedRoles.length === 0 || allowedRoles.includes(req.user.role))) {
        return next();
      }

      let validUser = null;

      // 1. Prioritize explicitly provided Bearer token
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        const bearerToken = req.headers.authorization.split(' ')[1];
        try {
          const decoded = verifyToken(bearerToken);
          // Only accept the Bearer token if it matches allowedRoles (or if no roles are restricted)
          if (allowedRoles.length === 0 || allowedRoles.includes(decoded.role)) {
            validUser = decoded;
          }
        } catch (e) {
          // Bearer token is invalid/expired. 
        }
      }

      // 2. If Bearer token didn't yield a valid authorized user, check cookies
      console.log('ValidUser is', validUser, 'Allowed Roles', allowedRoles, 'req.user', req.user);
      if (!validUser) {
        const possibleCookies = [
          req.cookies?.admin_token,
          req.cookies?.customer_token,
          req.cookies?.partner_token,
          req.cookies?.vendor_token,
          req.cookies?.technician_token,
          req.cookies?.drone_token,
          req.cookies?.token
        ].filter(Boolean);

        for (const t of possibleCookies) {
          try {
            const decoded = verifyToken(t);
            if (allowedRoles.length === 0 || allowedRoles.includes(decoded.role)) {
              validUser = decoded;
              break; // Found a valid token that matches roles, stop searching
            }
          } catch (e) {
            // invalid token in loop, ignore
          }
        }
      }

      // 3. Evaluate results
      if (!validUser) {
        // No valid token found for the required roles. Can we fallback to guest?
        if (allowedRoles.includes('guest')) {
          req.user = null;
          return next();
        }
        
        // If guest is not allowed, check if there was AT LEAST some token provided
        const hasAnyToken = (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) || 
                            Object.keys(req.cookies || {}).some(k => k.includes('token'));
                            
        if (hasAnyToken) {
          return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });
        } else {
          return res.status(401).json({ success: false, message: 'Authorization token missing' });
        }
      }

      // 4. Success
      req.user = validUser;
      next();
    } catch (error) {
      console.error("Auth Middleware Error:", error);
      return res.status(500).json({ success: false, message: 'Internal Server Error in Auth Middleware' });
    }
  };
};

module.exports = authMiddleware;

