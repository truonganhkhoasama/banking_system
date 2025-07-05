import _sequelize from "sequelize";
const DataTypes = _sequelize.DataTypes;
import _Accounts from  "./accounts.js";
import _ApiLogs from  "./api_logs.js";
import _Beneficiaries from  "./beneficiaries.js";
import _DebtReminders from  "./debt_reminders.js";
import _InterbankTransactions from  "./interbank_transactions.js";
import _LinkedBanks from  "./linked_banks.js";
import _OtpCodes from  "./otp_codes.js";
import _Transactions from  "./transactions.js";
import _Users from  "./users.js";

export default function initModels(sequelize) {
  const Accounts = _Accounts.init(sequelize, DataTypes);
  const ApiLogs = _ApiLogs.init(sequelize, DataTypes);
  const Beneficiaries = _Beneficiaries.init(sequelize, DataTypes);
  const DebtReminders = _DebtReminders.init(sequelize, DataTypes);
  const InterbankTransactions = _InterbankTransactions.init(sequelize, DataTypes);
  const LinkedBanks = _LinkedBanks.init(sequelize, DataTypes);
  const OtpCodes = _OtpCodes.init(sequelize, DataTypes);
  const Transactions = _Transactions.init(sequelize, DataTypes);
  const Users = _Users.init(sequelize, DataTypes);

  InterbankTransactions.belongsTo(Accounts, { as: "internal_account", foreignKey: "internal_account_id"});
  Accounts.hasMany(InterbankTransactions, { as: "interbank_transactions", foreignKey: "internal_account_id"});
  Transactions.belongsTo(Accounts, { as: "from_account", foreignKey: "from_account_id"});
  Accounts.hasMany(Transactions, { as: "transactions", foreignKey: "from_account_id"});
  Transactions.belongsTo(Accounts, { as: "to_account", foreignKey: "to_account_id"});
  Accounts.hasMany(Transactions, { as: "to_account_transactions", foreignKey: "to_account_id"});
  Beneficiaries.belongsTo(LinkedBanks, { as: "bank_code_linked_bank", foreignKey: "bank_code"});
  LinkedBanks.hasMany(Beneficiaries, { as: "beneficiaries", foreignKey: "bank_code"});
  InterbankTransactions.belongsTo(LinkedBanks, { as: "bank_code_linked_bank", foreignKey: "bank_code"});
  LinkedBanks.hasMany(InterbankTransactions, { as: "interbank_transactions", foreignKey: "bank_code"});
  Accounts.belongsTo(Users, { as: "user", foreignKey: "user_id"});
  Users.hasMany(Accounts, { as: "accounts", foreignKey: "user_id"});
  Beneficiaries.belongsTo(Users, { as: "user", foreignKey: "user_id"});
  Users.hasMany(Beneficiaries, { as: "beneficiaries", foreignKey: "user_id"});
  DebtReminders.belongsTo(Users, { as: "from_user", foreignKey: "from_user_id"});
  Users.hasMany(DebtReminders, { as: "debt_reminders", foreignKey: "from_user_id"});
  DebtReminders.belongsTo(Users, { as: "to_user", foreignKey: "to_user_id"});
  Users.hasMany(DebtReminders, { as: "to_user_debt_reminders", foreignKey: "to_user_id"});
  OtpCodes.belongsTo(Users, { as: "user", foreignKey: "user_id"});
  Users.hasMany(OtpCodes, { as: "otp_codes", foreignKey: "user_id"});

  return {
    Accounts,
    ApiLogs,
    Beneficiaries,
    DebtReminders,
    InterbankTransactions,
    LinkedBanks,
    OtpCodes,
    Transactions,
    Users,
  };
}
