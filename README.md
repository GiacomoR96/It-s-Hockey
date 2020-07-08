
# It's Hockey

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

### Introduction:

It's Hockey is a cross-platform web app based on the Air Hockey game.

### Prerequisites:
- Npm
- NodeJs
- Express
- Apache/MySql

### Installation:
- Installation npm:
  ```console
  $ npm install
  ```
- NodeJs installation (recommended v.10.16.3):
  ```console
  https://nodejs.org/it/download/
  ```
- Express framework installation:
  ```console
  $ npm install express 
  ```
	

### Database table structure:
```sql
  CREATE TABLE players (
    nickname varchar(15) NOT NULL,
    password varchar(40) NOT NULL,
    level int(3) NOT NULL DEFAULT '1',
    exp int(6) NOT NULL DEFAULT '0'.
  ) ENGINE=InnoDB DEFAULT CHARSET=latin1;

  ALTER TABLE players
    ADD PRIMARY KEY (nickname);
  COMMIT; 
```

### Execution:
- Start database containing the structure described above
- Command to start the project:
  ```console
  $ node main
   * Running on http://localhost:8080
  ```
- #### NOTE :
	If you want to run the project with public IP, replace localhost:8080 with YOUR_PUBLIC_IP:8080 within the game.js and script.js files

### Technologies used:
- HTML
- CSS
- Javascript
- SQL
- JQuery
- Phaser
- Express
- Node

### Project development

The development of the project was divided into several phases:
- In the initial phase, the necessary endpoints were set up so that the front-end could communicate correctly with the back-end, thus allowing users' data to be saved in a database and accessed through their account. 

- In the next phase the user interface was implemented through the use of Html, Css and Javascript, in order to provide a responsive adaptation for different devices and greater usability by users to have a good user experience.

- In the last phase, http events and requests coming from the front-end were managed from the back-end. In addition, the room management logic has been included to allow users to play with each other:  
	- create private or public rooms 
	- join existing rooms, created by other users, to play with the user of the selected room
	- matchmaking between users connected to the site to find and start a new game
	- leave the room before the game starts, indicated by a countdown

Once the game starts, all props are loaded through the Phaser framework to allow players to play with each other. 
The game is based on Air Hockey and requires players to score goals in the opponent's goal until one of them manages to score 7 points to win the game. 
There is also the possibility to quit the current game, either by closing the browser by the user, or by clicking the "Quit" button inside the game. 
Once the game is finished a report is displayed, showing the winner and the loser with their respective experience points.

### Authors:
- Giacomo Romano (GitHub reference: www.github.com/GiacomoR96)
- Marco Raciti (GitHub reference: www.github.com/Mark1096)
