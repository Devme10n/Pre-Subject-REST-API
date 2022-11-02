const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const multer = require('multer');
// const router = express.Router();

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

// const indexRouter = require('./routes'); 
// const userRouter = require('./routes/user');

const DIR = 'data/'
/** http method로 주고 받는 data를 저장하는 배열 */
var users = [];

try {
    fs.readdirSync(DIR);  
} catch (error) {
    fs.mkdirSync(DIR);
}

const app = express();
app.set('port', process.env.PORT || 3000);

app.use(
    morgan('dev'),
    express.static(path.join(__dirname, 'public')),
    express.json(),
    express.urlencoded({extended:false}), 
    cookieParser(process.env.SECRET),
    session({
        resave: false,
        saveUninitialized: false,
        secret: process.env.SECRET,
        cookie: {
            httpOnly: true,
            secure: false
        },
        name: 'session-cookie'
    }));

app.get('/', (_, res) => res.redirect(301, '/index.html'));
app.get('/users', (_, res) => res.send(JSON.stringify(users)))
app.get('/create', (_, res) => res.redirect(301, '/create.html'));
app.get('/read', (_, res) => res.redirect(301, '/read.html'));
app.get('/update', (_, res) => res.redirect(301, '/update.html'));
app.get('/delete', (_, res) => res.redirect(301, '/delete.html'));

const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, done) { // destination : 파일이 저장된 폴더
            done(null, DIR);
        },
        filename(req, file, done) { // filename : destination 안에 있는 파일명
            const ext = path.extname(file.originalname);
            done(null, `${req.body.id}${ext}`);
        }
    })
});

// 사용자 정보 추가 API
app.post('/cid', upload.single('image'), (req,res)=> {
    let tempId = req.body.id;
    // ID 중복 예외처리
    if (users.find(({ id }) => id === tempId)) {
        // 409 Conflict : 리소스의 현재 상태와 충돌해서 해당 요청을 처리할 수 없어 클라이언트가 충돌을 수정해서 다시 요청을 보내야할 때
        res.status(409).send('중복 ID입니다.');
    }
    else {
        if (req.hasOwnProperty('file')) {
            var imageName = req.file.filename;
        } else {
            var imageName = '';
        }
        let tempUser = {
            id : req.body.id,
            name : req.body.name,
            birth : req.body.birth,
            gender : req.body.gender,
            image : imageName
        }
        users.push(tempUser);
        res.send(`${tempUser.name} 생성 성공`)
        tempUser = []; // 입력받은 값 초기화
    }
  })

// 사용자 정보 조회 API
app.get('/rid', (req,res) => {
    let tempId = req.query.id;
    let user = users.find(({ id }) => id === tempId);
    if (user != undefined) {
        res.send(JSON.stringify(user))
    }
    else {
        res.status(404).send('해당 ID는 users에 없습니다.');
    }
})

// 사용자 정보 수정 API
app.post('/uid', upload.single('image'), (req,res) => {
    let tempId = req.body.id;
    let userIndex = users.findIndex(({ id }) => id === tempId);
    // 입력받은 사용자 수정 정보
    if (req.hasOwnProperty('file')) {
        var imageName = req.file.filename;
    } else {
        var imageName = '';
    }
    let tempUser = {
        id : req.body.id,
        name : req.body.name,
        birth : req.body.birth,
        gender : req.body.gender,
        image : imageName
    }
    let tempExt = path.extname(tempUser.image); // 사용자 수정 후 이미지 확장자
    if (users.find(({ id }) => id === tempId)) {
        let ext = path.extname(users[userIndex].image); // 사용자 수정 전 이미지 확장자
        if (tempUser.name != '' && tempUser.name != users[userIndex].name) {
            users[userIndex].name = tempUser.name;
        }
        if (tempUser.birth != '' && tempUser.birth != users[userIndex].birth) {
            users[userIndex].birth = tempUser.birth;
        } 
        if (tempUser.gender != '' && tempUser.gender != users[userIndex].gender) {
            users[userIndex].gender = tempUser.gender;
        }
        if (tempUser.image != users[userIndex].image) { // update
            users[userIndex].image = tempUser.image;
            // 확장자가 바뀐 경우 수정 전 이미지 삭제
            if (ext = undefined && tempExt != ext) {
                fs.unlinkSync(DIR + `${users[userIndex].id}${ext}`);
            }
        }
        res.send('사용자 정보가 수정되었습니다.' + JSON.stringify(users[userIndex]))
        tempUser = []; // 입력받은 값 초기화
    }
    else {
        if (ext = undefined && tempExt != ext) {
            fs.unlinkSync(DIR + `${tempUser.id}${tempExt}`);
        }
        res.status(404).send('해당 ID는 users에 없습니다.');
    }
})

// 사용자 정보 삭제 API
app.get('/did', (req,res) => {
    let tempId = req.query.id;
    if (users.find(({ id }) => id === tempId)) {
        let userIndex = users.findIndex(({ id }) => id === tempId);
        let tempName = users[userIndex].name;
        if (users[userIndex].image != '') { // 파일이 있는 경우 파일 삭제
            let ext = path.extname(users[userIndex].image); // 저장된 확장자
            fs.unlinkSync(DIR + `${tempId}${ext}`);
        }
        users.splice(userIndex,1);
        res.send(`ID : ${tempId}, name : ${tempName}는 삭제되었습니다.`)
    }
    else {
        res.status(404).send('해당 ID는 users에 없습니다.');
    }
    
})

app.listen(app.get('port'), () => console.log(`${app.get('port')} 번 포트에서 대기 중`));

/** 라우팅 : URI 및 특정 HTTP 요청 메소드(get, post등)에 대한 클라이언트 요청에 애플리케이션이 응답하는 방법을 결정하는 것 */