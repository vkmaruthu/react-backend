const Message = require("../models/Message");
const Users = require("../models/Users");

const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log("✅ Client connected:", socket.id);

    // Join a room based on PR number
    socket.on("joinRoom", (obj) => {
      socket.join(obj.prNumber);
      console.log(`👥 User joined room ${obj.prNumber}`);
    });

    // Typing indicator
    socket.on("typing", ({ userName, groupId }) => {
      socket.to(groupId).emit("typing", { userName, groupId });
    });
    
    // Send message logic
    socket.on("sendMessage", async (data) => {
      try {
        const { senderId, prNumber, message } = data;

        // 1. Fetch sender info
        const sender = await Users.findOne({ userId: senderId });
        if (!sender) {
          return socket.emit("error", { message: "Sender not found" });
        }

        let receiverIds = [];

        // 2. Role-based logic
        if (sender.role === "supplier") {
          receiverIds = [sender.buyerId[0]];
        } else if (sender.role === "buyer") {
          const suppliers = await Users.find({ buyerId: senderId });
          if (message.includes("@Everyone")) {
            receiverIds = suppliers.map((s) => s.userId);
          } else {
            const mentions = message.match(/@(\w+)/g);
            if (mentions) {
              receiverIds = mentions.map((m) => m.replace("@", ""));
            }else{

              receiverIds = suppliers.map((s) => s.userId); 
            }
          }
        }
       console.log("receiverIds",receiverIds);

        // 3. Save message
        const newMessage = new Message({
          ...data,
          receiverId: receiverIds.length  ? receiverIds : null,
          timestamp: new Date(),
        });

        await newMessage.save();

        const fullMessage = {
          ...newMessage.toObject(),
          senderName: sender.name,
          senderProfilePicture: sender.profilePicture || null,
        };

        // 4. Emit message to all in the room (grouped by PR)
        console.log("🔥 Emitting to room:", prNumber, "| Payload:", fullMessage);

        io.to(prNumber).emit("newMessage", fullMessage);

        console.log(
          "📨 Message sent to PR:",
          prNumber,
          "| Message:",
          fullMessage
        );
      } catch (error) {
        console.error("❌ Error in sendMessage:", error);
        socket.emit("error", { message: "Error sending message" });
      }
    });

    // Inside socketHandler.js
    socket.on("markAsRead", async ({ userId, prNumber }) => {
      try {
        await Message.updateMany(
          {
            prNumber,
            isReadBy: { $ne: userId },
            $or: [{ receiverId: null }, { receiverId: userId }],
          },
          { $push: { isReadBy: userId } }
        );

        io.to(prNumber).emit("readUpdate", { userId });
      } catch (err) {
        console.error("Error in markAsRead:", err);
      }
    });
    socket.on("disconnect", () => {
      console.log("❎ Client disconnected:", socket.id);
    });
  });
};

module.exports = socketHandler;
