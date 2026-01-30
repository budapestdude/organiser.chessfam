import express from 'express';
import * as emailTemplatesController from '../controllers/emailTemplatesController';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

// Get all email templates
router.get('/', emailTemplatesController.getAllEmailTemplates);

// Get template categories
router.get('/categories', emailTemplatesController.getEmailTemplateCategories);

// Get single template
router.get('/:id', emailTemplatesController.getEmailTemplateById);

// Create new template
router.post('/', emailTemplatesController.createEmailTemplate);

// Update template
router.put('/:id', emailTemplatesController.updateEmailTemplate);

// Delete template
router.delete('/:id', emailTemplatesController.deleteEmailTemplate);

// Duplicate template
router.post('/:id/duplicate', emailTemplatesController.duplicateEmailTemplate);

// Preview template with sample variables
router.post('/:id/preview', emailTemplatesController.previewEmailTemplate);

// Send test email
router.post('/:id/test', emailTemplatesController.sendTestEmail);

export default router;
