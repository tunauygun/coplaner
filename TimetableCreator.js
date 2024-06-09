const sqlite = require("sqlite");
const sqlite3 = require("sqlite3");

function TimetableCreator(term, requiredCourseNames, db) {

    this.requiredCourseNames = requiredCourseNames;
    this.term = term;
    this.db = db;

    function generateCombinations(groups) {
        // Base case: if the groups array is empty, return an array with an empty combination
        if (groups.length === 0) {
            return [[]];
        }

        // Get the first group from the array
        const currentGroup = groups[0];

        // Get the remaining groups
        const remainingGroups = groups.slice(1);

        // Recursively generate combinations for the remaining groups
        const remainingCombinations = generateCombinations(remainingGroups);

        // Initialize an array to store all combinations
        const combinations = [];

        // Iterate over each item in the current group
        for (const item of currentGroup) {
            // For each item in the current group, iterate over each combination of the remaining groups
            for (const combination of remainingCombinations) {
                // Create a new combination by adding the current item to the existing combination
                const newCombination = [item, ...combination];
                // Push the new combination to the combinations array
                combinations.push(newCombination);
            }
        }
        // Return all combinations
        return combinations;
    }


    this.generateTimetables = async function () {
        const unfilteredScheduleOptions = await getAllScheduleOptions()

        let maxScheduleCountReached = false;
        const MAX_SCHEDULE_LIMIT = 50;
        const chunkSize = MAX_SCHEDULE_LIMIT / 5;

        let allScheduleOptions = [];
        for (let i = 0; i < unfilteredScheduleOptions.length; i += chunkSize) {
            if(allScheduleOptions.length >= MAX_SCHEDULE_LIMIT ){
                allScheduleOptions = allScheduleOptions.slice(0, MAX_SCHEDULE_LIMIT);
                maxScheduleCountReached = true;
                break;
            }

            let chunk = unfilteredScheduleOptions.slice(i, i + chunkSize);
            let processedChunk = await filterForConflictFreeSchedules(chunk);
            allScheduleOptions.push(...processedChunk);
        }

        let timetables = []

        for (let courses of allScheduleOptions) {
            const courseList = courses.map(courseString => {
                const courseInfo = courseString.split(" ");
                return [courseInfo[0], courseInfo[1], courseInfo[2]];
            })

            const query = `
                SELECT c.*, s.day, s.start_time, s.end_time
                FROM courses c
                         LEFT OUTER JOIN courseSchedule s ON c.term = s.term AND c.subject = s.subject AND c.number = s.number AND c.section = s.section
                WHERE c.term = ${term}
                  AND (
                    ${courseList.map((c, index) => `
                    (c.subject = '${c[0]}' AND c.number = ${c[1]} AND c.section = '${c[2]}')
                `).join('OR')}
                    )
            `;

            const result = await db.all(query)
            timetables.push(result);
        }

        return {timetables, maxScheduleCountReached};
    }

    let filterForConflictFreeSchedules = async function (unfilteredScheduleOptions) {
        const promises = unfilteredScheduleOptions.map(scheduleOption =>
            checkScheduleForConflict(scheduleOption)
        );

        const conflictCounts = await Promise.all(promises);
        const allScheduleOptions = [];

        for (let i = 0; i < unfilteredScheduleOptions.length; i++) {
            if (conflictCounts[i] === 0) {
                allScheduleOptions.push(unfilteredScheduleOptions[i]);
            }
        }
        return allScheduleOptions;
    }


    let checkScheduleForConflict = async function (courses) {

        const courseList = courses.map(courseString => {
            const courseInfo = courseString.split(" ");
            return [courseInfo[0], courseInfo[1], courseInfo[2]];
        })

        const query = `
            SELECT COUNT()
            FROM courseSchedule a
                     JOIN courseSchedule b ON a.term = b.term
                AND a.day = b.day
                AND (
                                                  (a.start_time < b.end_time AND a.end_time > b.start_time)
                                                      OR
                                                  (a.start_time = b.start_time AND a.end_time = b.end_time)
                                                  )
            WHERE a.term = ${term}
              AND b.term = ${term}
              AND a.id <> b.id
              AND (
                ${courseList.map((c, index) => `
                (a.subject = '${c[0]}' AND a.number = ${c[1]} AND a.section = '${c[2]}')
            `).join('OR')}
                )
              AND (
                ${courseList.map((c, index) => `
                (b.subject = '${c[0]}' AND b.number = ${c[1]} AND b.section = '${c[2]}')
            `).join('OR')}
                )
        `;

        const result = await db.get(query)

        return result["COUNT()"]
    }


    let getAllScheduleOptions = async function () {
        let scheduleSelectionGroups = []
        for (const requiredCourseName of Object.keys(requiredCourseNames)) {
            const courseSections = requiredCourseNames[requiredCourseName];
            const allOptionsForCourse_unfiltered = await getAllOptionsForCourse(requiredCourseName, courseSections)

            let allOptionsForCourse = []
            for (let c of allOptionsForCourse_unfiltered) {
                const hasNoConflict = (await checkScheduleForConflict(c)) === 0
                if(hasNoConflict){
                    allOptionsForCourse.push(c)
                }
            }
            scheduleSelectionGroups.push(allOptionsForCourse);
        }
        let possibleCombinations = generateCombinations(scheduleSelectionGroups)
        return possibleCombinations.map(combination => combination.flat())
    }


    let getAllOptionsForCourse = async function (courseCode, courseSections) {
        const courseCodeSeperated = courseCode.split("_")
        const subject = courseCodeSeperated[0];
        const number = parseInt(courseCodeSeperated[1]);
        const result = await db.all(`SELECT * FROM courses WHERE term = ? AND subject = ? AND number = ? AND section IN ("${courseSections.join('", "')}")`, [term, subject, number]);

        let allOptions = []

        for (const courseSection of result) {
            const sectionCourseCode = courseSection.subject + " " + courseSection.number + " " + courseSection.section;
            let sectionDependencyGroups = getCourseDependencyGroups(courseSection.also_register_in)
            sectionDependencyGroups.push([sectionCourseCode])
            allOptions.push(...generateCombinations(sectionDependencyGroups));
        }
        return allOptions;
    }

    let getCourseDependencyGroups = function (alsoRegisterIn) {
        let courseDepGroups = [];

        if (!alsoRegisterIn || alsoRegisterIn.trim() === "") {
            return courseDepGroups;
        }

        const courseGroups = alsoRegisterIn.trim().split(" and ");
        for (const courseOptionsString of courseGroups) {
            let courseOptions = [];
            if (courseOptionsString.includes("or")) {
                const pattern = "(.*?) (.*?) (.*)";
                const match = courseOptionsString.match(pattern);

                if (match.length !== 4) {
                    continue;
                }

                const subject = match[1];
                const code = match[2];
                const sections = match[3].trim().split(" or ");

                for (const section of sections) {
                    courseOptions.push(subject + " " + code + " " + section);
                }
            } else {
                courseOptions.push(courseOptionsString);
            }
            courseDepGroups.push(courseOptions);
        }
        return courseDepGroups;
    }

}

module.exports.TimetableCreator = TimetableCreator;

// Testing TimetableCreator
// async function run() {
//     const db = await sqlite.open({filename: 'courses.db', driver: sqlite3.Database})
//     const tc = new TimetableCreator(202510, {
//         "ECOR_2995":["A"],
//         "ELEC_2507":["A","B"],
//         "COMP_3005":["A","B"],
//         "SYSC_4120":["A"],
//         "SYSC_4106":["A"],
//         "SYSC_3303":["A","B"],
//         "SYSC_3101":["A"]
//     }, db);
//     const {timetables, maxScheduleCountReached} = await tc.generateTimetables()
//     console.log(timetables.length)
// }
//
// run()
