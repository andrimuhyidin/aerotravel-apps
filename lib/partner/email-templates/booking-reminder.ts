/**
 * Email Templates for Booking Reminders
 * Used by booking reminder cron job
 */

export function generateBookingReminderEmail(data: {
  bookingCode: string;
  tripDate: string;
  packageName: string;
  adultPax: number;
  childPax: number;
  infantPax: number;
  reminderType: 'H-7' | 'H-3' | 'H-1';
  bookingUrl: string;
}): { subject: string; html: string } {
  const { bookingCode, tripDate, packageName, adultPax, childPax, infantPax, reminderType, bookingUrl } = data;
  
  const daysText = reminderType === 'H-7' ? '7 hari' : reminderType === 'H-3' ? '3 hari' : '1 hari';
  const totalPax = adultPax + childPax + infantPax;
  
  const subject = `Reminder Booking ${reminderType}: ${bookingCode} - ${packageName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Reminder Booking ${reminderType}</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">
          Halo Mitra Aero Travel,
        </p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          Ini adalah reminder bahwa booking Anda akan berlangsung dalam <strong>${daysText}</strong>.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h2 style="margin-top: 0; color: #667eea;">Detail Booking</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 40%;">Kode Booking:</td>
              <td style="padding: 8px 0;">${bookingCode}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Paket:</td>
              <td style="padding: 8px 0;">${packageName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Tanggal Trip:</td>
              <td style="padding: 8px 0;">${tripDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Jumlah Peserta:</td>
              <td style="padding: 8px 0;">${totalPax} orang (${adultPax} dewasa, ${childPax} anak, ${infantPax} bayi)</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${bookingUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Lihat Detail Booking
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Jika ada pertanyaan atau perubahan, silakan hubungi tim operasional kami.
        </p>
        
        <p style="font-size: 14px; color: #666; margin-top: 20px;">
          Terima kasih,<br>
          <strong>Tim Aero Travel</strong>
        </p>
      </div>
    </body>
    </html>
  `;
  
  return { subject, html };
}

