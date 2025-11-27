import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_EXPIRY = '7d'; // Token expires in 7 days

// Types
interface JWTPayload {
  username: string;
  role: 'admin';
  iat?: number;
  exp?: number;
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * POST /api/auth/login
 * Authenticate admin user
 *
 * Body: { username: string, password: string }
 * Response: { success: true, data: { token: string, user: { username, role } } }
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required',
      });
    }

    // Simple admin check - username must be "admin" and password must match env var
    if (username !== 'admin' || password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Create JWT token
    const payload: JWTPayload = {
      username: 'admin',
      role: 'admin',
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    res.json({
      success: true,
      data: {
        token,
        user: {
          username: 'admin',
          role: 'admin',
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 *
 * Note: Since we're using stateless JWT, logout is handled client-side.
 * This endpoint exists for future session invalidation if needed.
 */
router.post('/logout', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * GET /api/auth/check
 * Verify current authentication status
 *
 * Headers: Authorization: Bearer <token>
 * Response: { success: true, data: { authenticated: true, user: { username, role } } }
 */
router.get('/check', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({
      success: true,
      data: {
        authenticated: false,
      },
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    res.json({
      success: true,
      data: {
        authenticated: true,
        user: {
          username: decoded.username,
          role: decoded.role,
        },
      },
    });
  } catch (error) {
    // Token invalid or expired
    res.json({
      success: true,
      data: {
        authenticated: false,
      },
    });
  }
});

/**
 * Middleware: requireAuth
 * Protects routes that require authentication
 *
 * Usage: router.get('/protected', requireAuth, handler)
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
};

/**
 * Middleware: requireAdmin
 * Protects routes that require admin role
 *
 * Usage: router.get('/admin-only', requireAuth, requireAdmin, handler)
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }
  next();
};

export default router;