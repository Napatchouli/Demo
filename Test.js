// Document ready events
$(document).ready(function() {
  // Smooth scrolling for navigation links
  $('a[href^="#"]').on('click', function(event) {
    const target = $(this.getAttribute('href'));
    if (target.length) {
      event.preventDefault();
      $('html, body').animate({
        scrollTop: target.offset().top - 70 // Adjusted for fixed navbar
      }, 500);
    }
  });

  // Set today's date as default for date inputs
  const today = new Date();
  const todayFormatted = today.toISOString().split('T')[0];
  $('#startDate').val(todayFormatted);
  
  // Set default end date as 4 weeks from today
  const defaultEndDate = new Date();
  defaultEndDate.setDate(today.getDate() + 28);
  const endDateFormatted = defaultEndDate.toISOString().split('T')[0];
  $('#endDate').val(endDateFormatted);
  
  // Initialize event listeners
  initializeEventListeners();
});

// Initialize all event listeners
function initializeEventListeners() {
  // INR Dosing calculator
  $('#calculateInrDosing').on('click', calculateInrDosing);
  $('#currentINR, #totalWarfarin').on('keypress', function(e) {
    if (e.which === 13) {
      e.preventDefault();
      $('#calculateInrDosing').click();
    }
  });
  $('#resetInrForm').on('click', function() {
    $('#inr-dosing-result').addClass('d-none');
  });
  
  // Warfarin followup calculator
  $('#calculateTablets').on('click', calculateTabletsToDispense);
  $('#resetFollowupForm').on('click', function() {
    $('#followup-result').addClass('d-none');
  });
  
  // TWD Design calculator
  $('#getTWD').on('click', calTWD);
  $('#TWD_Value').on('keypress', function(e) {
    if (e.which === 13) {
      e.preventDefault();
      $('#getTWD').click();
    }
  });
  $('#resetTwdForm').on('click', function() {
    $('#TWDResult').empty();
  });
  
  // Toggle all days when "Everyday" is checked
  $('#everydayCheck').on('change', function() {
    const isChecked = $(this).prop('checked');
    $('.day-select').prop('checked', isChecked);
    $('#daySelectionContainer').toggleClass('disabled', isChecked);
    $('.day-select').prop('disabled', isChecked);
  });
  
  // Validate date inputs
  $('#endDate').on('change', validateDates);
  $('#startDate').on('change', validateDates);
}

// Validate that end date is after start date
function validateDates() {
  const startDate = $('#startDate').val();
  const endDate = $('#endDate').val();
  
  if (startDate && endDate) {
    if (new Date(endDate) < new Date(startDate)) {
      showAlert('followup-result', 'End date must be after start date', 'danger');
      $('#endDate').val('');
    } else {
      $('#followup-result').addClass('d-none');
    }
  }
}

// Show alert message
function showAlert(elementId, message, type = 'success') {
  const alertElement = $(`#${elementId}`);
  alertElement.removeClass('d-none alert-success alert-danger alert-warning alert-info')
    .addClass(`alert-${type}`)
    .html(message);
}

