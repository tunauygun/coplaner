const sqlite3 = require('sqlite3');
const sqlite = require("sqlite");

function Logger(db) {
    this.db = db;

    this.logEvent = function (severity, eventType, message) {
        const sql = `INSERT INTO logs (severity, event_type, message) VALUES (?, ?, ?)`;
        db.run(sql, [severity, eventType, message], function(err) {
            if (err) {
                return console.error(err.message);
            }
        });
    }

    this.logInfo = function (eventType, message) {
        this.logEvent("info", eventType, message);
    }

    this.logError = function (eventType, message) {
        this.logEvent("error", eventType, message);
    }

    this.getLogs = async function () {
        const query = `SELECT * FROM logs ORDER BY timestamp DESC`;
        let logs = await db.all(query)
        for (let log of logs) {
            try {
                log.message = JSON.parse(log.message);
            } catch (e) { }
        }
        return logs
    }

}

module.exports.Logger = Logger;
