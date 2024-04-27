function CourseTimeAndLocation(date, days, time, building, room) {
    const Day = {
        MON: 0,
        TUE: 1,
        WED: 2,
        THU: 3,
        FRI: 4,
        SAT: 5,
        SUN: 6
    }

    this.date = date;
    this.days = days;
    this.time = time;
    this.building = building;
    this.room = room;

    let startEndTime = this.time.trim().split(" - ");

    this.startTime = startEndTime ? startEndTime[0] : "";
    this.endTime = startEndTime ? startEndTime[1] : "";

    let getDayList = function (daysString) {
        let d = daysString.trim().split(" ");
        d = d.map((day) => Day[day.toUpperCase()]);
        return d
    }

    this.dayInts = getDayList(days)
}

module.exports.CourseTimeAndLocation = CourseTimeAndLocation;
