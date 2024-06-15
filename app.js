const express = require("express");
const bodyParser = require('body-parser')
const sqlite = require("sqlite");
const sqlite3 = require("sqlite3");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const {getCourseCodes, getAcademicYear} = require("./database");
const {TimetableCreator} = require("./TimetableCreator");

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended: false}))
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        },
    })
)

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: true,
    legacyHeaders: false,
})
app.use(limiter)

app.get('/', async (req, res) => {
    const db = await sqlite.open({
        filename: 'courses.db', driver: sqlite3.Database
    })
    const years = await getAcademicYear(db);
    res.render('home', {academicYear: years})
})

app.get('/select', async (req, res) => {
    const db = await sqlite.open({
        filename: 'courses.db', driver: sqlite3.Database
    })
    let courseCodes = await getCourseCodes(db)
    res.render('selectCourses', {courseCodes})
})

app.get('/about', (req, res) => {
    res.render('about')
})

app.get('/schedule', (req, res) => {
    res.redirect('/select')
})

app.post('/schedule', async (req, res) => {
    let selectedCourses = req.body.selectedCourses;
    let termCode = req.body.term;

    res.render('schedule', {selectedCourses, termCode})
})

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
    selectedCourses = JSON.stringify(selectedCourses)

    res.render('schedule', {selectedCourses, termCode})
})

app.get('/api/courseSections/:term/:subject/:number', async (req, res) => {
    const {term, subject, number} = req.params

    const db = await sqlite.open({filename: 'courses.db', driver: sqlite3.Database})
    const courses = await db.all('SELECT * FROM courses WHERE term = ? AND subject = ? AND number = ? AND length(section) = 1', [term, subject, number]);

    console.log(courses.map(course => course.section))
    res.send(courses.map(course => course.section));
})

app.get('/api/generateTimeTable/:term/:courses', async (req, res) => {
    const selectedCourses = JSON.parse(req.params.courses);
    const termCode = req.params.term;

    const db = await sqlite.open({filename: 'courses.db', driver: sqlite3.Database})

    let tc = new TimetableCreator(termCode, selectedCourses, db);
    const {timetables, maxScheduleCountReached} = await tc.generateTimetables()

    res.send({timetables: timetables, limitReached: maxScheduleCountReached});
})

app.listen(3000, () => {
    console.log(`Server is listening on port ${port}.`)
});
