const express = require('express');
const app = express();
const mainRoutes = require('./routes/index');
const busboy = require('connect-busboy');

app.use(express.urlencoded({extended: false}));
app.use('/static',express.static('../'));
app.use(busboy());
app.use(mainRoutes);

app.set('view engine', 'pug');




//Start server
app.listen(3000);