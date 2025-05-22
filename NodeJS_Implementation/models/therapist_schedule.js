const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('therapist_schedule', {
    therapist_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'therapists',
        key: 'id'
      }
    },
    app_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    booked: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 0
    },
    client_first_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    client_last_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'therapist_schedule',
    timestamps: false,
    indexes: [
      {
        name: "therapist_id",
        using: "BTREE",
        fields: [
          { name: "therapist_id" },
        ]
      },
    ]
  });
};
