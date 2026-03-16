import express from 'express';
import { getAllEvents, getEventsByOrganizer } from '../organizerService.js';
import { getEventDetails } from '../eventService.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = new express.Router();

// ------------------------------------------- GET HOMEPAGE ------------------------------------------- //

router.get('/', async (req, res) => {
  console.log('Request received (Get homepage/event list)');
  const { message, status } = req.query;
  try {
    const events = await getAllEvents();
    return res.render('event-list', {
      events,
      title: 'Event Listing',
      isEmpty: events.length === 0,
      message,
      status,
    });
  } catch (error) {
    console.error(`Error while trying to fetch all events: ${error.message}`);
    return res.status(500).render('error', { title: 'Server Error', message: 'Internal server error' });
  }
});

// ------------------------------------------- GET ADMIN PAGE ------------------------------------------- //

router.get('/admin/create', isAuthenticated, (req, res) => {
  console.log('Request received (Get Admin Create Event Form).');
  const { message, status } = req.query;
  return res.render('admin-form', { title: 'Create New Event ', message, status });
});

// ------------------------------------------- GET EVENT DETAIL PAGE ------------------------------------------- //

router.get('/events/:eventID', async (req, res) => {
  const eventID = req.params.eventID;
  const { message, status } = req.query;
  const currentUser = req.session.user;

  try {
    const event = await getEventDetails(eventID);

    if (!event) {
      return res.status(404).render('error', { title: '404 Not found', message: `Event [${eventID}] not found` });
    }

    let isJoined = false;

    if (currentUser && event.organizers) {
      isJoined = event.organizers.some((o) => o.UserName === currentUser.username || o.Name === currentUser.username);
    }

    if (currentUser && event.pictures) {
      event.pictures.forEach((pic) => {
        pic.canDelete = pic.UploadedBy === currentUser.username;
      });
    }

    return res.status(200).render('event-details', {
      title: event.Name,
      event,
      user: currentUser,
      isJoined,
      hasPictures: event.pictures.length > 0,
      message,
      status,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).render('error', { title: 'Server error', message: 'Internal server error' });
  }
});

// ------------------------------------------- GET MY-EVENTS PAGE ------------------------------------------- //

router.get('/my-events', isAuthenticated, async (req, res) => {
  const currentUser = req.session.user;
  const { message, status } = req.query;

  try {
    const events = await getEventsByOrganizer(currentUser.username);

    return res.render('event-list', {
      events,
      title: 'My Organized Events',
      isEmpty: events.length === 0,
      message,
      status,
      user: currentUser,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).render('error', { title: 'Server Error', message: 'Could not fetch your events.' });
  }
});

export const viewRouter = router;
