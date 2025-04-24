const express = require("express");
const {
  test,
  getMessagesByPR,
  getMessages,
  createUser,
  login,
  getUnreadMessagesCountByPR,
  markRead,
  markAsRead,
  fetchMentionUser
} = require("../controllers/messageController");

const router = express.Router();

router.get("/test", test);
router.get("/messages/:prNumber", getMessagesByPR);
router.get("/unread-count/:userId/:prNumber", getUnreadMessagesCountByPR);
router.get("/mark-read", markRead);
router.post("/messages/markAsRead", markAsRead);
router.get("/messages", getMessages);

router.post("/createUser", createUser);
router.post("/login", login);
router.post("/login", login);

router.post('/fetchMentionUser', fetchMentionUser); 
   

module.exports = router;
