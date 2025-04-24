const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Message = require("../models/Message");
const Users = require("../models/Users");

const test = async (req, res) => {
  let arr = [1, 2, 3];
  console.log("one");
  console.log("two");
  console.log("three");
  console.log("four");
  console.log("five");
  console.log("six");
  console.log(arr);

  res.json({
    status: 200,
    message: "Tested succssfully",
  });
};

const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({}).sort({ timestamp: 1 });

    const enrichedMessages = await Promise.all(
      messages.map(async (msg) => {
        const user = await Users.findOne({});
        return {
          ...msg.toObject(),
          senderName: user?.name || "Unknown",
          senderProfilePicture: user?.profilePicture || null,
        };
      })
    );

    res.json(enrichedMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).send("Server error");
  }
};
const getMessagesByPR = async (req, res) => {
  try {
    const messages = await Message.find({ prNumber: req.params.prNumber }).sort(
      { timestamp: 1 }
    );

    const enrichedMessages = await Promise.all(
      messages.map(async (msg) => {
        const user = await Users.findOne({ userId: msg.senderId });
        return {
          ...msg.toObject(),
          senderName: user?.name || "Unknown",
          senderProfilePicture: user?.profilePicture || null,
        };
      })
    );

    res.json(enrichedMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).send("Server error");
  }
};
const getUnreadMessagesCountByPR = async (req, res) => {
  const { userId, prNumber } = req.params;
  try {
    const unreadCount = await Message.countDocuments({
      prNumber,
      isReadBy: { $ne: userId },
      $or: [
        { receiverId: null }, // for all
        { receiverId: userId }, // direct message
      ],
    });

    res.json({ prNumber, unreadCount });
  } catch (err) {
    console.error("Error fetching unread count:", err);
    res.status(500).json({ error: "Server error" });
  }
};
// Mark messages as read
const markRead = async (req, res) => {
  const { userId, prNumber } = req.body;

  try {
    await Message.updateMany(
      {
        prNumber,
        isReadBy: { $ne: userId },
        $or: [
          { receiverId: null },
          { receiverId: userId },
        ],
      },
      { $push: { isReadBy: userId } }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    console.error('Error marking messages as read:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const markAsRead = async (req, res) => {
  const { prNumber, userId } = req.body;
  await Message.updateMany(
    { groupId: prNumber, receiverId: userId, read: false },
    { $set: { read: true } }
  );
  res.sendStatus(200);
}


const createUser = async (req, res) => {
  try {
    let user = req.body;
    const hasPassword = await bcrypt.hash("password", 10);
    user.password = hasPassword;
    let userdata = await Users.create([user]);
    // await User.create([
    //   {
    //     userId: "buyer001",
    //     password: Password,
    //     name: "Buyer One",
    //     email: "buyer@example.com",
    //     role: "buyer",
    //   },
    //   {
    //     userId: "supplier002",
    //     password: Password,
    //     name: "Supplier Two",
    //     email: "supplier@example.com",
    //     role: "supplier",
    //   },
    // ]);

    res.json(userdata);
  } catch (error) {
    console.error("Error create  user:", error);
    res.status(500).send("Server error");
  }
};
const login = async (req, res) => {
  const { userId, password } = req.body;

  try {
    // 1. Check if user exists
    const user = await Users.findOne({ userId });

    if (!user) {
      return res.status(401).json({ message: "Invalid user ID or password" });
    }

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid user ID or password" });
    }

    // 3. Create JWT Token
    const token = jwt.sign(
      { userId: user.userId, role: user.role },
      "your_jwt_secret", // keep secret in .env
      { expiresIn: "1h" }
    );

    // 4. Return response
    res.json({
      token,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        role: user.role,
        email: user.email,
        buyerId: user.buyerId,
        associated: user.associated,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const fetchMentionUser = async (req, res) => {
  let { senderId } = req.body;
  // 1. Fetch sender info
  let receiverIds = [];
  let MentionUsers ;
  const sender = await Users.findOne({ userId: senderId });
  console.log("sender", sender);
  if (!sender) {
    const EveryUser = await Users.find({},"-_id userId name");
    if (!EveryUser) {
      res.json([]);
    }else{
      receiverIds = EveryUser.map((s) => s.userId);
      let Everyone = [{"userId":"Everyone","name":"Everyone"}]
      MentionUsers = [...Everyone,...users]
    }
  } else {

    // 2. Role-based logic
    if (sender.role === "supplier") {
      receiverIds = sender.buyerId;
    } else if (sender.role === "buyer") {
      const suppliers = await Users.find({ buyerId: senderId });
      receiverIds = suppliers.map((s) => s.userId);
    }
    console.log("receiverIds", receiverIds);

    const users = await Users.find(
      { userId: { $in: receiverIds } },
      "-_id userId name"
    ); 
    let Everyone = [{"userId":"Everyone","name":"Everyone"}]
    MentionUsers = [...Everyone,...users]
  
  }
  res.json(MentionUsers);
};

module.exports = {
  test,
  getMessages,
  getMessagesByPR,
  getUnreadMessagesCountByPR,
  createUser,
  login,
  markRead,
  markAsRead,
  fetchMentionUser,
};
