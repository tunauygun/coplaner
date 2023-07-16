function Timetable(courses) {

    this.courses = courses;
    // this.courseTimes = getCourseTimes(courses);

    let getCourseTimes = function (courses) {
        let times = [];
        for (const course of courses){
            times = times.concat(course.courseTimeArray)
        }
        return times;
    }

    this.courseTimes = getCourseTimes(courses);

    this.isValidTimetable = function () {
        return (new Set(this.courseTimes)).size === this.courseTimes.length;
    }
}

module.exports.Timetable = Timetable;