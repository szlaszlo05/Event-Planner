import sql from 'mssql';
import { getPool } from './dbConnect.js';
import fs from 'fs/promises';
import path from 'path';

const pool = getPool();

export async function uploadPicture(eventID, organizerName, fileHandler) {
  const poolConnection = await pool;
  const [pictureID] = fileHandler.filename.split('.');

  try {
    const eventCheck = await poolConnection
      .request()
      .input('EventID', sql.UniqueIdentifier, eventID)
      .query(`SELECT Name FROM Events WHERE EventID = @EventID`);

    if (eventCheck.recordset.length === 0) {
      return { status: 404, message: `Event with eventID ${eventID} not found.` };
    }

    const eventName = eventCheck.recordset[0].Name;

    const organizerCheck = await poolConnection
      .request()
      .input('UserName', sql.NVarChar, organizerName)
      .input('EventID', sql.UniqueIdentifier, eventID)
      .query(`SELECT 1 FROM Organizes WHERE EID = @EventID AND OID = @UserName`);

    if (organizerCheck.recordset.length === 0) {
      return { status: 403, message: `Upload failed: User ${organizerName} is not part of event ${eventName}` };
    }

    await poolConnection
      .request()
      .input('PictureID', sql.UniqueIdentifier, pictureID)
      .input('EventID', sql.UniqueIdentifier, eventID)
      .input('OriginalName', sql.NVarChar, fileHandler.originalname)
      .input('ServerFileName', sql.NVarChar, fileHandler.filename)
      .input('UploadedBy', sql.NVarChar, organizerName)
      .input('UploadDate', sql.DateTime2, new Date().toISOString())
      .query(
        `INSERT INTO Pictures (PictureID, EID, OriginalName, UploadedBy, UploadDate) 
         VALUES (@PictureID, @EventID, @OriginalName, @UploadedBy, @UploadDate)`,
      );

    console.log(`Picture uploaded for event ${eventName} by ${organizerName} with PictureID ${pictureID}`);

    return {
      status: 200,
      message: `Picture uploaded for event ${eventName} by ${organizerName} with PictureID ${pictureID}`,
      storageID: pictureID,
      originalName: fileHandler.originalname,
    };
  } catch (error) {
    console.log(`Database error while trying to upload picture to event ${eventID} : ${error.message}`);
    return { status: 500, message: `Internal server error.` };
  }
}

export async function deletePicture(pictureID, requesterUsername) {
  try {
    const pool1 = await getPool();

    const request = pool1.request();
    request.input('PictureID', sql.UniqueIdentifier, pictureID);
    const result = await request.query('SELECT * FROM Pictures WHERE PictureID = @PictureID');

    if (result.recordset.length === 0) {
      return { status: 404, message: 'Picture not found.' };
    }

    const picture = result.recordset[0];

    if (picture.UploadedBy !== requesterUsername) {
      return { status: 403, message: 'Unauthorized: You can only delete your own pictures.' };
    }

    // delete from fs
    const filePath = path.join('uploads', picture.ServerFileName);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.warn(`Could not delete file ${filePath}: ${err.message}`);
    }

    // delete from db
    const deleteRequest = pool1.request();
    deleteRequest.input('PictureID', sql.UniqueIdentifier, pictureID);
    await deleteRequest.query('DELETE FROM Pictures WHERE PictureID = @PictureID');

    return { status: 200, message: 'Picture deleted successfully.' };
  } catch (error) {
    console.error('Error deleting picture:', error);
    throw error;
  }
}
