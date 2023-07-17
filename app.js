const express = require("express");
const bodyParser = require('body-parser')
const {CourseFinder} = require("./CourseFinder");
const {TimetableCreator} = require("./TimetableCreator");
const courseData = require('./courses.json');

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }))

let getTermNameFromTermCode = function (termCode) {
    const termSeasons = ["Winter", "Summer", "Fall"]
    let termYear = termCode.trim().substring(0, 4)
    let termSeasonCode = parseInt(termCode.trim().substring(4, 5))-1
    return termSeasons[termSeasonCode] + " " + termYear
}

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/select', (req, res) => {
    let courseNames = {}
    let termNames = {}
    for(let term of Object.keys(courseData)){
        courseNames[term] = {};
        termNames[term] = getTermNameFromTermCode(term)
        for(let subj of Object.keys(courseData[term])){
            courseNames[term][subj] = {}
            let codes = []
            for(let course of courseData[term][subj]){
                codes.push(course.courseCode)
            }
            courseNames[term][subj] = [...new Set(codes)];
        }
    }

    let x = courseNames[Object.keys(termNames)[0]][Object.keys(courseNames[Object.keys(termNames)[0]])[0]]
    res.render('selectCourses', {courseNames, termNames})
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
    let courseFinder = new CourseFinder(courseData);
    let tc = new TimetableCreator(courseFinder, selectedCourses, termCode);
    let timetables = tc.generateTimetables();
    res.render('schedule', {t: timetables})
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