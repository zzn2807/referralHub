//Sequelize
const Sequelize = require('sequelize');
const sequelize = new Sequelize(
    'scheduling_db',//Use the sql file to create your own mysql db for testing
    'dnwokolo', //Create db user
    'pellet7766',//Set password
    {
        host: '172.23.208.1',//Get host from which db will be accessed
        dialect: 'mysql',
        port: 3306//get db port
    }
);
sequelize.models = require('./init-models.js')(sequelize);

module.exports = sequelize;