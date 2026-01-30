import { Request, Response } from 'express';
import pool from '../config/database';

// Get club members with pagination and filters
export const getMembers = async (req: Request, res: Response) => {
  try {
    const clubId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM club_memberships WHERE club_id = $1',
      [clubId]
    );
    const totalCount = parseInt(countResult.rows[0].count);

    // Get members with user details
    const result = await pool.query(
      `SELECT
        cm.id,
        cm.user_id,
        cm.club_id,
        cm.role,
        cm.joined_at,
        cm.membership_status,
        cm.payment_status,
        u.name,
        u.email,
        u.rating
      FROM club_memberships cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.club_id = $1
      ORDER BY cm.joined_at DESC
      LIMIT $2 OFFSET $3`,
      [clubId, limit, offset]
    );

    res.json({
      success: true,
      members: result.rows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch members' });
  }
};

// Bulk member actions
export const bulkMemberAction = async (req: Request, res: Response) => {
  try {
    const clubId = parseInt(req.params.id);
    const { action, member_ids, new_role, email_subject, email_body } = req.body;

    if (!member_ids || member_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No members selected' });
    }

    switch (action) {
      case 'promote':
        if (!new_role || !['admin', 'coach', 'member'].includes(new_role)) {
          return res.status(400).json({ success: false, message: 'Valid role required' });
        }

        await pool.query(
          `UPDATE club_memberships
           SET role = $1
           WHERE id = ANY($2) AND club_id = $3`,
          [new_role, member_ids, clubId]
        );
        break;

      case 'demote':
        if (!new_role || !['admin', 'coach', 'member'].includes(new_role)) {
          return res.status(400).json({ success: false, message: 'Valid role required' });
        }

        await pool.query(
          `UPDATE club_memberships
           SET role = $1
           WHERE id = ANY($2) AND club_id = $3`,
          [new_role, member_ids, clubId]
        );
        break;

      case 'remove':
        // Soft delete by setting membership_status to inactive
        await pool.query(
          `UPDATE club_memberships
           SET membership_status = 'inactive'
           WHERE id = ANY($1) AND club_id = $2`,
          [member_ids, clubId]
        );
        break;

      case 'email':
        if (!email_subject || !email_body) {
          return res.status(400).json({ success: false, message: 'Email subject and body required' });
        }

        // Get member emails
        const emailResult = await pool.query(
          `SELECT u.email, u.name, c.name as club_name
           FROM club_memberships cm
           JOIN users u ON cm.user_id = u.id
           JOIN clubs c ON cm.club_id = c.id
           WHERE cm.id = ANY($1) AND cm.club_id = $2`,
          [member_ids, clubId]
        );

        // In a real implementation, you would integrate with an email service
        console.log('Bulk email would be sent to:', emailResult.rows.length, 'members');
        console.log('Subject:', email_subject);

        // TODO: Integrate with email service
        // Example with SendGrid:
        // const emails = emailResult.rows.map(row => ({
        //   to: row.email,
        //   subject: email_subject.replace('{{name}}', row.name).replace('{{event_name}}', row.club_name),
        //   html: email_body.replace('{{name}}', row.name).replace('{{event_name}}', row.club_name).replace('{{email}}', row.email)
        // }));
        // await sendBulkEmails(emails);

        break;

      default:
        return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    res.json({
      success: true,
      message: `Successfully ${action}ed ${member_ids.length} member(s)`,
      count: member_ids.length,
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    res.status(500).json({ success: false, message: 'Failed to perform bulk action' });
  }
};

// Export members to CSV
export const exportMembers = async (req: Request, res: Response) => {
  try {
    const clubId = parseInt(req.params.id);
    const format = req.query.format || 'csv';

    // Get all members
    const result = await pool.query(
      `SELECT
        u.name,
        u.email,
        u.rating,
        cm.role,
        cm.membership_status,
        cm.payment_status,
        cm.joined_at
      FROM club_memberships cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.club_id = $1
      ORDER BY cm.joined_at DESC`,
      [clubId]
    );

    if (format === 'csv') {
      // Generate CSV
      const headers = ['Name', 'Email', 'Rating', 'Role', 'Status', 'Payment Status', 'Joined'];
      const rows = result.rows.map(row => [
        row.name,
        row.email,
        row.rating || 'Unrated',
        row.role,
        row.membership_status,
        row.payment_status || 'N/A',
        new Date(row.joined_at).toLocaleDateString(),
      ]);

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=club-${clubId}-members.csv`);
      res.send(csv);
    } else {
      // For Excel format, you would use a library like exceljs
      res.status(400).json({ success: false, message: 'Excel export not yet implemented' });
    }
  } catch (error) {
    console.error('Error exporting members:', error);
    res.status(500).json({ success: false, message: 'Failed to export members' });
  }
};
