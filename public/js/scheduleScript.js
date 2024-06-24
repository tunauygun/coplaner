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

      const colors = ["green", "orange", "red", "yellow", "blue", "pink", "black"]
      const syncCourses = schedule.timetables[schedule.index].filter(course => course.is_synchronous === 1)
      const sycnCourseGroups = Object.groupBy(syncCourses, ({ subject, number }) => subject + ' ' + number);

      for (let i = 0; i <Object.keys(sycnCourseGroups).length; i++) {
        let coursesAtGroup = sycnCourseGroups[Object.keys(sycnCourseGroups)[i]]
        let groupColor = colors[i % colors.length]
        for (const c of coursesAtGroup) {
          schedule.activities.add(convertDaysOfWeekToNumbers(c.day), c.subject + " " + c.number , c.start_time + "-" + c.end_time, "", c.section, c.instructor, groupColor);
        }
      }
      updateUnscheduledCourseList()
    }
  }
  
}

schedule.initialize();
schedule.index = 0;

let updateUnscheduledCourseList = function () {
  let unscheduledCourses = schedule.timetables[schedule.index].filter(course => course.is_synchronous === 0)

  if(unscheduledCourses.length > 0){
    $("#unscheduledCoursesList").empty()
    for (const course of unscheduledCourses) {
      let item = "<li>" + course.subject + " " + course.number + "</li>";
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


$("#copyCRNs").click(function() {
  let crns = [...new Set(schedule.timetables[schedule.index].map(c => c.crn))].join(", ")
  navigator.clipboard.writeText(crns);
  let $this = $("#copyCRNsText")

  let oldText = " Copy CRNs";
  $this.text(" Copied");
  setTimeout(function() {
    $this.text(oldText);
  }, 500);
});

$("#exportPdfButton").click(function() {
  window.print()
});

$.ajax({
  url: `api/generateTimeTable/${term}/${courses}/${timesWithoutClasses}`,
  method: 'GET',
  success: function(response) {
    schedule.timetables = response.timetables;
    if(!response.limitReached){
      $("#limitReachedWarning").hide()
    }
    $("#loadingDiv").addClass("invisible")
    schedule.len = schedule.timetables.length
    if(schedule.timetables.length !== 0){
      schedule.activities.update()
      $("#scheduleContent").removeClass("invisible")
    }else{
      $("#noScheduleDiv").removeClass("invisible")
    }
  },
  error: function(xhr, status, error) {
    alert("Error: Cannot get the generated timetables from the server! Try again later!")
    location.reload()
  }
});
