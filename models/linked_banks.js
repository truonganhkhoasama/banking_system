import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class LinkedBanks extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    bank_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: "linked_banks_bank_code_key"
    },
    bank_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    public_key: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    shared_secret: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    callback_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
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
    tableName: 'linked_banks',
    schema: 'public',
    hasTrigger: true,
    timestamps: false,
    indexes: [
      {
        name: "linked_banks_bank_code_key",
        unique: true,
        fields: [
          { name: "bank_code" },
        ]
      },
      {
        name: "linked_banks_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
