const cheerio = require("cheerio");
const axios = require("axios");
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
const qs = require('qs');

const BASE_URL = "https://central.carleton.ca/prod/bwysched.p_"

async function getTermCodes() {
    const termSelectionURL = BASE_URL + "select_term?wsea_code=EXT";
    return axios.get(termSelectionURL).then((response) => {
        let termCodes = []
        const $ = cheerio.load(response.data);
        $('#term_code option').each((index, element) => {
            termCodes.push($(element).val())
        });
        return termCodes;
    })
}

async function getSubjects(termCode) {
    const termSubjectListURL = BASE_URL + "search_fields";
    const params = {term_code: termCode, session_id: '20599729', wsea_code: 'EXT'};

    return axios.get(termSubjectListURL, {params}).then((response) => {
        let subjects = []
        const $ = cheerio.load(response.data);
        $('#subj_id option:not(:selected)').each((index, element) => {
            subjects.push($(element).val())
        });
        return subjects;
    })
}


async function getCourseTableRows(termCode, courseCode) {
    const courseTableURL = BASE_URL + "course_search";

    const params = {
        wsea_code: "EXT",
        term_code: termCode,
        session_id: "20599729",
        ws_numb: "",
        sel_aud: "dummy",
        sel_subj: ["dummy", courseCode],
        sel_camp: "dummy",
        sel_sess: ["dummy", ""],
        sel_attr: "dummy",
        sel_levl: "dummy",
        sel_levl: "",
        sel_schd: ["dummy", ""],
        sel_insm: "dummy",
        sel_link: "dummy",
        sel_wait: "dummy",
        sel_begin_hh: "dummy",
        sel_begin_mi: "dummy",
        sel_begin_am_pm: "dummy",
        sel_end_hh: "dummy",
        sel_end_mi: "dummy",
        sel_end_am_pm: "dummy",
        sel_instruct: ["dummy", ""],
        sel_special: ["dummy", "N"],
        sel_resd: "dummy",
        sel_breadth: "dummy",
        sel_number: "",
        sel_crn: "",
        sel_begin_hh: 0,
        sel_begin_mi: 0,
        sel_begin_am_pm: "a",
        sel_end_hh: 0,
        sel_end_mi: 0,
        sel_end_am_pm: "a",
        sel_day: ["dummy", "m", "t", "w", "r", "f", "s", "u"],
        block_button: ""
    }

    return axios.get(courseTableURL, {
        'params': params, 'paramsSerializer': function (params) {
            return qs.stringify(params, {arrayFormat: 'repeat'})
        }
    }).then((response) => {
        let courseTableRows = []
        const $ = cheerio.load(response.data);
        const rows = $('td div table').first().find('tr');
        rows.each((index, element) => {
            let row = []
            const cells = $(element).find('td')
            cells.each((index, cell) => {
                const cellText = $(cell).text().trim()
                if (cellText !== "" || cells.length === 11) {
                    row.push($(cell).text().trim());
                }
            });
            courseTableRows.push(row);
        });
        return courseTableRows;
    })
}

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


function groupTableRowsByCourse(rows) {
    let courseRows = []
    let tempCourseRows = []

    for (const row of rows) {
        let rowText = row.toString().trim()
        if (rowText === "") {
        } else if (row.length === 11) {
            courseRows.push(tempCourseRows)
            tempCourseRows = [row]
        } else {
            tempCourseRows.push(row)
        }
    }
    if (tempCourseRows.length !== 0) {
        courseRows.push(tempCourseRows)
    }
    return courseRows
}

function setupDatabase3() {
    return new sqlite3.Database('./courses.db', sqlite3.OPEN_READWRITE, (err) => {
        if (err && err.code === "SQLITE_CANTOPEN") {
            return createDatabase();
        } else if (err) {
            console.log(err);
            process.exit(1);
        }
        console.log("Done")
    });
}

function createDatabase3() {
    const db = new sqlite3.Database('courses.db', (err) => {
        if (err) {
            console.log("Getting error " + err);
            process.exit(1);
        }
        createTables(db);
    });
}

