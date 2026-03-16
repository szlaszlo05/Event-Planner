import sql from 'mssql';
import { getPool } from './dbConnect.js';

const pool = getPool();

async function getEventOrganizerStatus(poolConnection, eventID, organizerName) {
  const eventCheck = await poolConnection
    .request()
    .input('eventID', sql.UniqueIdentifier, eventID)
    .query(`SELECT Name FROM Events WHERE eventID = @eventID;`);

  if (eventCheck.recordset.length === 0) {
    console.error(`Invalid event ID: ${eventID}.`);
    return { status: 404, message: `EventID ${eventID} not found.` };
  }

  const organizerCheck = await poolConnection
    .request()
    .input('OrganizerName', sql.NVarChar, organizerName)
    .query('SELECT 1 FROM Organizers WHERE UserName = @OrganizerName');

  if (organizerCheck.recordset.length === 0) {
    await poolConnection
      .request()
      .input('UserName', sql.NVarChar, organizerName)
      .input('Name', sql.NVarChar, organizerName)
      .query(`INSERT INTO Organizers (UserName, Name) VALUES (@UserName, @Name)`);

    console.log(`Created new user ${organizerName}`);
  }

  const organizerJoinedCheck = await poolConnection
    .request()
    .input('UserName', sql.NVarChar, organizerName)
    .input('eventID', sql.UniqueIdentifier, eventID)
    .query(`SELECT 1 FROM Organizes WHERE EID = @eventID AND OID = @UserName`);

  const isJoined = organizerJoinedCheck.recordset.length > 0;

  return { isJoined };
}

export async function handleJoinLeave(eventID, organizerName, action) {
  const poolConnection = await pool;

  const statusResult = await getEventOrganizerStatus(poolConnection, eventID, organizerName);

  if (statusResult.error) {
    console.log(`Error in OrganizerEventStatus: ${statusResult.error.message}`);
    return statusResult.error;
  }

  const { isJoined } = statusResult;

  try {
    let status = 200;
    let message = '';

    if (action === 'join') {
      // belépni próbál
      if (isJoined) {
        // már benne van
        status = 409; // conflict
        message = `Organizer ${organizerName} has already joined event ${eventID}`;
      } else {
        // insertelem a kapcsolatot
        await poolConnection
          .request()
          .input('EventID', sql.UniqueIdentifier, eventID)
          .input('UserName', sql.NVarChar, organizerName)
          .query(`INSERT INTO Organizes (EID, OID) VALUES (@EventID, @UserName)`);
        message = `Organizer ${organizerName} successfully added to event ${eventID}.`;
      }
    } else if (action === 'leave') {
      // kilépni próbál
      if (!isJoined) {
        status = 409; // conflict
        message = `Organizer ${organizerName} is not yet part of event ${eventID}`;
      } else {
        await poolConnection
          .request()
          .input('EventID', sql.UniqueIdentifier, eventID)
          .input('UserName', sql.NVarChar, organizerName)
          .query(`DELETE FROM Organizes WHERE EID = @EventID AND OID = @UserName`);
        message = `Organizer ${organizerName} successfully removed from event ${eventID}`;
      }
    }

    return { status, message };
  } catch (error) {
    console.log(`Database error while handling Join/Leave: ${error.message}`);
    return { status: 500, message: 'Internal server error.' };
  }
}

export async function getAllEvents() {
  const poolConnection = await pool;

  const result = await poolConnection
    .request()
    .query(`SELECT EventID, Name, Location, StartTime, EndTime FROM Events ORDER BY StartTime DESC`);

  return result.recordset;
}

export async function getAllOrganizers() {
  const poolConnection = await pool;

  const result = await poolConnection.request().query(`SELECT UserName, Name FROM Organizers ORDER BY UserName ASC`);

  return result.recordset;
}

export async function getEventsByOrganizer(username) {
  try {
    const connPool = await getPool();
    const request = connPool.request();
    request.input('Username', sql.NVarChar, username);

    // select events that this person organizes
    const query = `
      SELECT E.* FROM Events E 
      JOIN Organizes O ON E.EventID = O.EID 
      WHERE O.OID = @Username
    `;

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error('getEventsByOrganizer error:', error);
    throw error;
  }
}
