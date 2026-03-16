// IMPORTANT: Read the README.MD file before using this
import express from 'express';
import session from 'express-session';
import { engine } from 'express-handlebars';
import { viewRouter } from './routes/viewRoutes.js';
import { apiRouter } from './routes/apiRoutes.js';
import { authRouter } from './routes/authRoutes.js';
import fs from 'fs/promises';

// ------------------------------------------- CONSTANTS ------------------------------------------- //

const app = express();
const uploadDir = 'uploads/';

// ------------------------------------------- INITIALIZATION ------------------------------------------- //

// ensure directory exists
try {
  await fs.access(uploadDir);
} catch (error) {
  console.log(`Error: ${error.message}\nMaking new file.`);
  await fs.mkdir(uploadDir);
}

// hbs setup
app.engine('hbs', engine({ extname: '.hbs', defaultLayout: 'main' }));
app.set('view engine', 'hbs');
app.set('views', './views');

// middleware setup
app.use(express.static('public'));
app.use('/pictures', express.static(uploadDir));
app.use(express.urlencoded({ extended: true }));

// session setup

app.use(
  session({
    secret: 'secret-key-event-planner',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  }),
);

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// ------------------------------------------- ROUTES ------------------------------------------- //

// mount modular routes
app.use('/', viewRouter);
app.use('/api', apiRouter);
app.use('/auth', authRouter);

// ------------------------------------------- BASE LISTENER ------------------------------------------- //

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
