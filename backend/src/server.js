const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
 
const env = require('./config/env');
const { connectDB } = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');
const resumesRouter = require('./routes/resumes');
const dashboardRouter = require('./routes/dashboard')
const insightsRouter = require('./routes/insights')
const versionsRouter = require('./routes/versions')
const historyRouter = require('./routes/history')
const analysisRouter = require('./routes/analysis')

const app = express();

app.set('trust proxy', 1);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
if(!env.isProd) app.use(morgan('dev'));

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/resumes', resumesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/versions', versionsRouter);
app.use('/api/history', historyRouter);
app.use('/api/analysis', analysisRouter);

// Root route
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'AI Resume Checker API is running'
    });
});

app.use(notFound);
app.use(errorHandler);

async function start() {
    try {
        await connectDB();
        app.listen(env.port, () => {
            console.log(`Server running on http://localhost:${env.port} (${env.nodeEnv})`);
        });
    } catch (error) {
        console.error("failed to start server:", error.message);
        process.exit(1);
    }   
}

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection at:', reason);
    process.exit(1);
});
start();    

module.exports = app;