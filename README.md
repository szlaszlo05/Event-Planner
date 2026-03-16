# Event Planner

A tool for event hosts and organizers to post and manage their events
Organizers can create events, join other events and upload pictures to them

# Database

The app uses an MSSQL database. Please note that:
    
    - Before the first start, you must run EventPlanner_DB_Create.sql to create the database. TCP/IP Connection is necessary for this project to run.
    - You should check out the DB_User.sql for the database user and run it to create the login for the server
    - Please edit the config object in dbConnect.js so it matches the name of your SQL server and the database user previously created
    - Optionally, run EventPlanner_Data.sql to upload initial data to the database (2 organizers)

# How To Use

Events

    - Events are the main building blocks of this project. 
    - By default, the viewing mode lists all of the available events. It is possible to get more information about them by clicking 'more info', that sends an ajax request; or by expanding it, which takes the user to the page of the event, where every information can be viewed
    - Events can be created by registered users. An event is assigned to the user that created it, but others can also join it as organizers. The organizers of an event can upload pictures which will be visible on the dedicated page of the event. They can also leave the event (but that will not affect the pictures they have uploaded). Pictures can only be deleted by their uploaders.

Users

    - Users can register and log in. They will automatically be considered an organizer, as the platform is made for them.

# Good To Know

    - The port can be changed at line 60 in server.js