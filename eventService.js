import sql from 'mssql';
import { getPool } from './dbConnect.js';
import fs from 'fs/promises';

const pool = getPool();

export async function addEvent(uid, eventData, creatorUsername) {
  try {
    const poolConnection = await pool;

    const transaction = new sql.Transaction(poolConnection);
    await transaction.begin();

    try {
      const request = new sql.Request(transaction);

      await request
        .input('EventID', sql.UniqueIdentifier, uid)
        .input('Name', sql.NVarChar, eventData.name)
        .input('Location', sql.NVarChar, eventData.location)
        .input('StartTime', sql.DateTime, eventData.startTime)
        .input('EndTime', sql.DateTime, eventData.endTime).query(`
        INSERT INTO Events (EventID, Name, Location, StartTime, EndTime)
        VALUES (@EventID, @Name, @Location, @StartTime, @EndTime)
      `);

      // add user to organizers, organizes if necessary

      const checkOrgRequest = new sql.Request(transaction);
      checkOrgRequest.input('UserName', sql.NVarChar, creatorUsername);

      const checkResult = await checkOrgRequest.query(`SELECT 1 FROM Organizers WHERE UserName = @UserName`);

      if (checkResult.recordset.length === 0) {
        // also use username as 'Name' by default
        await checkOrgRequest.query(`
            INSERT INTO Organizers (UserName, Name) VALUES (@UserName, @UserName)
        `);
      }

      // insert link into 'organizes' table
      const linkRequest = new sql.Request(transaction);
      await linkRequest.input('OID', sql.NVarChar, creatorUsername).input('EID', sql.UniqueIdentifier, uid).query(`
        INSERT INTO Organizes (OID, EID)
        VALUES (@OID, @EID)
      `);

      await transaction.commit();

      return { success: true, message: 'Event created successfully!' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error adding event:', error);
    throw error;
  }
}

export async function getEventDetails(eventID) {
  const poolConnection = await pool;

  const eventResult = await poolConnection
    .request()
    .input('EventID', sql.UniqueIdentifier, eventID)
    .query(`SELECT EventID, Name, Location, StartTime, EndTime FROM Events WHERE EventID = @EventID`);

  if (eventResult.recordset.length === 0) {
    return null; // couldn't find the event
  }

  const event = eventResult.recordset[0];

  const organizerResult = await poolConnection
    .request()
    .input('EventID', sql.UniqueIdentifier, eventID)
    .query(`SELECT O.UserName, O.Name FROM Organizers O JOIN Organizes J ON O.Username = J.OID WHERE J.EID = @EventID`);

  if (organizerResult.recordset.length === 0) {
    console.log(`No organizers found for event ${eventID}`);
  }

  event.organizers = organizerResult.recordset;

  const pictureResult = await poolConnection
    .request()
    .input('EventID', sql.UniqueIdentifier, eventID)
    .query(
      `SELECT PictureID, OriginalName, UploadedBy, UploadDate FROM Pictures WHERE EID = @EventID ORDER BY UploadDate DESC`,
    );

  // event.pictures = pictureResult.recordset;

  const dir = 'uploads/';
  let files = [];
  try {
    files = await fs.readdir(dir);
  } catch (err) {
    console.error('Could not read uploads directory: ', err);
  }

  event.pictures = pictureResult.recordset.map((pic) => {
    const filename = files.find((file) => file.includes(pic.PictureID.toLowerCase()));
    return {
      ...pic,
      ServerFileName: filename || 'default.jpg',
    };
  });

  return event;
}
