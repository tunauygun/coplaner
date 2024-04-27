const express = require("express");
const bodyParser = require('body-parser')
const sqlite = require("sqlite");
const sqlite3 = require("sqlite3");

const {getCourseCodes} = require("./database");

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', (req, res) => {
    res.render('home')
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

app.post('/schedule', (req, res) => {
    let selectedCourses = JSON.parse(req.body.selectedCourses);
    let termCode = req.body.term;
    // let courseFinder = new CourseFinder(courseData);
    // let tc = new TimetableCreator(courseFinder, selectedCourses, termCode);
    // let timetables = tc.generateTimetables();
    // res.render('schedule', {t: timetables})
    res.send(selectedCourses)
    console.log(selectedCourses, termCode)
})


app.get('/example', (req, res) => {
    let courseFinder = new CourseFinder(courseData);
    let cns = ["SYSC 3101", "SYSC 3303", "SYSC 4106", "SYSC 4120", "COMP 3005", "ELEC 2507"];
    let tc = new TimetableCreator(courseFinder, cns, "202410");
    let timetables = tc.generateTimetables();
    res.render('schedule', {t: timetables})
})

app.listen(3000, () => {
    console.log(`Server is listening on port ${port}.`)
});
