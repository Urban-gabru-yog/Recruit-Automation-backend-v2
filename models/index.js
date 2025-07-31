require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DIALECT || "mysql",
    logging: false,
  }
);

const User = require("./User")(sequelize);
const Job = require("./Job")(sequelize);
const Candidate = require("./Candidate")(sequelize);

module.exports = {
  sequelize,
  User,
  Job,
  Candidate,
};
