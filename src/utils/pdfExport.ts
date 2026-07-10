import { isMarried } from "@/utils/marital";
import { format } from "date-fns";

// Utility function to export profile data as PDF
export const exportProfileToPDF = (employee: any) => {
  // Create a new window for the PDF content
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to export PDF');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Employee Profile - ${employee.personal.nameFull}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #007580;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #007580;
          margin: 0;
          font-size: 24px;
        }
        .header h2 {
          color: #666;
          margin: 5px 0 0 0;
          font-size: 18px;
          font-weight: normal;
        }
        .profile-header {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          border-left: 4px solid #007580;
        }
        .profile-header h3 {
          margin: 0 0 10px 0;
          color: #007580;
          font-size: 20px;
        }
        .profile-info {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-top: 15px;
        }
        .info-item {
          margin-bottom: 10px;
        }
        .info-label {
          font-weight: bold;
          color: #666;
        }
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .section-title {
          background: #007580;
          color: white;
          padding: 10px 15px;
          margin: 0 0 20px 0;
          font-size: 16px;
          font-weight: bold;
        }
        .section-content {
          padding: 0 15px;
        }
        .two-column {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 30px;
        }
        .three-column {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px 12px;
          text-align: left;
        }
        th {
          background: #f8f9fa;
          font-weight: bold;
          color: #333;
        }
        .badge {
          background: #007580;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          display: inline-block;
        }
        .status-active {
          background: #28a745;
        }
        .declaration {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-top: 15px;
          font-style: italic;
        }
        @media print {
          body { margin: 0; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>EMPLOYEE PROFILE</h1>
        <h2>Personal Particulars</h2>
      </div>

      <div class="profile-header">
        <h3>${employee.personal.nameFull}</h3>
        <div class="profile-info">
          <div class="info-item">
            <span class="info-label">Employee ID:</span> ${employee.employment.employeeId}
          </div>
          <div class="info-item">
            <span class="info-label">Designation:</span> ${employee.personal.designation}
          </div>
          <div class="info-item">
            <span class="info-label">Department:</span> ${employee.personal.placeOfWork}
          </div>
          <div class="info-item">
            <span class="info-label">Status:</span> <span class="badge status-active">${employee.employment.status}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Section A - Personal Particulars</h2>
        <div class="section-content">
          <div class="three-column">
            <div>
              <div class="info-item">
                <span class="info-label">Full Name:</span><br>
                ${employee.personal.nameFull}
              </div>
              <div class="info-item">
                <span class="info-label">National ID:</span><br>
                ${employee.personal.nationalId}
              </div>
              ${employee.personal.tinNo ? `
              <div class="info-item">
                <span class="info-label">TIN No:</span><br>
                ${employee.personal.tinNo}
              </div>
              ` : ''}
              <div class="info-item">
                <span class="info-label">Nationality:</span><br>
                ${employee.personal.nationality}
              </div>
            </div>
            <div>
              <div class="info-item">
                <span class="info-label">Contact Address:</span><br>
                ${employee.personal.contactAddress}
              </div>
              <div class="info-item">
                <span class="info-label">Mobile Phone(s):</span><br>
                ${employee.personal.mobilePhones.join('<br>')}
              </div>
              <div class="info-item">
                <span class="info-label">Place of Work:</span><br>
                ${employee.personal.placeOfWork}
              </div>
            </div>
            <div>
              <div class="info-item">
                <span class="info-label">Date of Birth:</span><br>
                ${new Date(employee.personal.dateOfBirth).toLocaleDateString()}
              </div>
              <div class="info-item">
                <span class="info-label">Place of Birth:</span><br>
                ${employee.personal.placeOfBirth}
              </div>
              <div class="info-item">
                <span class="info-label">Terms of Service:</span><br>
                <span class="badge">${employee.personal.termsOfService}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Marital Status:</span><br>
                ${employee.personal.maritalStatus}
                ${isMarried(employee.personal.maritalStatus) && employee.personal.spouseName ? 
                  `<br><small>Spouse: ${employee.personal.spouseName}${employee.personal.spouseContacts ? ` (${employee.personal.spouseContacts})` : ''}</small>` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Section B - Family Particulars</h2>
        <div class="section-content">
          <div class="two-column">
            <div>
              <h4>Father's Information</h4>
              <div class="info-item">
                <span class="info-label">Name:</span> ${employee.family.fatherName}
              </div>
              <div class="info-item">
                <span class="info-label">Place of Birth:</span> ${employee.family.fatherPlaceOfBirth}
              </div>
              <div class="info-item">
                <span class="info-label">Nationality:</span> ${employee.family.fatherNationality}
              </div>
            </div>
            <div>
              <h4>Mother's Information</h4>
              <div class="info-item">
                <span class="info-label">Name:</span> ${employee.family.motherName}
              </div>
              <div class="info-item">
                <span class="info-label">Place of Birth:</span> ${employee.family.motherPlaceOfBirth}
              </div>
              <div class="info-item">
                <span class="info-label">Nationality:</span> ${employee.family.motherNationality}
              </div>
            </div>
          </div>
          
          ${employee.family.children && employee.family.children.length > 0 ? `
          <div style="margin-top: 30px;">
            <h4>Children</h4>
            <table>
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Name</th>
                  <th>Sex</th>
                  <th>Date of Birth</th>
                </tr>
              </thead>
              <tbody>
                ${employee.family.children.map((child: any, index: number) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${child.name}</td>
                  <td>${child.sex}</td>
                  <td>${new Date(child.dateOfBirth).toLocaleDateString()}</td>
                </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}
        </div>
      </div>

      ${employee.education && employee.education.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Section C - Education Qualification</h2>
        <div class="section-content">
          <table>
            <thead>
              <tr>
                <th>School/Institution</th>
                <th>Place</th>
                <th>From</th>
                <th>To</th>
              </tr>
            </thead>
            <tbody>
              ${employee.education.map((edu: any) => `
              <tr>
                <td>${edu.institution}</td>
                <td>${edu.place}</td>
                <td>${new Date(edu.fromDate).toLocaleDateString()}</td>
                <td>${new Date(edu.toDate).toLocaleDateString()}</td>
              </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}

      ${employee.nextOfKin && employee.nextOfKin.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Section D - Next of Kin</h2>
        <div class="section-content">
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Name</th>
                <th>Age</th>
                <th>Relation</th>
                <th>Contact</th>
                <th>Primary</th>
              </tr>
            </thead>
            <tbody>
              ${employee.nextOfKin.map((nok: any, index: number) => `
              <tr>
                <td>${index + 1}</td>
                <td>${nok.name}</td>
                <td>${nok.age}</td>
                <td>${nok.relation}</td>
                <td>${nok.contact}</td>
                <td>${nok.primary ? '<span class="badge">Primary</span>' : ''}</td>
              </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}

      <div class="section">
        <h2 class="section-title">Section E - Declaration</h2>
        <div class="section-content">
          <div class="declaration">
            ${employee.declaration.text}
          </div>
          <div style="margin-top: 30px;">
            <div class="two-column">
              <div>
                <span class="info-label">Signed by:</span> ${employee.declaration.signedBy}
              </div>
              <div>
                <span class="info-label">Date:</span> ${new Date(employee.declaration.signedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      ${employee.employment.projects && employee.employment.projects.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Project Assignments</h2>
        <div class="section-content">
          <table>
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Donor</th>
                <th>Code</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              ${employee.employment.projects.map((project: any) => `
              <tr>
                <td>${project.projectName}</td>
                <td>${project.donor}</td>
                <td>${project.code}</td>
                <td>${project.isPrimary ? '<span class="badge">Primary</span>' : 'Secondary'}</td>
              </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}

      <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
        Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for content to load, then trigger print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };
};

// Utility function to export review data as PDF
export const exportReviewToPDF = (review: any, reviewSections: any[], goals: any[]) => {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to export PDF');
    return;
  }

  const averageScore = reviewSections.reduce((acc, section) => acc + section.score, 0) / reviewSections.length;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Performance Review - ${review.employee}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #007580;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #007580;
          margin: 0;
          font-size: 24px;
        }
        .header h2 {
          color: #666;
          margin: 5px 0 0 0;
          font-size: 18px;
          font-weight: normal;
        }
        .review-header {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          border-left: 4px solid #007580;
        }
        .review-header h3 {
          margin: 0 0 10px 0;
          color: #007580;
          font-size: 20px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        .summary-card {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
        }
        .summary-card .label {
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
        }
        .summary-card .value {
          font-size: 24px;
          font-weight: bold;
          color: #007580;
        }
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .section-title {
          background: #007580;
          color: white;
          padding: 10px 15px;
          margin: 0 0 20px 0;
          font-size: 16px;
          font-weight: bold;
        }
        .section-content {
          padding: 0 15px;
        }
        .performance-item {
          background: #f8f9fa;
          padding: 15px;
          margin-bottom: 15px;
          border-radius: 8px;
          border-left: 3px solid #007580;
        }
        .performance-item h4 {
          margin: 0 0 10px 0;
          color: #333;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .score-badge {
          background: #007580;
          color: white;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 14px;
        }
        .stars {
          color: #fbbf24;
        }
        .goal-item {
          background: #f8f9fa;
          padding: 12px;
          margin-bottom: 10px;
          border-radius: 8px;
        }
        .goal-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .progress-bar {
          background: #e5e7eb;
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-fill {
          background: #007580;
          height: 100%;
        }
        .badge {
          background: #007580;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          display: inline-block;
        }
        @media print {
          body { margin: 0; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PERFORMANCE REVIEW</h1>
        <h2>${review.period}</h2>
      </div>

      <div class="review-header">
        <h3>${review.employee}</h3>
        <p><strong>Department:</strong> ${review.department}</p>
        <p><strong>Reviewer:</strong> ${review.reviewer}</p>
        <p><strong>Status:</strong> <span class="badge">${review.status}</span></p>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <div class="label">Overall Score</div>
          <div class="value">${averageScore.toFixed(1)}</div>
          <div class="stars">â˜…â˜…â˜…â˜…â˜…</div>
        </div>
        <div class="summary-card">
          <div class="label">Review Period</div>
          <div class="value" style="font-size: 14px;">${review.period}</div>
        </div>
        <div class="summary-card">
          <div class="label">Due Date</div>
          <div class="value" style="font-size: 14px;">${review.dueDate}</div>
        </div>
        <div class="summary-card">
          <div class="label">Improvement</div>
          <div class="value">+0.3</div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Performance Areas</h2>
        <div class="section-content">
          ${reviewSections.map(section => `
            <div class="performance-item">
              <h4>
                <span>${section.title}</span>
                <span class="score-badge">${section.score} / 5.0</span>
              </h4>
              <p>${section.feedback}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Goals & Objectives</h2>
        <div class="section-content">
          ${goals.map(goal => `
            <div class="goal-item">
              <div class="goal-header">
                <strong>${goal.title}</strong>
                <span style="font-size: 12px; color: #666;">Due: ${goal.dueDate}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${goal.progress}%"></div>
              </div>
              <div style="text-align: right; margin-top: 4px; font-size: 12px; color: #666;">
                ${goal.progress}% Complete
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
        Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };
};


// Utility function to export trip request data as PDF
export const exportTripToPDF = (trip: any) => {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to export PDF');
    return;
  }

  // Extract names from related objects or use IDs as fallback
  const requesterName = trip.requester?.full_name || trip.requester_name || 'N/A';
  const projectName = trip.project?.name || trip.project_name || 'N/A';
  const donorName = trip.project?.donor || trip.donor_name || 'N/A';
  const driverName = trip.assigned_driver?.name || trip.assigned_driver_name || 'Not assigned';
  const vehicleInfo = trip.assigned_vehicle 
    ? `${trip.assigned_vehicle.make} ${trip.assigned_vehicle.model} (${trip.assigned_vehicle.plate_number})`
    : trip.assigned_vehicle_info || 'Not assigned';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Trip Request - ${trip.destination}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #007580;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #007580;
          margin: 0;
          font-size: 24px;
        }
        .header h2 {
          color: #666;
          margin: 5px 0 0 0;
          font-size: 18px;
          font-weight: normal;
        }
        .trip-header {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          border-left: 4px solid #007580;
        }
        .trip-header h3 {
          margin: 0 0 10px 0;
          color: #007580;
          font-size: 20px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-top: 15px;
        }
        .info-item {
          margin-bottom: 10px;
        }
        .info-label {
          font-weight: bold;
          color: #666;
        }
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .section-title {
          background: #007580;
          color: white;
          padding: 10px 15px;
          margin: 0 0 20px 0;
          font-size: 16px;
          font-weight: bold;
        }
        .section-content {
          padding: 0 15px;
        }
        .badge {
          background: #007580;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          display: inline-block;
        }
        .status-approved {
          background: #28a745;
        }
        .status-pending {
          background: #fbbf24;
        }
        .status-scheduled {
          background: #3b82f6;
        }
        .content-box {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-top: 15px;
        }
        @media print {
          body { margin: 0; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>TRIP REQUEST AUTHORIZATION</h1>
        <h2>Official Travel Document</h2>
      </div>

      <div class="trip-header">
        <h3>${trip.destination}</h3>
        <p><strong>Status:</strong> <span class="badge status-${trip.status}">${trip.status.toUpperCase()}</span></p>
        <p><strong>Project:</strong> ${projectName}</p>
        <p><strong>Donor:</strong> ${donorName}</p>
      </div>

      <div class="section">
        <h2 class="section-title">Trip Details</h2>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Purpose:</span><br>
              ${trip.purpose}
            </div>
            <div class="info-item">
              <span class="info-label">Destination:</span><br>
              ${trip.destination}
            </div>
            <div class="info-item">
              <span class="info-label">Pickup Location:</span><br>
              ${trip.pickup_location}
            </div>
            <div class="info-item">
              <span class="info-label">Drop Location:</span><br>
              ${trip.drop_location || 'Same as pickup'}
            </div>
            <div class="info-item">
              <span class="info-label">Start Date & Time:</span><br>
              ${new Date(trip.start_datetime || trip.startDateTime).toLocaleString()}
            </div>
            <div class="info-item">
              <span class="info-label">End Date & Time:</span><br>
              ${new Date(trip.end_datetime || trip.endDateTime).toLocaleString()}
            </div>
            <div class="info-item">
              <span class="info-label">Passengers:</span><br>
              ${trip.passengers_count}
            </div>
            ${trip.luggage_notes ? `
            <div class="info-item">
              <span class="info-label">Luggage Notes:</span><br>
              ${trip.luggage_notes}
            </div>
            ` : ''}
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Resource Assignment</h2>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Driver:</span><br>
              ${driverName}
            </div>
            
            <div class="info-item">
              <span class="info-label">Vehicle:</span><br>
              ${vehicleInfo}
            </div>
          </div>
        </div>
      </div>

      ${trip.terms_of_reference ? `
      <div class="section">
        <h2 class="section-title">Terms of Reference</h2>
        <div class="section-content">
          <div class="content-box">
            ${trip.terms_of_reference}
          </div>
        </div>
      </div>
      ` : ''}

      ${trip.objectives ? `
      <div class="section">
        <h2 class="section-title">Objectives</h2>
        <div class="section-content">
          <div class="content-box">
            ${trip.objectives}
          </div>
        </div>
      </div>
      ` : ''}

      ${trip.expected_outcomes ? `
      <div class="section">
        <h2 class="section-title">Expected Outcomes</h2>
        <div class="section-content">
          <div class="content-box">
            ${trip.expected_outcomes}
          </div>
        </div>
      </div>
      ` : ''}

      <div class="section">
        <h2 class="section-title">Approval Information</h2>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Requested By:</span><br>
              ${requesterName}
            </div>
            <div class="info-item">
              <span class="info-label">Created:</span><br>
              ${new Date(trip.created_at).toLocaleString()}
            </div>
            ${trip.updated_at !== trip.created_at ? `
            <div class="info-item">
              <span class="info-label">Last Updated:</span><br>
              ${new Date(trip.updated_at).toLocaleString()}
            </div>
            ` : ''}
          </div>
        </div>
      </div>

      <div style="margin-top: 60px; border-top: 1px solid #ddd; padding-top: 20px;">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px;">
          <div>
            <p style="margin: 0;"><strong>Authorized By:</strong></p>
            <div style="margin-top: 40px; border-top: 1px solid #333; padding-top: 5px;">
              Signature & Date
            </div>
          </div>
          <div>
            <p style="margin: 0;"><strong>Acknowledged By (Driver):</strong></p>
            <div style="margin-top: 40px; border-top: 1px solid #333; padding-top: 5px;">
              Signature & Date
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
        Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };
};
