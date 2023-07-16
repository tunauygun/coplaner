const {Timetable} = require("./Timetable");

function TimetableCreator(courseFinder, requiredCourseNames, term) {

    this.requiredCourseNames = requiredCourseNames;
    this.term = term;
    this.courseFinder = courseFinder;
    // this.courseOptionsList = getCourseOptions();

    let getCourseOptions = function () {
        let col = [];
        for(const courseName of requiredCourseNames) {
            const [subject, code] = courseName.trim().split(" ")
            const courseSections = courseFinder.getCourse(term, subject, code, null)
            col.push(courseSections);
        }
        return col;
    }

    this.generateTimetables = function () {
        let validTimetables = [];
        let courseOptions = getCourseOptions();
        console.log("Found " + courseOptions.length + " course options.");
        console.log("courseOptions = " + courseOptions);
        let courseCombinations = this.getCourseCombinations(courseOptions);
        console.log("Found " + courseCombinations.length + " course combinations.");
        console.log("courseCombinations = " + courseCombinations);
        let courseCombinationsWithDependencies = this.getCourseCombinationsWithDependencies(courseCombinations);
        for (const cl of courseCombinationsWithDependencies) {
            let t = new Timetable(cl);
            if(t.isValidTimetable()){
                validTimetables.push(t);
            }
        }
        return validTimetables;
    }

    let convert2DStringListTo2DCourseList = function (string2DList) {
        let result = [];
        for (const stringList of string2DList) {
            let courseList = [];
            for (const string of stringList) {
                const [subject, code, section] = string.trim().split(" ")
                courseList.push(courseFinder.getCourse(term, subject, code, section));
            }
            result.push(courseList);
        }
        return result;
    }

    this.getCourseCombinationsWithDependencies = function (courseCombinationsList) {
        let combWithDeps =[];

        for(const courseComb of courseCombinationsList){
            let depOptions = [];
            for(const course of courseComb){
                let depComb = course.getDependencyCombinations();
                depOptions.push(depComb);
            }
            depOptions = depOptions.filter(optionList => optionList.length!==0)
            let depOptionsCombs = this.getAllCombination(depOptions);
            for(const depOptionsComb of depOptionsCombs){
                let depOptionsCombCourses = convert2DStringListTo2DCourseList(depOptionsComb);
                let timetableCourses = [];
                for(const c of depOptionsCombCourses) {
                    timetableCourses = timetableCourses.concat(c);
                }
                timetableCourses = timetableCourses.concat(courseComb);
                combWithDeps.push(timetableCourses);
            }
            if(!depOptionsCombs || depOptionsCombs.length === 0){
                combWithDeps.push(courseComb);
            }
        }
        return combWithDeps;
    }

    this.getCourseOptions = function () {
        let col = [];
        for(const courseName of this.requiredCourseNames) {
            const {subject, code} = courseName.trim().split(" ")
            let courseSections = this.courseFinder.getCourse(this.term, subject, code, null)
            col.push(courseSections);
        }
        return col;
    }

    this.getAllCombination = function (c, index = 0) {
        let res = [];

        if(c === null || c.length === 0){
            return res;
        }

        if(index === (c.length - 1)){
            for(let currObject of c[index]){
                let comb = [];
                comb.push(currObject);
                res.push(comb);
            }
            return res;
        }

        let pastCombs = this.getAllCombination(c, index+1);

        for(const currObject of c[index]){
            for(const comb of pastCombs){
                let newComb = comb.slice();
                newComb.push(currObject);
                res.push(newComb);
            }
        }
        return res;
    }

    this.getCourseCombinations = function (courseOptionsList) {
        return this.getAllCombination(courseOptionsList);
    }


}

module.exports.TimetableCreator = TimetableCreator;