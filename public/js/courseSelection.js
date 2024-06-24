let selectedCourses = {};
let filterItemNumbers = [1]

$("#termSelector").on( "change", function() {
    let termCode = this.value
    let firstSubject = Object.keys(courseCodes[termCode])[0]

    $("#subjectSelector").empty()
    for(const subj of Object.keys(courseCodes[termCode])){
        let subjectOption = "<option value=" + subj + ">" + subj + "</option>";
        $('#subjectSelector').append(subjectOption);
    }


    $("#codeSelector").empty()
    for(const code of courseCodes[termCode][firstSubject]){
        let codeOption = "<option value=" + code + ">" + code + "</option>";
        $('#codeSelector').append(codeOption);
    }
});

$("#subjectSelector").on( "change", function() {
    let termCode = $("#termSelector").val()
    let subject = this.value

    $("#codeSelector").empty()
    for(const code of courseCodes[termCode][subject]){
        let codeOption = "<option value=" + code + ">" + code + "</option>";
        $('#codeSelector').append(codeOption);
    }
});

$("#addButton").on( "click", function() {
    let term = $("#termSelector").val()
    let subject = $("#subjectSelector").val();
    let code = $("#codeSelector").val()
    if(!subject || !code){
        return;
    }
    addCourse(term, subject, code)
});

$('#form').submit(function() {
    return getSelectedFilters()
});

let removeItem = function (subject, code) {
    $(`#li_${subject}${code}`).remove();
    delete selectedCourses[subject+"_"+code];
    $("#courseFormCourses").val(JSON.stringify(selectedCourses))
    localStorage.setItem('selectedCourses', JSON.stringify(selectedCourses))
    if(Object.keys(selectedCourses).length === 0){
        $("#courseListTitle").text("").removeClass("border-top")
        $("#courseListText").text("")
        $("#termSelector").prop('disabled', false);
        $("#formButton").addClass("invisible")
        $("#removeAllButton").addClass("invisible")
        $("#courseListDiv").css("display", "none");
    }
}

let removeAll = function (){
    for (const courseName of Object.keys(selectedCourses)) {
        const [subj, code] = courseName.split("_")
        removeItem(subj, code)
    }
}

let sectionSelectionChanged = function (cb) {
    const [subj, code, sec] = cb.getAttribute("value").split(" ")
    if(cb.checked){
        selectedCourses[subj+"_"+code].push(sec)
    }else{
        if(selectedCourses[subj+"_"+code].length <= 1){
            cb.checked = true
            alert("You need to select at least one section for each course")
        }else{
            selectedCourses[subj+"_"+code].splice(selectedCourses[subj+"_"+code].indexOf(sec), 1)
        }
    }
    $("#courseFormCourses").val(JSON.stringify(selectedCourses))
    localStorage.setItem('selectedCourses', JSON.stringify(selectedCourses))
}

let addFilterItem = function () {
    let nextNumber = filterItemNumbers[filterItemNumbers.length - 1] + 1
    filterItemNumbers.push(nextNumber)

    let newFilterItem = `<div class="row py-1" id="timeFilterRow${nextNumber}">
                <div class="col col-lg-3">
                    <select class="form-select" id="daySelector${nextNumber}">
                        <option value="All">Every day</option>
                        <option value="Mon">Monday</option>
                        <option value="Tue">Tuesday</option>
                        <option value="Wed">Wednesday</option>
                        <option value="Thu">Thursday</option>
                        <option value="Fri">Friday</option>
                    </select>
                </div>
                <div class="col col-lg-2">
                    <input class="form-control" type="time" id="start${nextNumber}" step="900" name="start${nextNumber}">
                    <div class="invalid-feedback">
                      Please enter time.
                    </div>
                </div>
                <div class="col col-lg-2">
                    <input class="form-control" type="time" id="end${nextNumber}" step="900" name="end${nextNumber}">
                    <div class="invalid-feedback">
                      Please enter time.
                    </div>
                </div>
                <div class="col-1">
                    <button onclick="removeFilterItem(${nextNumber})" type="button" class="btn btn-outline-danger">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-trash"
                             viewBox="0 0 16 16">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"></path>
                            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"></path>
                        </svg>
                    </button>
                </div>
            </div>`

    $("#timeFilterRows").append(newFilterItem)
}

let addFilledFilterItem = function (day, start, end) {
    addFilterItem()
    const lastFilterItemId = filterItemNumbers[filterItemNumbers.length - 1]

    $(`#daySelector${lastFilterItemId}`).val(day);
    $(`#start${lastFilterItemId}`).val(start);
    $(`#end${lastFilterItemId}`).val(end);
}

let removeFilterItem = function (id) {
    if (filterItemNumbers.length <= 1) addFilterItem();
    let divId = "#timeFilterRow" + id;
    $(divId).remove()
    filterItemNumbers.splice(filterItemNumbers.indexOf(id), 1);
}

let getSelectedFilters = function () {
    let selectedTimesWithoutClasses = []
    let hasNoError = true

    let selectedDaysWithoutClasses = []
    let dayDivIds = ["#dayOffMon", "#dayOffTue", "#dayOffWed", "#dayOffThu", "#dayOffFri"]
    for (const dayId of dayDivIds) {
        const dayInput = $(dayId)
        if (dayInput.is(':checked')){
            selectedDaysWithoutClasses.push(dayInput.val())
            selectedTimesWithoutClasses.push([dayInput.val(), "00:00", "23:59"])
        }
    }

    for (const filterItemNumber of filterItemNumbers) {
        let dayInput = $(`#daySelector${filterItemNumber}`)
        let startInput = $(`#start${filterItemNumber}`)
        let endInput = $(`#end${filterItemNumber}`)

        let day = dayInput.val()
        let start = startInput.val()
        let end = endInput.val()

        if(selectedDaysWithoutClasses.includes(day)){
            continue
        }
        if(start && end){
            if(day !== "All"){
                selectedTimesWithoutClasses.push([day, start, end])
            }else{
                for (const d of ["Mon", "Tue", "Wed", "Thu", "Fri"]) {
                    if(!selectedDaysWithoutClasses.includes(d)) selectedTimesWithoutClasses.push([d, start, end])
                }
            }
        }else if(start || end){
            if(!start) startInput.addClass("is-invalid")
            if(!end) endInput.addClass("is-invalid")
            hasNoError = false
        }
    }
    localStorage.setItem("timesWOC", JSON.stringify(selectedTimesWithoutClasses))
    $("#courseFormTimesWC").val(JSON.stringify(selectedTimesWithoutClasses))
    return hasNoError
}

