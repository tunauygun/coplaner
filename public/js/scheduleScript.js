let schedule = {
  initialize: function(){
    schedule.activities.set();
    
  },
  options: {
    schedule: '#schedule',
    start: function(){ // start at 7.10
      return schedule.general.toMin(8,0)
    },
    end: function(){ // start at 16.10
      return schedule.general.toMin(22,0)
    },
    h_height: $('.s-hour-row').height(), // get a width of hour div
    minToPx: function(){ // divide the box width by the duration of one lesson
      return schedule.options.h_height / 60;
    },
  },
  general: {
    hoursRegEx: function(hours){
      var regex = /([0-9]{1,2}).([0-9]{1,2})-([0-9]{1,2}).([0-9]{1,2})/;
      if(regex.test(hours)){
        return true;
      }else{
        return false;
      }

    },
    toMin: function(hours, minutes, string){
      // change time format (10,45) to minutes (645)
      if(!string){
        return (hours * 60) + minutes;
      }

      if(string.length>0){
        // "7:10"
        var h = parseInt(string.split(':')[0]),
            m = parseInt(string.split(':')[1]);

        return schedule.general.toMin(h, m);
      }
    },
    getPosition: function(start, duration, end){
      var translateY = (start - schedule.options.start()) * schedule.options.minToPx(),
          height = duration * schedule.options.minToPx()
      return [translateY-4, height];
    }
  },
  activities: {
    clear: function(){
      $('.s-activities .s-act-row').empty();
    },
    delete: function(week){
        $('.s-activities .s-act-row:eq('+ week +')').empty();
    },
    add: function(week, lesson, hours, classroom, group, teacher, color){
      /* EXAMPLES --> week: 0-4, lesson: "Math", hours: "9.45-12.50", 
      classroom: 145, group: "A", teacher: "A. Badurski", color: "orange" */
      var tab = "<div class='s-act-tab "+ color +"' data-hours='"+ hours +"'>\
            <div class='s-act-name'>"+ lesson +"</div>\
            <div class='s-wrapper'>\
              <div class='s-act-teacher'>"+ teacher +"</div>\
              <div class='s-act-room'>"+ classroom +"</div>\
              <div class='s-act-group'>"+ group +"</div>\
            </div>\
          </div>";
      $('.s-activities .s-act-row:eq('+ week +')').append(tab);
      schedule.activities.set();
    },
    set: function(){
      $(schedule.options.schedule + ' .s-act-tab').each(function(i){
        var hours = $(this).attr('data-hours').split("-"),
            start = /* HOURS */ parseInt(hours[0].split(":")[0]*60)
                + /* MINUTES */ parseInt(hours[0].split(":")[1]),
            end = /* HOURS */ parseInt(hours[1].split(":")[0]*60)
                + /* MINUTES */ parseInt(hours[1].split(":")[1]),
            duration = end - start,
            translateY = schedule.general.getPosition(start,duration,end)[0],
            height = schedule.general.getPosition(start,duration,end)[1];

        $(this)
            .attr({"data-start": start, "data-end": end})
            .css({"transform": "translateY("+translateY+"px)", "height": height+"px"});
      });
    },
    update: function() {
      schedule.activities.clear();
      $("#title").text(`Schedule ${schedule.index+1}/${schedule.len}`);

      const convertDaysOfWeekToNumbers = function (dayString) {
        const dayMap = {
          "mon": 0,
          "tue": 1,
          "wed": 2,
          "thu": 3,
          "fri": 4
        };
        const lowercaseDayString = dayString.toLowerCase().trim();
        return dayMap[lowercaseDayString];
      }

      for(const c of schedule.timetables[schedule.index]) {
        schedule.activities.add(convertDaysOfWeekToNumbers(c.day), c.subject + " " + c.number , c.start_time + "-" + c.end_time, "", c.section, c.instructor, "red");
      }

      // for(const c of schedule.timetables[schedule.index].courses){
      //   for(const ctl of c.ctls){
      //     for(const day of ctl.dayInts){
      //       if(ctl.room === "LINE") {
      //         ctl.room = "Online"
      //       }
      //       schedule.activities.add(day, c.subject + " " + c.courseCode , ctl.startTime + "-" + ctl.endTime, ctl.room, c.section, c.instructor, "red");
      //     }
      //   }
      // }

      // updateUnscheduledCourseList()
    }
  }
  
}

schedule.initialize();

let updateUnscheduledCourseList = function () {
  let unscheduledCourses = schedule.timetables[schedule.index].courses.filter(course => course.courseTimeString === "")
  if(unscheduledCourses.length > 0){
    $("#unscheduledCoursesList").empty()
    for (const course of unscheduledCourses) {
      let item = "<li>" + course.subject + " " + course.courseCode + "</li>";
      $("#unscheduledCoursesList").append(item)
    }
    $("#unscheduledCoursesDiv").removeClass("invisible")
  }else{
    $("#unscheduledCoursesDiv").addClass("invisible")
  }
}

let nextSchedule = function() {
  if(schedule.index+1<schedule.len){
    schedule.index += 1;
    schedule.activities.update()
  }
}

let prevSchedule = function() {
  if(schedule.index-1>=0){
    schedule.index -= 1;
    schedule.activities.update()
  }
}



$("#next").on( "click", nextSchedule);
$("#prev").on( "click", prevSchedule);

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") {
    nextSchedule()
  }else if(event.key === "ArrowLeft"){
    prevSchedule()
  }
});
