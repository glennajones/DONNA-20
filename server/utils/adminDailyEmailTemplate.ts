export default function adminDailyEmailTemplate(
  courtEvents: any[], 
  personalEvents: any[], 
  scheduleEvents: any[]
): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDateStr = tomorrow.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Format court events from Events system
  const courtRows = courtEvents.map(event => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; font-weight: 500;">${event.name}</td>
      <td style="padding: 12px;">${event.time || 'All Day'}</td>
      <td style="padding: 12px;">${event.location || 'TBD'}</td>
      <td style="padding: 12px;">
        <span style="background-color: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
          ${event.eventType}
        </span>
      </td>
    </tr>
  `).join('');

  // Format schedule events from Training & Scheduling system
  const scheduleRows = scheduleEvents.map(event => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; font-weight: 500;">${event.title}</td>
      <td style="padding: 12px;">${event.time}</td>
      <td style="padding: 12px;">${event.court}</td>
      <td style="padding: 12px;">
        <span style="background-color: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
          ${event.eventType}
        </span>
      </td>
    </tr>
  `).join('');

  // Format personal events
  const personalRows = personalEvents.map(event => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; font-weight: 500;">${event.name}</td>
      <td style="padding: 12px;">${event.time || 'All Day'}</td>
      <td style="padding: 12px;">${event.location || 'Personal'}</td>
      <td style="padding: 12px;">
        <span style="background-color: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
          Personal
        </span>
      </td>
    </tr>
  `).join('');

  const totalEvents = courtEvents.length + scheduleEvents.length + personalEvents.length;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Daily Schedule - ${tomorrowDateStr}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb;">
      <div style="max-width: 800px; margin: 0 auto; background-color: white; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">📅 Daily Schedule</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">${tomorrowDateStr}</p>
        </div>

        <!-- Summary -->
        <div style="padding: 20px; background-color: #f8fafc; border-bottom: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 16px; color: #64748b;">
            <strong>${totalEvents} event${totalEvents !== 1 ? 's' : ''}</strong> scheduled for tomorrow
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          
          ${(courtEvents.length > 0 || scheduleEvents.length > 0) ? `
          <div style="margin-bottom: 40px;">
            <h2 style="color: #1e293b; font-size: 22px; margin-bottom: 20px; border-bottom: 3px solid #3b82f6; padding-bottom: 8px;">
              🏐 Court Activities
            </h2>
            <table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <thead>
                <tr style="background-color: #f1f5f9;">
                  <th style="padding: 15px; text-align: left; font-weight: 600; color: #475569;">Event</th>
                  <th style="padding: 15px; text-align: left; font-weight: 600; color: #475569;">Time</th>
                  <th style="padding: 15px; text-align: left; font-weight: 600; color: #475569;">Location</th>
                  <th style="padding: 15px; text-align: left; font-weight: 600; color: #475569;">Type</th>
                </tr>
              </thead>
              <tbody>
                ${courtRows}
                ${scheduleRows}
                ${(courtEvents.length === 0 && scheduleEvents.length === 0) ? `
                <tr>
                  <td colspan="4" style="padding: 30px; text-align: center; color: #64748b; font-style: italic;">
                    No court activities scheduled
                  </td>
                </tr>
                ` : ''}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${personalEvents.length > 0 ? `
          <div style="margin-bottom: 40px;">
            <h2 style="color: #1e293b; font-size: 22px; margin-bottom: 20px; border-bottom: 3px solid #f59e0b; padding-bottom: 8px;">
              📝 Personal Events
            </h2>
            <table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <thead>
                <tr style="background-color: #fefbf3;">
                  <th style="padding: 15px; text-align: left; font-weight: 600; color: #475569;">Event</th>
                  <th style="padding: 15px; text-align: left; font-weight: 600; color: #475569;">Time</th>
                  <th style="padding: 15px; text-align: left; font-weight: 600; color: #475569;">Location</th>
                  <th style="padding: 15px; text-align: left; font-weight: 600; color: #475569;">Type</th>
                </tr>
              </thead>
              <tbody>
                ${personalRows}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${totalEvents === 0 ? `
          <div style="text-align: center; padding: 40px; color: #64748b;">
            <div style="font-size: 48px; margin-bottom: 20px;">🎉</div>
            <h3 style="color: #475569; margin-bottom: 10px;">No Events Scheduled</h3>
            <p style="margin: 0;">Enjoy your free day tomorrow!</p>
          </div>
          ` : ''}

        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="margin: 0; color: #64748b; font-size: 14px;">
            This is an automated daily schedule from VolleyClub Pro
          </p>
          <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 12px;">
            Generated on ${new Date().toLocaleString()}
          </p>
        </div>

      </div>
    </body>
    </html>
  `;
}