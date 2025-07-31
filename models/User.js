module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  return sequelize.define('User', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING, unique: true },
    password: DataTypes.STRING,
    role: DataTypes.STRING, // 'team' or 'hr'
  });
};