// Calculate INR dosing adjustments
function calculateInrDosing() {
  const currentINR = parseFloat($('#currentINR').val());
  const totalWarfarin = parseFloat($('#totalWarfarin').val());
  
  if (isNaN(currentINR) || isNaN(totalWarfarin)) {
    showAlert('inr-dosing-result', 'Please enter valid numbers for INR and weekly warfarin dose.', 'danger');
    return;
  }
  
  let newDose_1 = totalWarfarin;
  let newDose_2 = totalWarfarin;
  let adjustmentPercent_1 = 0;
  let adjustmentPercent_2 = 0;
  let message = '';
  let alertType = 'info';
  
  // INR adjustments based on guidelines
  if (currentINR < 1.5) {
    adjustmentPercent_1 = 10; // Average of 10-20%
    adjustmentPercent_2 = 20; // Average of 10-20%
    message = '<strong>Low INR detected!</strong> Increase weekly dose by 10-20%.';
    alertType = 'warning';
    newDose_1 = totalWarfarin * (1 + adjustmentPercent_1/100);
    newDose_2 = totalWarfarin * (1 + adjustmentPercent_2/100);
  } 
  else if (currentINR >= 1.5 && currentINR < 2.0) {
    adjustmentPercent_1 = 5;
    adjustmentPercent_2 = 10; // Average of 5-10%
    message = '<strong>INR below target range.</strong> Increase weekly dose by 5-10%.';
    alertType = 'warning';
    newDose_1 = totalWarfarin * (1 + adjustmentPercent_1/100);
    newDose_2 = totalWarfarin * (1 + adjustmentPercent_2/100);
  }
  else if (currentINR >= 2.0 && currentINR <= 3.0) {
    message = '<strong>INR within target range.</strong> Continue same dose.';
    alertType = 'success';
  }
  else if (currentINR > 3.0 && currentINR < 4.0) {
    adjustmentPercent_1 = 5;
    adjustmentPercent_2 = 10; // Average of 5-10%
    message = '<strong>INR slightly elevated.</strong> Decrease weekly dose by 5-10%.';
    alertType = 'warning';
    newDose_1 = totalWarfarin * (1 - adjustmentPercent_1/100);
    newDose_2 = totalWarfarin * (1 - adjustmentPercent_2/100);
  }
  else if (currentINR >= 4.0 && currentINR < 5.0) {
    adjustmentPercent_1 = 10;
    message = '<strong>High INR detected!</strong> Hold for 1 day then decrease weekly dose by 10%.';
    alertType = 'danger';
    newDose_1 = totalWarfarin * (1 - adjustmentPercent_1/100);
    newDose_2 = 0;
  }
  else if (currentINR >= 5.0 && currentINR < 9.0) {
    adjustmentPercent = 15;
    message = '<strong>Critical INR level!</strong> Hold 1-2 doses and administer Vitamin K1 1 mg orally';
    alertType = 'danger';
  }
  else if (currentINR >= 9.0) {
    adjustmentPercent = 20;
    message = '<strong>Severe INR elevation!</strong> Administer Vitamin K1 5-10 mg orally.';
    alertType = 'danger';
  }
  
  // Round to nearest 0.5 mg
  newDose_1 = Math.round(newDose_1 * 2) / 2;
  newDose_2 = Math.round(newDose_2 * 2) / 2;

  // Percent adjustment
  adjustmentPercent_1 = parseFloat((newDose_1 / totalWarfarin - 1)*100).toFixed(1) ;
  adjustmentPercent_2 = parseFloat((newDose_2 / totalWarfarin - 1)*100).toFixed(1) ;
  
  // Create result HTML based on INR ranges
  let resultHTML;
  
  if (currentINR < 1.5) {
    resultHTML = `
      <p>${message}</p>
      <p><strong> Current weekly dose:</strong> ${totalWarfarin} mg</p>
      <p><strong>Recommended weekly dose:</strong> ${newDose_1} - ${newDose_2}  mg (${adjustmentPercent_1}  to ${adjustmentPercent_2} %)</p>
      <p>Check TWD Design tab for dosing regimen options.</p>
    `;
  }
  else if (currentINR >= 1.5 && currentINR < 2.0) {
    resultHTML = `
      <p>${message}</p>
      <p><strong>Current weekly dose:</strong> ${totalWarfarin} mg</p>
      <p><strong>Recommended weekly dose:</strong> ${newDose_1} - ${newDose_2}  mg (${adjustmentPercent_1}  to ${adjustmentPercent_2} %)</p>
      <p>Check TWD Design tab for dosing regimen options.</p>
    `;
  }
  else if (currentINR >= 2.0 && currentINR <= 3.0) {
    resultHTML = `
      <p>${message}</p>
      <p><strong> Current weekly dose:</strong> ${totalWarfarin} mg</p>
      <p>Check TWD Design tab for dosing regimen options.</p>
    `;
  }
  else if (currentINR > 3.0 && currentINR < 4.0) {
    resultHTML = `
      <p>${message}</p>
      <p><strong>Current weekly dose:</strong> ${totalWarfarin} mg</p>
      <p><strong>Recommended weekly dose:</strong> ${newDose_2} - ${newDose_1}  mg (${adjustmentPercent_1}  to ${adjustmentPercent_2} %)</p>
      <p>Check TWD Design tab for dosing regimen options.</p>
    `;
  }
  else if (currentINR >= 4.0 && currentINR < 5.0) {
    resultHTML = `
      <p>${message}</p>
      <p><strong>Current weekly dose:</strong> ${totalWarfarin} mg</p>
      <p><strong>Recommended weekly dose:</strong> ${newDose_1}  mg (${adjustmentPercent_1} %)</p>
      <p>Check TWD Design tab for dosing regimen options.</p>
    `;
  }
  else {
    resultHTML = `
      <p>${message}</p>
      <p><strong>Current weekly dose:</strong> ${totalWarfarin} mg</p>
      <p>Check TWD Design tab for dosing regimen options.</p>
    `;
  }
  
  showAlert('inr-dosing-result', resultHTML, alertType);
  
  // Automatically populate the TWD value in the TWD Design section
  $('#TWD_Value').val(newDose_1);
}

