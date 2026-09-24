'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ServiceBooking extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ServiceBooking.init({
    serviceId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    quotedPrice: DataTypes.DECIMAL,
    status: DataTypes.STRING,
    scheduledAt: DataTypes.DATE,
    addressLine1: DataTypes.STRING,
    addressCity: DataTypes.STRING,
    addressState: DataTypes.STRING,
    addressPincode: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'ServiceBooking',
  });
  return ServiceBooking;
};