const express = require("express");
const jwt = require("jsonwebtoken");
const { WalletModel } = require("../model/wallet.model");
const { TransactionModel } = require("../model/transaction.model");
const { UserModel } = require("../model/user.model");
const WalletRouter = express.Router();

// Handling User's  Wallet Transactions

const addAmountinWallet = async (props) => {
  const { amount, userId } = props;
  try {
    const wallet = await WalletModel.find({ userId: userId });
    wallet[0].balance = wallet[0]?.balance + amount;
    await wallet[0].save();
    return {
      status: "success",
      message: `Successfully Added Balance in Your Wallet`,
    };
  } catch (error) {
    return {
      status: "error",
      message: `Failed To Add Balance in the Wallet ${error.message}`,
    };
  }
};

const subAmountinWallet = async (props) => {
  const { amount, userId } = props;

  try {
    const wallet = await WalletModel.find({ userId: userId });
    wallet[0].balance = wallet[0].balance - amount;
    await wallet[0].save();
    return {
      status: "success",
      message: `Successfully Deducted Balance From Your Wallet`,
    };
  } catch (error) {
    return {
      status: "error",
      message: `Failed To Add Balance in the Wallet ${error.message}`,
    };
  }
};

const addAmountInAdminWallet = async (props) => {
  const { amount, userId, eventId } = props;
  try {
    const user = await UserModel.find({ accountType: "admin" });
    if (user.length <= 0) {
      return { status: "error", message: `Admin Not Found` };
    }
    const wallet = await WalletModel.find({ userId: user[0]._id });
    wallet[0].balance = wallet[0].balance + amount;

    const transaction = transactionData({
      amount: amount,
      type: "Credit",
      fromUserId: userId,
      message: "Adding Balance In Admin Wallet",
      toUserId: user[0]._id,
      eventId: eventId,
    });

    if (transaction.status === "error") {
      return {
        status: "error",
        message: `Failed To Create Transaction Detail ${transaction.message}`,
      };
    } else {
      await wallet[0].save();
      return {
        status: "success",
        message: `Successfully Transfered Amount to Admin Account.`,
      };
    }
  } catch (error) {
    return {
      status: "error",
      message: `Failed To Transfer Amount To Admin Account ${error.message}`,
    };
  }
};

const subAmountInAdminWallet = async (props) => {
  const { amount, userId, eventId } = props;

  try {
    const user = await UserModel.find({ accountType: "admin" });
    if (user.length <= 0) {
      return { status: "error", message: `Admin Not Found` };
    }
    const wallet = await WalletModel.find({ userId: user[0]._id });
    wallet[0].balance = wallet[0].balance - amount;

    const transaction = transactionData({
      amount: amount,
      type: "Debit",
      message: "Deducting Balance From Admin Wallet",
      toUserId: userId,
      fromUserId: user[0]._id,
      eventId: eventId,
    });

    if (transaction.status === "error") {
      return {
        status: "error",
        message: `Failed To Create Transaction Detail ${transaction.message}`,
      };
    } else {
      await wallet[0].save();
      return {
        status: "success",
        message: `Successfully Transfered Amount to User Account From Admin Account.`,
      };
    }
  } catch (error) {
    return {
      status: "error",
      message: `Failed To Deduct Amount From Admin Account ${error.message}`,
    };
  }
};

const createWallet = async (props) => {
  const { userId } = props;
  try {
    const walletlist = await WalletModel.find({ userId: userId });
    if (walletlist.length > 0) {
      return { status: "error", message: `Wallet Already Exists` };
    }
    const wallet = new WalletModel({ balance: 0, userId: userId });
    await wallet.save();
    return {
      status: "success",
      message: `Wallet Successfully Created For The User !!`,
    };
  } catch (error) {
    return {
      status: "error",
      message: `Failed To Create Wallet ${error.message}`,
    };
  }
};

const transactionData = async (props) => {
  try {
    const transaction = new TransactionModel({
      amount: props?.amount,
      userId: props?.userId || props?.fromUserId,
      type: props?.type,
      status: "Success",
      method: "Wallet",
      message: props?.message,
      from: props?.fromUserId,
      to: props?.toUserId,
      eventId: props?.eventId,
    });
    await transaction.save();
    return {
      status: "success",
      message: `Successfully Created Transaction Detail`,
    };
  } catch (error) {
    return {
      status: "error",
      message: `Failed To Create Transaction Detail ${error.message}`,
    };
  }
};

module.exports = {
  transactionData,
  addAmountinWallet,
  createWallet,
  WalletRouter,
  subAmountinWallet,
  addAmountInAdminWallet,
  subAmountInAdminWallet,
};