//Fetch data Warfarin_DB
let warfarinData = [];
const DB = "Warfarin_DB_from_colab_V2.json"
fetch(DB).then(response => response.json()).then(data =>{warfarinData = data ;console.log(data);});
//CheckBox 
function getCheckboxValue() {
    const checkedValues = [];
    if (document.getElementById("W2_checkbox").checked) {
        checkedValues.push(2);
    }
    if (document.getElementById("W3_checkbox").checked) {
        checkedValues.push(3);
    }
    if (document.getElementById("W5_checkbox").checked) {
        checkedValues.push(5);
    }
    console.log("Checked values:", checkedValues);
    return checkedValues;
}
//Function to calculate TWD 
function findSuitableRegimens(hospitalStrengths, targetTwd, allRegimens) {
    // 1. Find all regimens with the target TWD
    const regimensWithTargetTwd = allRegimens.filter(regimen => regimen.TWD === targetTwd);

    // 2. Filter regimens where all required strengths are available in hospitalStrengths
    const suitableRegimens = regimensWithTargetTwd.filter(regimen => {
        if (!Array.isArray(regimen.AvailableStrengths)) return false;
        return regimen.AvailableStrengths.every(requiredStrength =>
            hospitalStrengths.includes(requiredStrength)
        );
    });

    return suitableRegimens;
}

function calTWD() {
    const TWDValue = parseFloat(document.getElementById("TWD_Value").value);
    const checkedValues = getCheckboxValue(); // [2, 3, 5] as selected
    const resultDiv = document.getElementById("TWDResult");
    const totalWarfarin = parseFloat(document.getElementById("totalWarfarin").value);
    const PercentChange = ((TWDValue / totalWarfarin * 100)-100).toFixed(1); // Calculate percent change
    const changeDirection = PercentChange > 0 ? '+' : '';
    let percentChangeText = `(${changeDirection}${PercentChange} % จาก ${totalWarfarin} mg/wk)`;
    // If no checkbox is checked, show error and return
    if (checkedValues.length === 0) {
        resultDiv.innerHTML = `
        <div class="alert alert-warning">
            <strong>Error:</strong> Please select at least one Warfarin strength.
        </div>`;
        return;
    }
    //if totalWarfarin is Empty , hide percentChangeText
    if (isNaN(totalWarfarin) || totalWarfarin === '') {
        percentChangeText = '';
    }

    // Use the new logic
    const results = findSuitableRegimens(checkedValues, TWDValue, warfarinData);

    if (results.length > 0) {
        let html = `<div class="alert alert-info">
            <strong>Results for TWD ${TWDValue} mg/day ${percentChangeText}:</strong><br>`;
        results.forEach((result, idx) => {
            html += `<div style="margin-bottom:8px;">
                <strong>Regimen ${idx + 1}:</strong><br>`;
            if (checkedValues.includes(2) && result.Warfarin_2_mg && result.Warfarin_2_mg.trim() !== "") {
                html += `Warfarin 2 mg: ${result.Warfarin_2_mg}<br>`;
            }
            if (checkedValues.includes(3) && result.Warfarin_3_mg && result.Warfarin_3_mg.trim() !== "") {
                html += `Warfarin 3 mg: ${result.Warfarin_3_mg}<br>`;
            }
            if (checkedValues.includes(5) && result.Warfarin_5_mg && result.Warfarin_5_mg.trim() !== "") {
                html += `Warfarin 5 mg: ${result.Warfarin_5_mg}<br>`;
            }
            html += `</div>`;
        });
        html += `</div>`;
        resultDiv.innerHTML = html;
    } else {
        resultDiv.innerHTML = `
        <div class="alert alert-danger">
            <strong>Not Available:</strong> No regimen found for TWD ${TWDValue} mg/day with selected strengths.
        </div>`;
    }
}







