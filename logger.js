const sql = require('mssql');

function Logger(pool) {
    this.pool = pool;

    this.logEvent = async function (severity, eventType, message) {
        try {
            await pool.request()
                .input('severity', sql.VarChar(10), severity)
                .input('eventType', sql.VarChar(50), eventType)
                .input('message', sql.NVarChar(sql.MAX), message)
                .query(`INSERT INTO logs (severity, event_type, message) VALUES (@severity, @eventType, @message)`);
        } catch (err) {
            console.error('Error inserting log:', err.message);
        }
    };


    this.logInfo = async function (eventType, message) {
        await this.logEvent("info", eventType, message);
    }

    this.logError = async function (eventType, message) {
        await this.logEvent("error", eventType, message);
    }

    this.getLogs = async function () {
        try {
            const result = await pool.request().query(`
                SELECT
                    id,
                    severity,
                    event_type,
                    message,
                    FORMAT(SWITCHOFFSET(timestamp, '-04:00'), 'yyyy-MM-dd HH:mm:ss zzz') AS ottawa_time 
                FROM logs 
                ORDER BY timestamp DESC`);
            let logs = result.recordset;
            for (let log of logs) {
                try {
                    log.message = JSON.parse(log.message);
                } catch (e) { }
            }
            return logs;
        } catch (err) {
            console.error('Error retrieving logs:', err.message);
            return [];
        }
    }
}

module.exports.Logger = Logger;
