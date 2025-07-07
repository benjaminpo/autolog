// Debug utility for MongoDB connection issues
import mongoose from 'mongoose';
import config from '../config';

export async function debugMongoConnection(uri: string): Promise<void> {
  console.log('=== MongoDB Debug Information ===');
  console.log(`Environment: ${config.env}`);
  console.log(`Database Name: ${config.database.name}`);

  // Sanitize URI to hide credentials
  const sanitizedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
  console.log(`Connection String: ${sanitizedUri}`);

  try {
    // Try parsing the URI
    const parsedUri = new URL(uri);
    console.log('URI Structure Valid: Yes');
    console.log(`Protocol: ${parsedUri.protocol}`);
    console.log(`Host: ${parsedUri.host}`);
    console.log(`Path: ${parsedUri.pathname}`);
    console.log(`Query Parameters: ${parsedUri.search}`);

    // Check if pathname contains a database name
    const pathParts = parsedUri.pathname.split('/').filter(Boolean);
    console.log(`Path Parts: ${pathParts.length > 0 ? pathParts.join(', ') : 'None'}`);

    if (pathParts.length > 0) {
      console.log(`Detected Database Name in URI: ${pathParts[0]}`);
      if (pathParts[0] !== config.database.name) {
        console.log(`WARNING: Database name in URI (${pathParts[0]}) doesn't match configured database name (${config.database.name})`);
      }
    } else {
      console.log('Warning: No database name detected in URI pathname');
    }
  } catch (error) {
    console.log('URI Structure Valid: No');
    console.error('Error parsing URI:', error);
  }

  console.log('Mongoose Version:', mongoose.version);
  console.log('Current Connection State:',
    mongoose.connection.readyState === 0 ? 'Disconnected' :
    mongoose.connection.readyState === 1 ? 'Connected' :
    mongoose.connection.readyState === 2 ? 'Connecting' :
    mongoose.connection.readyState === 3 ? 'Disconnecting' : 'Unknown'
  );

  // Check models
  console.log('Registered Mongoose Models:', Object.keys(mongoose.models).join(', ') || 'None');

  if (mongoose.connection.readyState === 1) {
    try {
      // Check collections
      if (mongoose.connection.db !== undefined) {
        const collections = await mongoose.connection.db.collections();
        console.log('Available Collections:', collections.map(c => c.collectionName).join(', ') || 'None');
      }
    } catch (error) {
      console.error('Error accessing database information:', error);
    }
  }

  console.log('=== End Debug Information ===');
}

export default debugMongoConnection;
