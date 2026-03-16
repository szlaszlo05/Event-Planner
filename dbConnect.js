import sql from 'mssql';

const config = {
  user: 'EventAppUser',
  password: 'StrongPassword123!',
  server: '[Server Name]',
  database: 'EventPlanner',
  options: {
    trustServerCertificate: true,
  },
};

const connectionPool = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log('Successfully connected to server.');
    return pool;
  })
  .catch((err) => {
    console.error('Database connection failed', err);
    process.exit(1);
  });

export const getPool = () => connectionPool;
