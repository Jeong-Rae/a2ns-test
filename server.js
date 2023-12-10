const express = require('express');
const app = express();
const port = 3000;
const fs = require('fs');
const cors = require('cors');
const path = require('path');
require("dotenv").config();
const api2notionsync = require('api2notionsync');
const yaml = require('js-yaml');

const widdershinsPath = require.resolve("widdershins");
console.log(widdershinsPath);

//swagger
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

//const HTTP_PORT = 80;
//const HTTPS_PORT = 443;
//const https = require('https');

const db = require('./db');
const bodyParser = require('body-parser');
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const characterRouter = require('./routes/character');
const rankingRouter = require('./routes/ranking');
const challengeRouter = require('./routes/challenge');

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname ,"..","Frontend")));

let corsOptions = {
    origin: ['null', '*', 'http://localhost:3000','http://localhost:5500'],
    credentials: true
}

app.use(cors(corsOptions));

const swaggerDefinition = {
    openapi: '3.0.0', // OpenAPI 버전
    info: {
        title: '인터페이스 철권 서포터 API', // API 제목
        version: '1.0.0', // API 버전
        description: '세종대학교 인터페이스 프로젝트 전시회를 위한 철권 서포터 API 정보입니다.', // API 설명
    },
    // 기타 필요한 Swagger 설정들...
};

const options = {
    swaggerDefinition,
    apis: ['./routes/*.js'], // Swagger 문서가 작성될 파일 경로
};

const swaggerSpec = swaggerJsdoc(options);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
const swaggerYaml = yaml.dump(swaggerSpec);
app.get('/v3/api-docs.yaml', (req, res) => {
    res.setHeader('Content-Type', 'application/yaml');
    res.send(swaggerYaml);
});

app.use('/auth', authRouter);
app.use('/character', characterRouter);
app.use('/user', userRouter);
app.use('/ranking', rankingRouter);
app.use('/challenge',challengeRouter )

//db.connect();

app.get('/', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");

    res.sendFile(path.join(__dirname,"..","Frontend","main.html"));
});

app.listen(port, () => {
    console.log(`server is listening at localhost:${port}`);
})

api2notionsync.run();

/*
const maintain_connect = setInterval(() => {
    const connection = db.return_connection();
    connection.query("SELECT 1");
}, 360000)
*/
