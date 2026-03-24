import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { uploadFields } from '../middleware/upload.js';
import { uploadDocument, getPlotDocuments, downloadDocument } from '../controllers/documentController.js';

const router = express.Router();

// Service provider uploads a document
router.post('/:plotId/upload', protect, authorize('service_provider', 'admin'), uploadFields, uploadDocument);

// View all documents for a plot (purchaser/SP can see)
router.get('/:plotId', protect, getPlotDocuments);

// Download/view specific document
router.get('/:documentId/download', protect, downloadDocument);

export default router;
