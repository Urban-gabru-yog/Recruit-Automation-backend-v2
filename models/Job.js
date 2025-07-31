module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  return sequelize.define('Job', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    team: DataTypes.STRING,
    position: DataTypes.STRING,
    custom_questions: DataTypes.JSON, 
    jd: DataTypes.TEXT,
    status: { type: DataTypes.STRING, defaultValue: 'open' },
    sheet_link: DataTypes.STRING,
    form_link: DataTypes.STRING,
    team_lead_email: DataTypes.STRING, // ✅ New column

  });
};
