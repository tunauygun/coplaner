const {Course} = require("./Course");

function CourseFinder(courseData) {

    this.getCourse = function (term, subject, code, section) {
        let coursesFromTheSubject = courseData[term][subject]

        let filteredCourses = coursesFromTheSubject.filter((course) => {
            if(section){
                return course.courseCode === code && course.section === section;
            }
            return course.courseCode === code && course.credits !== "0"
        })

        filteredCourses = filteredCourses.map(r => {
            return new Course(r.termCode, r.status, r.crn, r.subject, r.courseCode, r.section, r.title, r.credits, r.schedule, r.restricts, r.prereqs, r.instructor, r.timeAndLoc, r.sectionInfo, r.alsoRegisterIn, r.courseTimes)
        })
        if(filteredCourses.length !== 0){
            if(section){
                return filteredCourses[0];
            }else{
                return filteredCourses;
            }
        }
        return filteredCourses;
    }

    this.getTutorials = function (term, subject, code) {
        let coursesFromTheSubject = courseData[term][subject]
        return coursesFromTheSubject.filter((course) => {
            return course.code === code && course.credit === "0"
        });
    }
}

module.exports.CourseFinder = CourseFinder;