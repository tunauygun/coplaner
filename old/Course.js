const {CourseTimeAndLocation} = require("./CourseTimeAndLocation");
const {TimetableCreator} = require("./TimetableCreator");

function Course(termCode, status, crn, subject, courseCode, section, title, credits, schedule, restricts, prereqs, instructor, timeAndLocationsString, sectionInfo, alsoRegisterIn, courseTimeArrayString) {
    const Day = {
        MON: 0,
        TUE: 1,
        WED: 2,
        THU: 3,
        FRI: 4,
        SAT: 5,
        SUN: 6
    }

    this.termCode = termCode;
    this.status = status;
    this.crn = crn;
    this.subject = subject;
    this.courseCode = courseCode;
    this.section = section;
    this.title = title;
    this.credits = credits;
    this.schedule = schedule;
    this.restricts = restricts;
    this.prereqs = prereqs;
    this.instructor = instructor;
    this.timeAndLocationsString = timeAndLocationsString;
    this.sectionInfo = sectionInfo;
    this.alsoRegisterIn = alsoRegisterIn;
    // this.courseTimeArrayString = courseTimeArrayString;

    // this.courseDependencyGroups = this.getCourseDependencyGroups(alsoRegisterIn);
    // this.courseTimeArray = courseTimeArrayString == null ?  this.getCourseTimeArray() : this.parseCourseTimeString(courseTimeArrayString);
    // this.courseTimeString = courseTimeArrayString == null ? this.createCourseTimeString(): courseTimeArrayString;

    this.parseCourseTimeString = function (courseTimeString) {
        let courseTimes = [];
        let courseTimeStrings = courseTimeString.split(" ");
        for (const ct of courseTimeStrings) {
            if(ct !== ""){
                courseTimes.push(parseInt(ct));
            }
        }
        return courseTimes
    }


    this.createCourseTimeString = function () {
        return this.courseTimeArray.join(" ")
    }

    this.getDependencyCombinations = function () {
        let tc = new TimetableCreator(null, null, null);
        return tc.getAllCombination(this.courseDependencyGroups);
    }

    this.getCourseDependencyGroups = function (alsoRegisterIn) {
        let courseDepGroups = [];

        if(!alsoRegisterIn || alsoRegisterIn.trim() === ""){
            return courseDepGroups;
        }

        const courseGroups = alsoRegisterIn.trim().split(" and ");
        for(const courseOptionsString of courseGroups){
            let courseOptions = [];
            if(courseOptionsString.includes("or")){
                const pattern = "(.*?) (.*?) (.*)";
                const match = courseOptionsString.match(pattern);

                if(match.length !== 4){
                    continue;
                }

                const subject = match[1];
                const code = match[2];
                const sections = match[3].trim().split(" or ");

                for(const section of sections) {
                    courseOptions.push(subject + " " + code + " " + section);
                }
            }else{
                courseOptions.push(courseOptionsString);
            }
            courseDepGroups.push(courseOptions);
        }
        return courseDepGroups;
    }

    const arrayRange = (start, stop, step) =>
        Array.from(
            { length: (stop - start) / step + 1 },
            (value, index) => start + index * step
        );

    this.getTimeRangeFromStartAndEndTimes = function (start, end){        return arrayRange(start, end-1, 1)
    }

    const timeStringToNumericTimeFormat = function (time, dayString){
        const hourAndMinute = time.trim().split(":");
        const hour = parseInt(hourAndMinute[0]);
        const minute = parseInt(hourAndMinute[1]);
        const daysPast = Day[dayString.toUpperCase()];

        return (daysPast*24*60/5) + (hour*60/5) + (minute/5);
    }

    const numericTimeFormatToTimeString = function (numericTime){
        const numTime = numericTime % (12*24);
        const hour = Math.floor(numTime/12);
        const minute = (numTime % 12)*5;

        const hourStartingChar = hour < 10 ? "0" : "";
        const minuteStartingChar = minute <10 ? "0" : "";
        return hourStartingChar + hour + ":" + minuteStartingChar + minute;
    }

    const parseCourseTimeAndLocation = function (courseTimeAndLocationInfo) {
        const pattern = "Meeting Date:(.*)Days:(.*)Time:(.*)Building:(.*)Room:(.*)";
        const match = courseTimeAndLocationInfo.match(pattern)

        if(match.length !== 6){
            return null;
        }

        const date = match[1].trim();
        const days = match[2].trim();
        const time = match[3].trim();
        const building = match[4].trim();
        const room = match[5].trim();

        return new CourseTimeAndLocation(date, days, time, building, room);
    }

    this.getCourseTimeArray = function () {
        let timeArray = [];
        let ctls = [];
        let timeAndLocationStrings = this.timeAndLocationsString ? this.timeAndLocationsString.trim().split("---") : [];
        for(const timeAndLocation of timeAndLocationStrings){
            const ctl = parseCourseTimeAndLocation(timeAndLocation);
            if(!ctl){
                continue;
            }
            ctls.push(ctl)
            const days = ctl.days.trim().split(" ");
            const startTimeString = ctl.startTime;
            const endTimeString = ctl.endTime;
            for(const dayString of days){
                if(!dayString){
                    continue;
                }
                const startTime = timeStringToNumericTimeFormat(startTimeString, dayString);
                const endTime = timeStringToNumericTimeFormat(endTimeString, dayString);
                timeArray = timeArray.concat(this.getTimeRangeFromStartAndEndTimes(startTime, endTime));
            }
        }
        this.ctls = ctls;
        return timeArray;
    }

    this.courseDependencyGroups = this.getCourseDependencyGroups(alsoRegisterIn);
    this.courseTimeArray = this.getCourseTimeArray();
    // this.courseTimeArray = courseTimeArrayString === null ?  this.getCourseTimeArray() : this.parseCourseTimeString(courseTimeArrayString);
    this.courseTimeString = courseTimeArrayString === null ? this.createCourseTimeString(): courseTimeArrayString;
}

module.exports.Course = Course;

