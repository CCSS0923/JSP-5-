const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db/db');

// 회원가입
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.json({ success: false, message: "모든 필드를 입력하세요." });
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
    if (row) return res.json({ success: false, message: "이미 등록된 이메일입니다." });
    const hashed = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashed], err2 => {
      if (err2) return res.json({ success: false, message: "회원가입 실패." });
      res.json({ success: true });
    });
  });
});

// 로그인
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (!user) return res.json({ success: false, message: '이메일을 찾을 수 없습니다.' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.json({ success: false, message: '비밀번호가 틀렸습니다.' });
    res.json({ success: true, username: user.name });
  });
});

module.exports = router;
