const express = require('express');

const router = express.Router();

const users = [];

// GET /user 라우터
router.get('/users', (req, res) => {
    if (users.id == null || users.id == '') {
        res.send('유저 정보가 없습니다.');
    } else {
        res.send('존재');
    }
});

// POST /create 라우터
router.post('/cid', (req, res) => {
    const userId = req.body.id;
    const userName = req.body.name;
    const userBirth = req.body.birth;
    const userGender = req.body.gender;
    users.id = userId;
    users.name = userName;
    users.birth = userBirth;
    users.gender = userGender;
    res.send(`${users.name}님 환영합니다!`);
});

// GET /read 라우터
router.get('/rid/:id', (req, res) => {
});

module.exports = router;