// Calculate number of tablets to dispense
function calculateTabletsToDispense() {
  // Get form values
  const dosage = parseFloat($('#warfarinDosage').val());
  const tabletsPerDay = parseFloat($('#tabletsPerDay').val());
  const startDate = new Date($('#startDate').val());
  const endDate = new Date($('#endDate').val());
  const everyDay = $('#everydayCheck').prop('checked');
  
  // Validate inputs
  if (isNaN(dosage) || isNaN(tabletsPerDay) || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    showAlert('followup-result', 'Please fill in all required fields correctly.', 'danger');
    return;
  }
  
  // Validate end date is after start date
  if (endDate < startDate) {
    showAlert('followup-result', 'End date must be after start date.', 'danger');
    return;
  }
  
  let totalDays = 0;
  const daysDifference = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  
  if (everyDay) {
    // If "Everyday" is checked, use all days
    totalDays = daysDifference;
  } else {
    // Get selected days
    const selectedDays = Array.from(document.querySelectorAll('.day-select:checked')).map(day => parseInt(day.value));
    
    if (selectedDays.length === 0) {
      showAlert('followup-result', 'Please select at least one day of the week.', 'warning');
      return;
    }
    
    // Count matching days in the date range
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      if (selectedDays.includes(currentDate.getDay())) {
        totalDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  // Calculate tablets needed
  const totalTablets = totalDays * tabletsPerDay;
  const roundedTablets = Math.ceil(totalTablets); // Round up to ensure enough tablets
  
  // Calculate TWD based on selected days
  let daysPerWeek = everyDay ? 7 : document.querySelectorAll('.day-select:checked').length;
  const twd = (dosage * tabletsPerDay * daysPerWeek);
  
  // Format dates for display
  const startDateStr = startDate.toLocaleDateString();
  const endDateStr = endDate.toLocaleDateString();
  
  // Create result message
  let resultHTML = `
    <h5>Dispensing Summary</h5>
    <p><strong>Date Range:</strong> ${startDateStr} to ${endDateStr} (${daysDifference} days)</p>
    <p><strong>Dosing Days:</strong> ${everyDay ? 'Every day' : selectedDaysToString(document.querySelectorAll('.day-select:checked'))}</p>
    <p><strong>Dosage:</strong> warfarin ${dosage} mg take ${tabletsPerDay} tab/day</p>
    <p><strong>Total Weekly Dose (TWD):</strong> ${twd} mg</p>
    <p><strong>Total Tablets to Dispense:</strong> ${roundedTablets} tablets</p>
  `;
  
  showAlert('followup-result', resultHTML, 'success');
  
  // Auto-populate TWD in the TWD Design section
  $('#TWD_Value').val(twd);
}

// Convert selected days to readable string
function selectedDaysToString(selectedCheckboxes) {
  if (!selectedCheckboxes || selectedCheckboxes.length === 0) return 'None selected';
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const selectedDayNames = Array.from(selectedCheckboxes).map(checkbox => dayNames[parseInt(checkbox.value)]);
  
  if (selectedDayNames.length === 7) return 'Every day';
  
  return selectedDayNames.join(', ');
}