let addCourse = function (term, subject, code, isReloading = false, selectedSections = []) {
    if(Object.keys(selectedCourses).length === 0){
        $("#courseListTitle").text("Courses:").addClass("border-top")
        $("#courseListText").text("You can click on the course names to unselect the course sections you don't want to take.")
        $("#termSelector").prop('disabled', true);
        $("#formButton").removeClass("invisible")
        $("#removeAllButton").removeClass("invisible")
        $("#courseListDiv").css("display", "block");
        $("#courseFormTerm").val($("#termSelector").val())
    }

    let sectionOptions = [];
    $.ajax({
        url: `api/courseSections/${term}/${subject}/${code}`,
        method: 'GET',
        success: function(response) {
            sectionOptions = response;
        },
        error: function(xhr, status, error) {
            alert("Error: Cannot get course information! Refreshing the page!")
            location.reload()
        },
        async: false
    });
    let course = subject + " " + code
    if(!Object.keys(selectedCourses).includes(subject + "_" + code)){
        let courseItem = `<div id="li_${subject}${code}" class="accordion-item">
                <h2 class="accordion-header">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#panelsStayOpen-${subject}${code}" aria-expanded="false" aria-controls="panelsStayOpen-${subject}${code}">
                    ${course}
                  </button>
                </h2>
                <div id="panelsStayOpen-${subject}${code}" class="accordion-collapse collapse">
                  <div class="accordion-body">
                    <div class="row justify-content-between">
                       <div class="col-9 col-sm-11 d-flex align-items-center">`;

        for (let i = 0; i < sectionOptions.length; i++) {
            let checked = (!isReloading || selectedSections.includes(sectionOptions[i])) ? "checked" : "" ;
            courseItem += `
                <div class="form-check form-check-inline">
                  <input class="form-check-input" type="checkbox" id="s_${subject}${code}${sectionOptions[i]}" value="${subject} ${code} ${sectionOptions[i]}" onchange=\"sectionSelectionChanged(this)\" ${checked}>
                  <label class="form-check-label" for="s_${subject}${code}${sectionOptions[i]}">${sectionOptions[i]}</label>
                </div>
                `
        }

        courseItem += `</div>
              <div class=\"col-3 col-sm-1 d-flex align-items-center\">\
                <button onclick=\"removeItem('${subject}', '${code}')\" type=\"button\" class=\"btn btn-outline-danger\"> <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" fill=\"currentColor\" class=\"bi bi-trash\" viewBox=\"0 0 16 16\"><path d=\"M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z\"></path> <path d=\"M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z\"></path></svg></button>
              </div>`


        courseItem += "</div></div></div>"
        $("#courseList").append(courseItem)
        selectedCourses[subject + "_" + code] = isReloading ? [...selectedSections] : [...sectionOptions]
        $("#courseFormCourses").val(JSON.stringify(selectedCourses))
        localStorage.setItem('selectedCourses', JSON.stringify(selectedCourses))
        localStorage.setItem('selectedTerm', term)

        let courses = JSON.parse(localStorage.getItem("selectedCourses"))
        let selectedTerm = localStorage.getItem("selectedTerm")
    }
}

let updateUIForScheduleOptions = function (timesWOC) {
    const allDays = new Set(["Mon", "Tue", "Wed", "Thu", "Fri"]);

    const timeMap = new Map();
    for (const [day, start, end] of timesWOC) {
        if(start === "00:00" && end === "23:59"){
            const checkboxId = "#dayOff" + day
            $(checkboxId).prop("checked", true);
        }else{
            const timeKey = `${start}-${end}`;
            if (!timeMap.has(timeKey)) {
                timeMap.set(timeKey, new Set());
            }
            timeMap.get(timeKey).add(day);
        }
    }


    timeMap.forEach((days, timeKey) => {
        if (days.size === allDays.size) {
            days = new Set(["All"])
        }
        for (const day of days) {
            const [start, end] = timeKey.split('-');
            addFilledFilterItem(day, start, end);
        }
    });

    if(filterItemNumbers.length > 1){
        removeFilterItem(1)
    }

}

window.onpageshow = function (event) {
    if (event.persisted) {
        window.location.reload(); //reload page if it has been loaded from cache
    }
};

$( document ).ready(function() {
    $("#courseListDiv").css("display", "none");

    let courses = JSON.parse(localStorage.getItem("selectedCourses"))

    let term = localStorage.getItem("selectedTerm")
    let timesWOC = JSON.parse(localStorage.getItem("timesWOC"))

    if(term !== null){
        $("#termSelector").val(term);
    }else{
        $("#termSelector").val($("#termSelector option:first").val());
    }
    $('#termSelector').trigger('change');

    if(courses !== null){
        for (const courseName of Object.keys(courses)) {
            const [subj, code] = courseName.split("_")
            const sections = courses[courseName]
            addCourse(term, subj, code, true, sections)
        }
    }

    updateUIForScheduleOptions(timesWOC)
});
