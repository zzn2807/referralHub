var DataTypes = require("sequelize").DataTypes;
var _therapist_schedule = require("./therapist_schedule");
var _therapists = require("./therapists");

function initModels(sequelize) {
  var therapist_schedule = _therapist_schedule(sequelize, DataTypes);
  var therapists = _therapists(sequelize, DataTypes);

  therapist_schedule.belongsTo(therapists, { as: "therapist", foreignKey: "therapist_id"});
  therapists.hasMany(therapist_schedule, { as: "therapist_schedules", foreignKey: "therapist_id"});

  return {
    therapist_schedule,
    therapists,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
