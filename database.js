const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');

async function getCourseCodes(db) {
    const query = `
        SELECT term, subject, GROUP_CONCAT(DISTINCT number) AS numbers
        FROM courses
        GROUP BY term, subject;
    `;

    const result = await db.all(query)

    let courseCodes = {}
    result.forEach(row => {
        if(! courseCodes[row.term]){
            courseCodes[row.term] = {}
        }
        courseCodes[row.term][row.subject] = row.numbers.split(",")
    });
    return courseCodes;

}

// function insertCourse(db, course) {
//     db.run(`INSERT INTO courses (crn, term, subject, section, title, credits, type, has_restrictions, has_prerequisites,
//                                  instructor, section_info, also_register_in)
//             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
//                     ?)`, [parseInt(course.crn), parseInt(course.term), course.subject, course.section, course.title, parseFloat(course.credits), course.type, course.has_restrictions, course.has_prerequisites, course.instructor, course.section_info, course.also_register_in], function (error) {
//         if (error) {
//             console.error(error.message);
//         }
//     });
//
//     for (const time of course.times) {
//         for (const day of time.days) {
//             db.run(`INSERT INTO courseSchedule (term, subject, section, day, start_time, end_time)
//                     VALUES (?, ?, ?, ?, ?,
//                             ?)`, [parseInt(course.term), course.subject, course.section, day, time.startTime, time.endTime], function (error) {
//                 if (error) {
//                     console.error(error.message);
//                 }
//             });
//         }
//
//     }
// }


async function main() {
    const db = await sqlite.open({
        filename: 'courses.db', driver: sqlite3.Database
    })

    let c = await getCourseCodes(db)
    console.log(c)
}

module.exports.getCourseCodes = getCourseCodes;

