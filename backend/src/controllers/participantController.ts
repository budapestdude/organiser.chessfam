import { Request, Response } from 'express';
import pool from '../config/database';

// Get tournament participants with pagination and filters
export const getParticipants = async (req: Request, res: Response) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM tournament_registrations WHERE tournament_id = $1',
      [tournamentId]
    );
    const totalCount = parseInt(countResult.rows[0].count);

    // Get participants with user details
    const result = await pool.query(
      `SELECT
        tr.id,
        tr.user_id,
        tr.tournament_id,
        tr.status,
        tr.payment_status,
        tr.payment_amount,
        tr.discount_applied,
        tr.registered_at,
        tr.approved_at,
        u.name,
        u.email,
        u.rating,
        u.country
      FROM tournament_registrations tr
      JOIN users u ON tr.user_id = u.id
      WHERE tr.tournament_id = $1
      ORDER BY tr.registered_at DESC
      LIMIT $2 OFFSET $3`,
      [tournamentId, limit, offset]
    );

    res.json({
      success: true,
      participants: result.rows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch participants' });
  }
};

// Bulk participant actions
export const bulkParticipantAction = async (req: Request, res: Response) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const { action, participant_ids, email_subject, email_body } = req.body;

    if (!participant_ids || participant_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No participants selected' });
    }

    switch (action) {
      case 'approve':
        await pool.query(
          `UPDATE tournament_registrations
           SET status = 'approved', approved_at = NOW()
           WHERE id = ANY($1) AND tournament_id = $2`,
          [participant_ids, tournamentId]
        );
        break;

      case 'reject':
        await pool.query(
          `UPDATE tournament_registrations
           SET status = 'rejected'
           WHERE id = ANY($1) AND tournament_id = $2`,
          [participant_ids, tournamentId]
        );
        break;

      case 'refund':
        // Update payment status to refunded
        await pool.query(
          `UPDATE tournament_registrations
           SET payment_status = 'refunded'
           WHERE id = ANY($1) AND tournament_id = $2 AND payment_status = 'paid'`,
          [participant_ids, tournamentId]
        );

        // Create refund records in payments table
        await pool.query(
          `INSERT INTO payments (user_id, tournament_id, amount, type, status, created_at)
           SELECT user_id, tournament_id, -payment_amount, 'refund', 'completed', NOW()
           FROM tournament_registrations
           WHERE id = ANY($1) AND tournament_id = $2`,
          [participant_ids, tournamentId]
        );
        break;

      case 'email':
        if (!email_subject || !email_body) {
          return res.status(400).json({ success: false, message: 'Email subject and body required' });
        }

        // Get participant emails
        const emailResult = await pool.query(
          `SELECT u.email, u.name, t.name as tournament_name
           FROM tournament_registrations tr
           JOIN users u ON tr.user_id = u.id
           JOIN tournaments t ON tr.tournament_id = t.id
           WHERE tr.id = ANY($1) AND tr.tournament_id = $2`,
          [participant_ids, tournamentId]
        );

        // In a real implementation, you would integrate with an email service (SendGrid, AWS SES, etc.)
        // For now, we'll just log the emails that would be sent
        console.log('Bulk email would be sent to:', emailResult.rows.length, 'participants');
        console.log('Subject:', email_subject);

        // TODO: Integrate with email service
        // Example with SendGrid:
        // const emails = emailResult.rows.map(row => ({
        //   to: row.email,
        //   subject: email_subject.replace('{{name}}', row.name).replace('{{event_name}}', row.tournament_name),
        //   html: email_body.replace('{{name}}', row.name).replace('{{event_name}}', row.tournament_name).replace('{{email}}', row.email)
        // }));
        // await sendBulkEmails(emails);

        break;

      default:
        return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    res.json({
      success: true,
      message: `Successfully ${action}ed ${participant_ids.length} participant(s)`,
      count: participant_ids.length,
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    res.status(500).json({ success: false, message: 'Failed to perform bulk action' });
  }
};

// Export participants to CSV
export const exportParticipants = async (req: Request, res: Response) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const format = req.query.format || 'csv';

    // Get all participants
    const result = await pool.query(
      `SELECT
        u.name,
        u.email,
        u.rating,
        u.country,
        tr.status,
        tr.payment_status,
        tr.payment_amount,
        tr.discount_applied,
        tr.registered_at
      FROM tournament_registrations tr
      JOIN users u ON tr.user_id = u.id
      WHERE tr.tournament_id = $1
      ORDER BY tr.registered_at DESC`,
      [tournamentId]
    );

    if (format === 'csv') {
      // Generate CSV
      const headers = ['Name', 'Email', 'Rating', 'Country', 'Status', 'Payment Status', 'Amount', 'Discount', 'Registered'];
      const rows = result.rows.map(row => [
        row.name,
        row.email,
        row.rating || 'Unrated',
        row.country || '',
        row.status,
        row.payment_status,
        (row.payment_amount / 100).toFixed(2),
        row.discount_applied || 'None',
        new Date(row.registered_at).toLocaleDateString(),
      ]);

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=tournament-${tournamentId}-participants.csv`);
      res.send(csv);
    } else {
      // For Excel format, you would use a library like exceljs
      // For now, just return CSV
      res.status(400).json({ success: false, message: 'Excel export not yet implemented' });
    }
  } catch (error) {
    console.error('Error exporting participants:', error);
    res.status(500).json({ success: false, message: 'Failed to export participants' });
  }
};
