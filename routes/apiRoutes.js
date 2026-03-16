import express from 'express';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import fs from 'fs/promises';
import { handleJoinLeave, getAllEvents } from '../organizerService.js';
import { addEvent, getEventDetails } from '../eventService.js';
import { uploadPicture, deletePicture } from '../uploadService.js';
import { isAuthenticated } from '../middleware/auth.js';

// eslint is crying for new-cap because I used capital R in Router outside of constructor
// so I use it with 'new'
const router = new express.Router();
const uploadDir = 'uploads/';

// multer configuration
const fileFilter = (req, file, cb) => {
  if (['image/jpeg', 'image/png', 'image/gif'].includes(file.mimetype)) {
    cb(null, true);
  } else {
    req.fileValidationError = 'File upload failed: Accepted File Types: JPEG, PNG, GIF';
    cb(null, false);
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    cb(null, `${randomUUID()}.${file.originalname.split('.').pop()}`);
  },
});

const upload = multer({ storage, fileFilter });

router.get('/events/info/:eventID', async (req, res) => {
  try {
    const event = await getEventDetails(req.params.eventID);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    return res.status(200).json(event);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ------------------------------------------- ADD EVENT ------------------------------------------- //

router.post('/events', isAuthenticated, async (req, res) => {
  const { name, location, startTime, endTime } = req.body;
  const creatorUsername = req.session.user.username;
  if (!name || !location || !startTime || !endTime) {
    return res.redirect(`/admin/create?message=${encodeURIComponent('Missing fields')}&status=error`);
  }
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  if (isNaN(startDate) || isNaN(endDate) || startDate >= endDate) {
    return res.redirect(`/admin/create?message=${encodeURIComponent('Invalid time period')}&status=error`);
  }
  try {
    const result = await addEvent(
      randomUUID(),
      { name, location, startTime: startDate, endTime: endDate },
      creatorUsername,
    );
    return res.redirect(`/?message=${encodeURIComponent(result.message)}&status=success`);
  } catch (error) {
    console.error(error.message);
    return res.redirect(`/admin/create?message=${encodeURIComponent('Internal server error')}&status=error`);
  }
});

// ------------------------------------------- JOIN/LEAVE REQUEST ------------------------------------------- //

router.post('/events/organizers', isAuthenticated, async (req, res) => {
  const { eventId, action } = req.body;
  const organizerName = req.session.user.username;

  try {
    const result = await handleJoinLeave(eventId, organizerName, action);
    const statusType = result.status >= 400 ? 'error' : 'success';
    return res.redirect(`/events/${eventId}?message=${encodeURIComponent(result.message)}&status=${statusType}`);
  } catch (error) {
    console.error(error.message);
    return res.redirect(`/events/${eventId}?message=${encodeURIComponent('Internal error')}&status=error`);
  }
});

// ------------------------------------------- PICTURE POST ------------------------------------------- //

router.post('/events/pictures', isAuthenticated, upload.single('picture'), async (req, res) => {
  const { eventId } = req.body;
  const organizerName = req.session.user.username;
  const fileHandler = req.file;

  if (req.fileValidationError || !organizerName || !fileHandler) {
    if (fileHandler) await fs.unlink(fileHandler.path);
    const msg = req.fileValidationError || 'Missing inputs for picture upload.';
    return res.redirect(`/events/${eventId}?message=${encodeURIComponent(msg)}&status=error`);
  }

  try {
    const result = await uploadPicture(eventId, organizerName, fileHandler);
    if (result.status >= 400) {
      await fs.unlink(fileHandler.path);
      return res.redirect(`/events/${eventId}?message=${encodeURIComponent(result.message)}&status=error`);
    }
    return res.redirect(`/events/${eventId}?message=${encodeURIComponent(result.message)}&status=success`);
  } catch (error) {
    if (fileHandler) await fs.unlink(fileHandler.path);
    console.error(error.message);
    return res.redirect(`/events/${eventId}?message=${encodeURIComponent('Internal server error')}&status=error`);
  }
});

// ------------------------------------------- API JSON ROUTES ------------------------------------------- //

router.get('/events', async (req, res) => {
  try {
    const events = await getAllEvents();
    return res.status(200).json(events);
  } catch (error) {
    console.error(error.message);
    return res.status(500).send('Internal server error');
  }
});

router.delete('/events/pictures/:pictureID', async (req, res) => {
  try {
    const requesterUsername = req.session.user.username;
    const result = await deletePicture(req.params.pictureID, requesterUsername);
    return res.status(result.status).json({ message: result.message });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export const apiRouter = router;
