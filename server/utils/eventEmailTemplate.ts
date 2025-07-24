export default function buildEventTemplate(event: any): string {
  return `
  <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #56A0D3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .event-details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .detail-row { margin: 8px 0; }
        .label { font-weight: bold; color: #56A0D3; }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>📅 ${event.name}</h2>
        <p>VolleyClub Pro Event Notification</p>
      </div>
      
      <div class="content">
        ${event.description ? `<p>${event.description}</p>` : ''}
        
        <div class="event-details">
          <div class="detail-row">
            <span class="label">📅 Date:</span> ${new Date(event.startDate).toLocaleDateString()}
          </div>
          
          ${event.startTime ? `
          <div class="detail-row">
            <span class="label">🕐 Time:</span> ${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''}
          </div>
          ` : ''}
          
          <div class="detail-row">
            <span class="label">📍 Location:</span> ${event.location || 'TBD'}
          </div>
          
          ${event.eventType ? `
          <div class="detail-row">
            <span class="label">🏐 Type:</span> ${event.eventType}
          </div>
          ` : ''}
          
          ${event.assignedCourts && event.assignedCourts.length > 0 ? `
          <div class="detail-row">
            <span class="label">🏟️ Courts:</span> ${event.assignedCourts.join(', ')}
          </div>
          ` : ''}
          
          ${event.registrationFee && parseFloat(event.registrationFee) > 0 ? `
          <div class="detail-row">
            <span class="label">💰 Registration Fee:</span> $${event.registrationFee}
          </div>
          ` : ''}
        </div>
        
        <p>We look forward to seeing you there! 💪</p>
        
        ${event.registrationFee && parseFloat(event.registrationFee) > 0 ? `
        <p><strong>Please ensure your registration fee is paid before the event.</strong></p>
        ` : ''}
      </div>
      
      <div class="footer">
        <p>VolleyClub Pro - Your Volleyball Community</p>
        <p>This is an automated notification. Please contact your club administrator for questions.</p>
      </div>
    </body>
  </html>
  `;
}