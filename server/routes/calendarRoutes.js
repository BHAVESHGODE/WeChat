const express = require('express');
const router = express.Router();
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

let oauth2Client = null;

function getClient() {
  if (!oauth2Client) {
    oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }
  return oauth2Client;
}

router.get('/auth', (req, res) => {
  const client = getClient();
  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: req.query.userId || '',
  });
  res.redirect(url);
});

router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  try {
    const client = getClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    if (state) {
      const Task = require('../models/Task');
      const tasks = await Task.find({ userId: state, status: 'pending', googleEventId: null });
      const calendar = google.calendar({ version: 'v3', auth: client });
      for (const task of tasks) {
        if (task.deadline) {
          const event = {
            summary: task.title,
            description: task.description || '',
            start: { dateTime: new Date(task.deadline).toISOString(), timeZone: 'UTC' },
            end: { dateTime: new Date(new Date(task.deadline).getTime() + 3600000).toISOString(), timeZone: 'UTC' },
          };
          try {
            const created = await calendar.events.insert({ calendarId: 'primary', resource: event });
            task.googleEventId = created.data.id;
            await task.save();
          } catch (e) { console.error('Calendar insert error:', e.message); }
        }
      }
    }
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/study-room?user=${state || ''}`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sync', async (req, res) => {
  const { userId, title, description, deadline } = req.body;
  const client = getClient();
  try {
    const calendar = google.calendar({ version: 'v3', auth: client });
    const event = {
      summary: title,
      description: description || '',
      start: { dateTime: new Date(deadline).toISOString(), timeZone: 'UTC' },
      end: { dateTime: new Date(new Date(deadline).getTime() + 3600000).toISOString(), timeZone: 'UTC' },
    };
    const created = await calendar.events.insert({ calendarId: 'primary', resource: event });
    res.json({ googleEventId: created.data.id, htmlLink: created.data.htmlLink });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
