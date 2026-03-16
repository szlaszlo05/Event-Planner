USE EventPlanner;
GO

CREATE LOGIN EventAppUser WITH PASSWORD = 'StrongPassword123!';
GO

CREATE USER EventAppUser FOR LOGIN EventAppUser;
GO

ALTER ROLE db_datareader ADD MEMBER EventAppUser;
ALTER ROLE db_datawriter ADD MEMBER EventAppUser;
GO
