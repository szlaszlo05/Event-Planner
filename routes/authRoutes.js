import express from 'express';
import { registerUser, loginUser } from '../authService.js';

const router = new express.Router();

// ------------------------------------------- GET PAGES ------------------------------------------- //

// show login/register form
router.get('/login', (req, res) => {
  // if already logged in, redirect to home page
  if (req.session.user) {
    return res.redirect('/');
  }

  const { message, status } = req.query;
  return res.render('auth-form', {
    title: 'Login / Register',
    message,
    status,
  });
});

// logout logic (end session)
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    return res.redirect('/?message=Logged+out+successfully&status=success');
  });
});

// ------------------------------------------- POST ACTIONS ------------------------------------------- //

// handle registration
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.redirect('/auth/login?message=All+fields+are+required&status=error');
  }

  try {
    const result = await registerUser(username, password);

    const statusType = result.success ? 'success' : 'error';
    // redirect to login page with result message
    return res.redirect(`/auth/login?message=${encodeURIComponent(result.message)}&status=${statusType}`);
  } catch (error) {
    console.error(error);
    return res.redirect('/auth/login?message=Server+Error&status=error');
  }
});

// handle login
router.post('/login', async (req, res) => {
  const userSession = req.session;

  const { username, password } = req.body;

  if (!username || !password) {
    return res.redirect('/auth/login?message=Missing+credentials&status=error');
  }

  try {
    const result = await loginUser(username, password);

    if (result.success) {
      userSession.user = result.user;

      // wait for session to save and then redirect
      userSession.save(() => {
        return res.redirect('/?message=Welcome+back!&status=success');
      });
    } else {
      return res.redirect(`/auth/login?message=${encodeURIComponent(result.message)}&status=error`);
    }
  } catch (error) {
    console.error(error);
    return res.redirect('/auth/login?message=Server+Error&status=error');
  }
  return 0; // dummy return
});

export const authRouter = router;