async function createTables(db) {
    await db.exec(`
        create table if not exists courses
        (
            crn               int primary key not null,
            term              int             not null,
            subject           text            not null,
            section           text            not null,
            title             text            not null,
            credits           real            not null,
            type              text            not null,
            has_restrictions  int             not null,
            has_prerequisites int             not null,
            instructor        text,
            section_info      text,
            also_register_in  text
        );

        create table if not exists courseSchedule
        (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            term       int  not null,
            subject    text not null,
            section    text not null,
            day        text not null,
            start_time text not null,
            end_time   text not null
        );
    `);
}

function insertCourse(db, course) {
    db.run(`INSERT INTO courses (crn, term, subject, section, title, credits, type, has_restrictions, has_prerequisites,
                                 instructor, section_info, also_register_in)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?)`, [parseInt(course.crn), parseInt(course.term), course.subject, course.section, course.title, parseFloat(course.credits), course.type, course.has_restrictions, course.has_prerequisites, course.instructor, course.section_info, course.also_register_in], function (error) {
        if (error) {
            console.error(error.message);
        }
    });

    for (const time of course.times) {
        for (const day of time.days) {
            db.run(`INSERT INTO courseSchedule (term, subject, section, day, start_time, end_time)
                    VALUES (?, ?, ?, ?, ?,
                            ?)`, [parseInt(course.term), course.subject, course.section, day, time.startTime, time.endTime], function (error) {
                if (error) {
                    console.error(error.message);
                }
            });
        }

    }
}

async function getDatabase() {
    let db = await sqlite.open({
        filename: 'courses.db', driver: sqlite3.Database
    })
    await createTables(db)
    return db
}

function formatCourseRowsToCourse(rows, termCode) {
    let courses = []
    for (let courseRows of rows) {

        let course = {}

        for (let courseRow of courseRows) {
            if (courseRow.length === 11) {
                course.crn = courseRow[2]
                course.term = termCode
                course.subject = courseRow[3]
                course.section = courseRow[4]
                course.title = courseRow[5]
                course.credits = courseRow[6]
                course.type = courseRow[7]
                course.has_restrictions = courseRow[8] === "Yes"
                course.has_prerequisites = courseRow[9] === "Yes"
                course.instructor = courseRow[10]
                course.times = []

            } else {
                let courseInfo = courseRow[0].trim();
                if (courseInfo.startsWith("Meeting Date:")) {
                    const dateMatch = courseInfo.match(/Meeting Date: (.+?) Days:/);
                    const dates = dateMatch ? dateMatch[1] : null;

                    const daysMatch = courseInfo.match(/Days: (.+?) Time:/);
                    const daysString = daysMatch ? daysMatch[1] : null;
                    const daysList = daysString ? daysString.split(" ") : [];

                    const timeMatch = courseInfo.match(/Time: (.+)/);
                    const timeString = timeMatch ? timeMatch[1] : null;
                    const [startTime, endTime] = timeString ? timeString.split(" - ") : [null, null];

                    course.dates = dates
                    course.times.push({
                        days: daysList, startTime: startTime, endTime: endTime
                    })
                } else if (courseInfo.startsWith("Section Information:")) {
                    course.section_info = courseInfo.substring("Section Information:".length).trim()
                } else if (courseInfo.startsWith("Also Register in:")) {
                    course.also_register_in = courseInfo.substring("Also Register in:".length).trim()
                }
            }
        }
        courses.push(course)
    }
    return courses;
}

async function main() {
    let db = await getDatabase()
    let allCourses = []
    let termCodes = await getTermCodes()
    for (let termCode of termCodes) {
        let subjects = await getSubjects(termCode)
        for (const subject of subjects) {
            console.log("Scraping:", termCode, subject)
            let rows = await getCourseTableRows(termCode, subject)
            let courseRows = groupTableRowsByCourse(rows)
            let courses = formatCourseRowsToCourse(courseRows, termCode)
            allCourses.push(...courses)
        }
    }
    allCourses = allCourses.filter(value => Object.keys(value).length !== 0);
    console.log(allCourses.length)
    for (let c of allCourses) {
        insertCourse(db, c)
    }
}

main()

