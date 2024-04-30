const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');

async function getCourseCodes(db) {
    const query = `
        SELECT term, subject, GROUP_CONCAT(DISTINCT number) AS numbers
        FROM courses
        WHERE length(section) = 1
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

async function main() {
    const db = await sqlite.open({
        filename: 'courses.db', driver: sqlite3.Database
    })

    let c = await getCourseCodes(db)
    console.log(c)
}

module.exports.getCourseCodes = getCourseCodes;

