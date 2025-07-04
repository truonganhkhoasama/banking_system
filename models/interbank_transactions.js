import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class InterbankTransactions extends Model {
  static init(sequelize, DataTypes) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      direction: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      internal_account_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'accounts',
          key: 'id'
        }
      },
      external_account_number: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      bank_code: {
        type: DataTypes.STRING(20),
        allowNull: true,
        references: {
          model: 'linked_banks',
          key: 'bank_code'
        }
      },
      amount: {
        type: DataTypes.DECIMAL,
        allowNull: false
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
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
      tableName: 'interbank_transactions',
      schema: 'public',
      hasTrigger: true,
      timestamps: false,
      indexes: [
        {
          name: "interbank_transactions_pkey",
          unique: true,
          fields: [
            { name: "id" },
          ]
        },
      ]
    });
  }
}
