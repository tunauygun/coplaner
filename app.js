const express = require("express");
const bodyParser = require('body-parser')
const sqlite = require("sqlite");
const sqlite3 = require("sqlite3");

const {getCourseCodes, getAcademicYear} = require("./database");
const {TimetableCreator} = require("./TimetableCreator");

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended: false}))

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
    console.log(courseCodes)
    res.render('selectCourses', {courseCodes})
})

app.get('/about', (req, res) => {
    res.render('about')
})

app.get('/schedule', (req, res) => {
    res.redirect('/select')
})

app.post('/schedule', async (req, res) => {
    const db = await sqlite.open({filename: 'courses.db', driver: sqlite3.Database})

    let selectedCourses = JSON.parse(req.body.selectedCourses);
    let termCode = req.body.term;

    let tc = new TimetableCreator(termCode, selectedCourses, db);
    const timetables = await tc.generateTimetables()
    res.render('schedule', {t: timetables})
})


app.get('/example', async (req, res) => {
    const db = await sqlite.open({filename: 'courses.db', driver: sqlite3.Database})

    let selectedCourses = ["SYSC 3101", "SYSC 3303", "SYSC 4106", "SYSC 4120", "COMP 3005", "ELEC 2507", "ECOR 2995"];
    let termCode = 202410;

    let tc = new TimetableCreator(termCode, selectedCourses, db);
    const timetables = await tc.generateTimetables()
    res.render('schedule', {t: timetables})
})

app.listen(3000, () => {
    console.log(`Server is listening on port ${port}.`)
});
