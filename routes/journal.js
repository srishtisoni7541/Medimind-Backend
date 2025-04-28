import express from 'express';
import { 
  createEntry, 
  getEntries, 
  getEntry, 
  updateEntry, 
  deleteEntry 
} from '../controllers/journalController.js';
import auth from '../middlewares/authUser.js';

const router = express.Router();

router.use(auth); // All journal routes require authentication

router.post('/', createEntry);
router.get('/', getEntries);
router.get('/:id', getEntry);
router.put('/:id', updateEntry);
router.delete('/:id', deleteEntry);

export default router