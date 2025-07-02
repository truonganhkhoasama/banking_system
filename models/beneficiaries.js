import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class Beneficiaries extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      unique: "unique_beneficiary"
    },
    account_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: "unique_beneficiary"
    },
    bank_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: "unique_beneficiary"
    },
    alias_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    createdat: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedat: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'beneficiaries',
    schema: 'public',
    hasTrigger: true,
    timestamps: false,
    indexes: [
      {
        name: "beneficiaries_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "unique_beneficiary",
        unique: true,
        fields: [
          { name: "user_id" },
          { name: "account_number" },
          { name: "bank_code" },
        ]
      },
    ]
  });
  }
}
