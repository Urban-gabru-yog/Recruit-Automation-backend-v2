module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  return sequelize.define('Candidate', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    jobId: DataTypes.INTEGER,
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    custom_answers: DataTypes.JSON,
    ats_score: DataTypes.INTEGER,
    resume_url: DataTypes.STRING,
    summary: DataTypes.TEXT,
    status: DataTypes.STRING, // shortlisted / rejected
    hr_status: DataTypes.STRING, // 'shortlisted', 'rejected', or null
    shortlisting_reason: DataTypes.TEXT
  });
};
