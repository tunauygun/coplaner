const dotenv = require('dotenv').config();
const express = require("express");
const bodyParser = require('body-parser');
const sqlite = require("sqlite");
const sqlite3 = require("sqlite3");
const sql = require('mssql');
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const nodemailer = require('nodemailer');
const mg = require('nodemailer-mailgun-transport');

const { getCourseCodes, getAcademicYear } = require("./database");
const { TimetableCreator } = require("./TimetableCreator");
const { Logger } = require('./logger');

const app = express();
const port = process.env.PORT || 3000;

let db, logger;

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
    helmet({
        contentSecurityPolicy: false,
    })
);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

const logDbConfig = {
    user: process.env.LOG_DB_USER,
    password: process.env.LOG_DB_PASSWORD,
    server: process.env.LOG_DB_SERVER,
    database: process.env.LOG_DB_NAME,
    authentication: {
        type: 'default'
    },
    options: {
        encrypt: true
    }
};

const emailAuth = {
    auth: {
        api_key: process.env.MAILGUN_KEY,
        domain: process.env.MAILGUN_DOMAIN
    }
};
const nodemailerMailgun = nodemailer.createTransport(mg(emailAuth));

app.get('/', async (req, res) => {
    const years = await getAcademicYear(db);
    res.render('home', { academicYear: years });
});

app.get('/select', async (req, res) => {
    let courseCodes = await getCourseCodes(db);
    res.render('selectCourses', { courseCodes });
});

app.get('/about', (req, res) => {
    if (logger) logger.logInfo("visit", "/about");
    res.render('about');
});

app.get('/schedule', (req, res) => {
    res.redirect('/select');
});

app.post('/schedule', async (req, res) => {
    let selectedCourses = req.body.selectedCourses;
    let termCode = req.body.term;
    let timesWithoutClasses = req.body.timesWC;
    res.render('schedule', { selectedCourses, termCode, timesWithoutClasses });
});

app.get('/example', async (req, res) => {
    let termCode = 202510;
    let selectedCourses = {
        "ECOR_2995": ["A"],
        "ELEC_2507": ["A", "B"],
        "COMP_3005": ["A", "B"],
        "SYSC_4120": ["A"],
        "SYSC_4106": ["A"],
        "SYSC_3303": ["A", "B"],
        "SYSC_3101": ["A"]
    };
    selectedCourses = JSON.stringify(selectedCourses);
    let timesWithoutClasses = "[]";
    res.render('schedule', { selectedCourses, termCode, timesWithoutClasses });
});

app.get('/contact', (req, res) => {
    res.render('contact');
});

app.post('/contact', (req, res) => {
    const { name, email, subject, message } = req.body;
    let content = "Here is the details of the new message received from coplaner:\n";
    content += "\nname: " + name;
    content += "\nemail: " + email;
    content += "\nsubject: " + subject;
    content += "\n\n" + message;

    nodemailerMailgun.sendMail({
        from: `coplaner <coplaner@${process.env.MAILGUN_DOMAIN}>`,
        to: 'contact.coplaner@gmail.com',
        subject: 'coplaner - ' + subject,
        text: content
    }, (err, info) => {
        if (err) {
            if (logger) logger.logError("contactMail", err);
            res.sendStatus(500);
        } else {
            if (logger) logger.logInfo("contactMail", info);
            res.sendStatus(200);
        }
    });
});

app.get('/api/courseSections/:term/:subject/:number', async (req, res) => {
    const { term, subject, number } = req.params;
    const courses = await db.all('SELECT * FROM courses WHERE term = ? AND subject = ? AND number = ? AND length(section) = 1', [term, subject, number]);
    res.send(courses.map(course => course.section));
});

app.get('/api/generateTimeTable/:term/:courses/:timesWC', async (req, res) => {
    const selectedCourses = JSON.parse(req.params.courses);
    const termCode = req.params.term;
    const timesWithoutClasses = JSON.parse(req.params.timesWC);

    let tc = new TimetableCreator(termCode, selectedCourses, timesWithoutClasses, db);
    const { timetables, maxScheduleCountReached } = await tc.generateTimetables();

    const log = {
        selectedCourses: selectedCourses,
        termCode: termCode,
        maxScheduleCountReached: maxScheduleCountReached,
        timetables_count: timetables.length
    };
    if (logger) logger.logInfo("/api/generateTimeTable", JSON.stringify(log));

    res.send({ timetables: timetables, limitReached: maxScheduleCountReached });
});

app.get('/api/logs/:token', async (req, res) => {
    if (req.params.token !== process.env.token) {
        return res.status(403).send('Forbidden: Invalid token');
    }

    if (!logger || typeof logger.getLogs !== 'function') {
        return res.status(500).send('Server error: Logger not initialized');
    }

    try {
        const logs = await logger.getLogs();
        res.send(logs);
    } catch (err) {
        console.error('Error fetching logs:', err.message);
        res.status(500).send('Server error: Unable to fetch logs');
    }
});

const startServer = async () => {
    try {
        db = await sqlite.open({
            filename: 'courses.db',
            driver: sqlite3.Database
        });

        const pool = await sql.connect(logDbConfig);
        logger = new Logger(pool);
        console.log('Database and logger initialized successfully.');

        app.listen(port, () => {
            console.log(`Server is listening on port ${port}.`);
        });
    } catch (err) {
        console.error('Failed to initialize server:', err.message);
        process.exit(1);
    }
};

startServer();
