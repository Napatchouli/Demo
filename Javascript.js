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
  $('#getTWD').on('click', getTWD);
  $('#TWD_Value').on('keypress', function(e) {
    if (e.which === 13) {
      e.preventDefault();
      $('#getTWD').click();
    }
  });
  $('#resetTwdForm').on('click', function() {
    $('#warfarin-regimens-result').empty();
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

// Warfarin regimens data
const WarfarinRegimens = {
  rawData: [
    ['TWD', 'Warfarin 3 mg', 'Warfarin 5 mg'],
    ['3', '0.5 x 1 hs q จ,ศ', ''],
    ['5', '', '0.5x1 hs q จ,ศ'],
    ['5.25', '0.25x1 hs q ทุกวัน', ''],
    ['5.5', '0.25x1 hs q จ-พฤ', '0.25x1 hs q ศ-ส'],
    ['6', '0.5x1 hs q จ,พ,ศ,อา', ''],
    ['7', '0.5x1 hs q จ,พ,ศ', '0.5x1 hs q อา'],
    ['8', '0.5x1 hs q จ,พ', '0.5x1 hs q ศ,อา'],
    ['8.5', '0.5x1 hs q จ-พฤ', '0.5x1 hs q ศ'],
    ['8.75', '', '0.25x1 hs q ทุกวัน'],
    ['9', '0.5x1 hs ทุกวัน เว้น อา', ''],
    ['9.5', '0.5x1 hs q จ - พ', '0.5x1 hs q พฤ, ศ'],
    ['10', '', '0.5x1 hs q จ, พ, ศ, อา'],
    ['10.5', '0.5x1 hs q ทุกวัน', ''],
    ['11', '0.5x1 hs q จ-พฤ', '0.5x1 hs q ศ, ส'],
    ['11.5', '0.5x1 hs q จ-ส', '0.5x1 hs q อา'],
    ['12', '0.5x1 hs q จ-ส และ 1x1 hs q อา', ''],
    ['12.5', '', '0.5x1 hs q จ-ศ'],
    ['13', '0.5x1 hs q จ, อ', '0.5x1 hs q พ-ส'],
    ['13.5', '0.5x1 hs q จ-ศ และ 1x1 hs q ส-อา', ''],
    ['14', '0.5x1 hs q จ', '0.5x1 hs q อ-ส'],
    ['14.5', '0.5x1 hs q จ,อ,พ', '0.5x1 hs q พฤ-อา'],
    ['15', '', '0.5x1 hs q ทุกวัน เวัน อา'],
    ['15.5', '0.5x1 hs q จ,อ', '0.5x1 hs q พ-อา'],
    ['15.75', '0.75x1 hs q ทุกวัน', ''],
    ['16', '0.5x1 hs q จ-พฤ และ 1x1 hs q ศ-ส', ''],
    ['16.5', '0.5x1 hs q จ-พ และ 1x1 hs q พฤ-อา', ''],
    ['17', '0.5x1 hs q ส และ 1x1 hs q อา', '0.5x1 hs q จ-ศ'],
    ['17.5', '', '0.5x1 hs q ทุกวัน'],
    ['18', '1x1 hs q ทุกวัน เว้น อา', ''],
    ['18.5', '1x1 hs q ส,อา', '0.5x1 hs q จ-ศ'],
    ['19', '1x1 hs q ศ-อา', '0.5x1 hs q จ-พฤ'],
    ['19.5', '0.5x1 hs q จ และ 1x1 hs q อ-อา', ''],
    ['20', '', '0.5x1 hs q จ-ส และ 1x1 hs q อา'],
    ['20.5', '1x1 hs q จ-ส', '0.5x1 hs q อา'],
    ['21', '1x1 hs q ทุกวัน', ''],
    ['21.5', '1.5x1 hs q ส-อา', '0.5x1 hs q จ-ศ'],
    ['22', '2x1 hs q ศ-ส', '0.5x1 hs q จ-พฤ'],
    ['22.5', '', '0.5x1 hs q จ-ศ และ 1x1 hs q ส-อา'],
    ['23', '1x1 hs q จ-ส', '1x1 hs q อา'],
    ['23.5', '1.5x1 hs q ศ-อา', '0.5x1 hs q จ-พฤ'],
    ['24', '1x1 hs q จ-ส และ 2x1 hs q อา', ''],
    ['24.5', '', ''],
    ['25', '', '1x1 hs q จ-ศ'],
    ['25.5', '1x1 hs q จ-พฤ และ 1.5x1 hs q ศ-อา', ''],
    ['26', '', ''],
    ['26.5', '0.5x1 hs q ส', '1x1 hs q จ-ศ'],
    ['27', '1x1 hs q จ-ศ และ 2x1 hs q ส-อา', ''],
    ['27.5', '', '1x1 hs q จ-ศ และ 0.5x1 hs q ส'],
    ['28', '', ''],
    ['28.5', '1.5x1 hs q จ-ศ และ 1x1 hs q ส-อา', ''],
    ['29', '1x1 hs q จ-พ', '1x1 hs q พฤ-อา'],
    ['29.5', '1.5x1 hs q ส', '1x1 hs q จ-ศ'],
    ['30', '', '1x1 hs q ทุกวัน เว้น อา'],
    ['30.5', '', ''],
    ['31', '1x1 hs q ส-อา', '1x1 hs q จ-ศ'],
    ['31.5', '1.5x1 hs q ทุกวัน', ''],
    ['32', '', ''],
    ['32.5', '1.5x1 hs q จ-ศ', '1x1 hs q ส-อา'],
    ['33', '1.5x1 hs q จ-ส และ 2x1 hs q อา', ''],
    ['33.5', '1.5x1 hs q จ-พ', '1x1 hs q พฤ-อา'],
    ['34', '1.5x1 hs q ส-อา', '1x1 hs q จ-ศ'],
    ['34.5', '1.5x1 hs q จ-ศ และ 2x1 hs q ส-อา', ''],
    ['35', '1x1 hs q ทุกวัน', ''],
    ['35.5', '', ''],
    ['36', '2x1 hs q อา', '1x1 hs q จ-ส'],
    ['36.5', '0.5x1 hs q อา', '1x1 hs q ทุกวัน'],
    ['37', '2x1 hs q ส-อา', '1x1 hs q จ-ศ'],
    ['37.5', '', '1x1 hs q จ-ส และ 1.5x1 hs q อา'],
    ['38', '2x1 hs q ศ-อา', '1x1 hs q จ-พฤ'],
    ['38.5', '1x1 hs q ทุกวัน', '0.5x1 hs q ทุกวัน'],
    ['39', '2x1 hs q จ-ส และ 1x1 hs q อา', ''],
    ['39.5', '0.5x1 hs q จ-พ-ศ', '1x1 hs q ทุกวัน'],
    ['40', '2x1 hs q จ-ศ', '1x1 hs q ส-อา'],
    ['40.5', '2x1 hs q จ-ส และ 1.5x1 hs q อา', ''],
    ['41', '2x1 hs q จ-ส', '1x1 hs q อา'],
    ['41.5', '', ''],
    ['42', '2x1 hs q ทุกวัน', ''],
    ['42.5', '', '2x1 hs q จ-ศ และ 0.5x1 hs q ส-อา'],
    ['43', '', ''],
    ['43.5', '1x1 hs q ส-อา', '1.5x1 hs q จ-ศ'],
    ['44', '1x1 hs q ศ-อา', '1x1 hs q ทุกวัน'],
    ['44.5', '', ''],
    ['45', '3x1 hs q จ-ศ', ''],
    ['45.5', '0.5x1 hs q ทุกวัน', '1x1 hs q ทุกวัน'],
    ['46', '', ''],
    ['46.5', '1.5x1 hs q ส-อา', '1.5x1 hs q จ-ศ'],
    ['47', '1x1 hs q พฤ-อา', '1x1 hs q ทุกวัน'],
    ['47.5', '', '1.5x1 hs q จ-ศ และ 1x1 hs q ส-อา'],
    ['50', '1x1 hs q จ-ศ', '1x1 hs q ทุกวัน'],
    ['51', '1x hs q ทุกวัน', '1x1 hs q จ-ส'],
    ['52.5', '1x hs q ทุกวัน', '1.5x1 hs q ทุกวัน'],
    ['54', '3x1 hs q จ-ส', ''],
    ['55', '', '2x1 hs q จ-พฤ และ 1x1 hs q ศ-อา'],
    ['56', '1x1 hs q ทุกวัน', '1x1 hs q ทุกวัน'],
    ['57', '3x1 hs q จ-ศ และ 2x1 hs q ส-อา', ''],
    ['60', '', '2x1 hs q จ-ศ และ 1x1 hs q ส-อา'],
    ['60', '', '2x1 hs q จ-ศ และ 1x1 hs q ส-อา'],
    ['62.5', '', '2x1 hs q จ-พฤ และ 1.5x1 hs q ศ-อา'],
    ['63', '3x1 hs q ทุกวัน', ''],
    ['65', '', '2x1 hs q จ-ศ และ 1.5x1 hs q ส-อา'],
    ['66.5', '1.5x1 hs q ทุกวัน', '1x1 hs q ทุกวัน'],
    ['67.5', '', '2x1 hs q จ-ส และ 1.5x1 hs q อา'],
    ['70', '', '2x1 hs q จ-ส และ 1.5x1 hs q อา'],


  ]
};

// Get TWD and display regimen
function getTWD() {
  const twdValue = document.getElementById("TWD_Value").value;
  const resultDiv = document.getElementById("warfarin-regimens-result");
  resultDiv.innerHTML = ""; // Clear previous results
  
  if (!twdValue) {
    showEmptyTWDError(resultDiv);
    return;
  }

  // Find exact match first
  let regimen = WarfarinRegimens.rawData.find(row => row[0] === twdValue);
  
  // If no exact match, find closest value
  if (!regimen) {
    const closestRegimen = findClosestRegimen(twdValue);
    if (closestRegimen) {
      const message = document.createElement("div");
      message.className = "alert alert-info";
      message.innerHTML = `No exact match for ${twdValue} mg. Showing closest available regimen (${closestRegimen[0]} mg).`;
      resultDiv.appendChild(message);
      regimen = closestRegimen;
    } else {
      const noRegimen = document.createElement("div");
      noRegimen.className = "alert alert-warning";
      noRegimen.textContent = "No regimen found for this TWD value.";
      resultDiv.appendChild(noRegimen);
      return;
    }
  }

  displayRegimenTable(regimen, resultDiv);
}

// Find closest regimen in the dataset
function findClosestRegimen(targetTWD) {
  // Skip header row
  const validRegimens = WarfarinRegimens.rawData.slice(1);
  
  // Convert target to number for comparison
  const target = parseFloat(targetTWD);
  
  let closest = null;
  let closestDiff = Infinity;
  
  for (const regimen of validRegimens) {
    const currentTWD = parseFloat(regimen[0]);
    const diff = Math.abs(currentTWD - target);
    
    if (diff < closestDiff) {
      closest = regimen;
      closestDiff = diff;
    }
  }
  
  // Only return if difference is within reasonable range (1.5 mg)
  return closestDiff <= 1.5 ? closest : null;
}

// Display table with regimen data
function displayRegimenTable(regimen, resultDiv) {
  const totalWarfarin = parseFloat($('#totalWarfarin').val());
  const newTWD = parseFloat(regimen[0]);
  let percentChange = '';
  
  if (!isNaN(totalWarfarin) && totalWarfarin > 0) {
    const changePercent = ((newTWD - totalWarfarin) / totalWarfarin * 100).toFixed(1);
    const changeDirection = changePercent > 0 ? '+' : '';
    percentChange = ` (${changeDirection}${changePercent}%)`;
  }

  const table = document.createElement("table");
  table.className = "table table-striped table-bordered";
  table.style.width = "100%";
  
  const thead = document.createElement("thead");
  thead.className = "table-dark";
  const headerRow = document.createElement("tr");
  ["Warfarin Dosage", "Regimen"].forEach(text => {
    const th = document.createElement("th");
    th.textContent = text;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  
  const tbody = document.createElement("tbody");
  
  // Add row for 3mg if data exists
  if (regimen[1]) {
    const row3mg = document.createElement("tr");
    row3mg.innerHTML = `<td>Warfarin 3 mg</td><td>${regimen[1]}</td>`;
    tbody.appendChild(row3mg);
  }
  
  // Add row for 5mg if data exists
  if (regimen[2]) {
    const row5mg = document.createElement("tr");
    row5mg.innerHTML = `<td>Warfarin 5 mg</td><td>${regimen[2]}</td>`;
    tbody.appendChild(row5mg);
  }

  // Add total/week row with percent change
  const total = document.createElement("tr");
  total.className = "table-primary";
  total.innerHTML = `<td><strong>Total/week</strong></td><td><strong>${regimen[0]} mg${percentChange}</strong></td>`;
  tbody.appendChild(total);

  table.appendChild(thead);
  table.appendChild(tbody);
  resultDiv.appendChild(table);
}

// Show error when TWD is empty
function showEmptyTWDError(resultDiv) {
  const errorMsg = document.createElement("div");
  errorMsg.className = "alert alert-danger";
  errorMsg.textContent = "Please enter a TWD value.";
  resultDiv.appendChild(errorMsg);
}

// Print regimen card
function printRegimenCard(regimen) {
  const printWindow = window.open('', '_blank');
  
  printWindow.document.write(`
    <html>
      <head>
        <title>Warfarin Regimen - ${regimen[0]} mg/week</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .regimen-card { border: 1px solid #ccc; padding: 15px; max-width: 500px; margin: 0 auto; }
          .regimen-header { font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
          .regimen-body { font-size: 16px; }
          .regimen-row { margin-bottom: 10px; }
          .regimen-label { font-weight: bold; }
          .regimen-value { margin-left: 10px; }
          .footer { margin-top: 20px; font-size: 12px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="regimen-card">
          <div class="regimen-header">Warfarin Weekly Dosing Regimen - ${regimen[0]} mg/week</div>
          <div class="regimen-body">
            ${regimen[1] ? `
              <div class="regimen-row">
                <span class="regimen-label">Warfarin 3 mg:</span>
                <span class="regimen-value">${regimen[1]}</span>
              </div>
            ` : ''}
            ${regimen[2] ? `
              <div class="regimen-row">
                <span class="regimen-label">Warfarin 5 mg:</span>
                <span class="regimen-value">${regimen[2]}</span>
              </div>
            ` : ''}
            <div class="regimen-row">
              <span class="regimen-label">Total weekly dose:</span>
              <span class="regimen-value">${regimen[0]} mg</span>
            </div>
          </div>
          <div class="footer">Generated by Pharmacist's WorkWeb on ${new Date().toLocaleDateString()}</div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `);
  
  printWindow.document.close();
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
