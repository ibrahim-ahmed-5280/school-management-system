const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const monitoringService = require('./services/monitoringService');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

const normalizeOrigin = (origin = '') => String(origin).trim().toLowerCase().replace(/\/+$/, '');
const defaultAllowedOrigins = [
    'https://school.nidwa.com',
    'https://www.school.nidwa.com',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
];
const allowedOrigins = (process.env.CORS_ORIGINS || defaultAllowedOrigins.join(','))
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const normalized = normalizeOrigin(origin);
        if (allowedOrigins.includes(normalized)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
        if (req.path.startsWith('/uploads')) return;
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
        monitoringService.recordRequest({
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            durationMs
        });
    });
    next();
});

// Import Routes
const publicRoutes = require('./routes/publicRoutes');
app.use('/api/public', publicRoutes);
app.use('/api/platform', require('./routes/platformRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/hr', require('./routes/hrRoutes'));
app.use('/api/parent', require('./routes/parentRoutes'));
app.use('/api/branch/auth', require('./routes/branchAuthRoutes')); // Specific Auth Routes (Public/Mixed)
app.use('/api/branch/shared', require('./routes/branchSharedRoutes')); // Shared Resources (Classes, etc.) for multi-role
app.use('/api/branch', require('./routes/branchAdminRoutes')); // Branch Admin specific routes (Protected)
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/cashier', require('./routes/cashierRoutes')); // Cashier Role Routes
app.use('/api/academic', require('./routes/academicRoutes'));
app.use('/api/exams', require('./routes/examRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/registrar', require('./routes/registrarRoutes')); // Registrar Routes
app.use('/api/teacher', require('./routes/teacherRoutes')); // Teacher Routes
app.use('/api/student', require('./routes/studentPortalRoutes')); // Student Portal Routes


// Mount specific finance route BEFORE the general tenant route to avoid middleware trap
app.use('/api/tenant/finance', require('./routes/tenantFinanceRoutes'));
app.use('/api/tenant', require('./routes/tenantRoutes'));

const frontendDistPath = path.resolve(__dirname, '../frontend/dist');
const hasFrontendDist = fs.existsSync(frontendDistPath);

if (hasFrontendDist) {
    app.use(express.static(frontendDistPath));
    app.use((req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        if (req.path.startsWith('/uploads')) return next();
        res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.json({ message: 'Enterprise School Management API is running' });
    });
}

const PORT = process.env.PORT || 5035;

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(`[SERVER ERROR] ${err.message}`);
    console.error(err.stack);
    const statusCode = err.message && err.message.startsWith('CORS blocked')
        ? 403
        : err.statusCode
            ? err.statusCode
        : (res.statusCode === 200 ? 500 : res.statusCode);
    res.status(statusCode).json({
        message: err.message
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
