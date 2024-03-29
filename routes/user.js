const router = require('express').Router();
const db = require('../db');

const crypto = require('crypto');

/**
 * @swagger
 * tags:
 *   name: User
 *   description: 사용자 정보 관련 API
 */


//userRouter 테스트
router.get('/',async(req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");
    res.status(200).json({
        router: "authRouter"
    });
});

//로그인
/**
 * @swagger
 * /user/info/{id}:
 *   get:
 *     summary: 유저 로그인
 *     description: id에 대한 유저의 로그인을 시도합니다.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 name:
 *                   type: string
 *                 id:
 *                   type: string
 *                 champion:
 *                   type: string
 *                 tier:
 *                   type: string
 *                 winrate:
 *                   type: string
 *             example:
 *               status: "ok"
 *               message: ""
 *               name: "김인페"
 *               id: "123"
 *               champion: "Champion Name"
 *               tier: "Gold"
 *               winrate: "55%"
 *       400:
 *         description: 잘못된 인자 입력
 */
router.get('/info/:id',async(req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");

    try{

        //header 토큰 사용시
        //const token = req.headers.authorization.split(' ')[1];

        const id = req.params.id;
        
        //DB 연결용 connection 변수 선언
        const connection = db.return_connection();
        //해당 정보에 해당하는 사용자가 있는 지 확인하는 쿼리문
        const  SQL = "Select * from userinfo where id = ?;";

        //유저 정보 확인용 쿼리 요청
        connection.query(SQL,[id],function(err, results, field){
            //Query 요청 중 에러 발생 시
            if(err){
                console.error(err);
                return res.status(400).json({
                    "type": "/errors/incorrect-SQL-pass",
                    "title": "Incorrect query or SQL disconnect.",
                    "status": 400,
                    "detail": err.toString()
                })
            }
            //요청 정상 수행
            if(results[0] !== undefined){
                return res.status(200).json({
                    "status": "ok",
                    "message": "Userinfo access success  .",
                    "name": results[0].name,
                    "id": results[0].id,
                    "password": results[0].password,
                    "champion": results[0].champion,
                    "tier": results[0].tier,
                    "winrate": results[0].winrate + "%"
                })
            }
            //해당하는 사용자가 없는 경우 에러 처리
            else {
                console.error("Authentication failed due to incorrect username or password.");
                return res.status(400).json({
                    "type": "/errors/incorrect-user-pass",
                    "title": "Incorrect username or password.",
                    "status": 400,
                    "detail": "Authentication failed due to incorrect username or password.",
                })
            }   
        })
    }
    //API 처리 중 에러 발생 시
    catch(err){
        console.error(err);
        return res.status(500).json({
            "type": "/errors/incorrect-server-pass",
            "title": "Internal Server Error.",
            "status": 500,
            "detail": err.toString()
        })
    }
});

//사용자 정보 수정
/**
 * @swagger
 * /user/updateinfo/{id}:
 *   put:
 *     summary: 사용자 정보 수정
 *     description: id 유저에 대한 정보를 수정합니다.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nowpassword:
 *                 type: string
 *               newpassword:
 *                 type: string
 *               champion:
 *                 type: string
 *     responses:
 *       200:
 *         description: 사용자 정보 수정 성공
 *       400:
 *         description: 잘못된 인자
 */
router.put('/updateinfo/:id',async(req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");

    try{

        //header 토큰 사용시
        //const token = req.headers.authorization.split(' ')[1];

        const id = req.params.id;
        const now_hash_password = crypto.createHash('sha512').update(req.body.nowpassword).digest('base64');
        const new_hash_password = crypto.createHash('sha512').update(req.body.newpassword).digest('base64');
        const champion = req.body.champion;
        
        //DB 연결용 connection 변수 선언
        const connection = db.return_connection();

        //해당 정보에 해당하는 사용자가 있는 지 확인하는 쿼리문
        const SQL = "update userinfo set password = ?, champion = ? where id = ? and password = ?;";

        //유저 정보 확인용 쿼리 요청
        connection.query(SQL,[new_hash_password, champion, id, now_hash_password],function(err, results, field){
            //Query 요청 중 에러 발생 시
            if(err){
                console.error(err);
                return res.status(400).json({
                    "type": "/errors/incorrect-SQL-pass",
                    "title": "Incorrect query or SQL disconnect.",
                    "status": 400,
                    "detail": err.toString()
                })
            }

            //컬럼을 수정했다면 
            if(results.affectedRows === 1){
                return res.status(200).json({
                    "status": "ok",
                    "check": "yes",
                    "message": "Query Success",
                })
            }

            else{
                return res.status(200).json({
                    "status": "ok",
                    "check": "no",
                    "message": "wrong now password",
                })
            }

        })
    }
    //API 처리 중 에러 발생 시
    catch(err){
        console.error(err);
        return res.status(500).json({
            "type": "/errors/incorrect-server-pass",
            "title": "Internal Server Error.",
            "status": 500,
            "detail": err.toString()
        })
    }
});

//사용자 최근 전적 검색
/**
 * @swagger
 * /user/match/{id}:
 *   get:
 *     summary: 최근 전적 검색
 *     description: id 유저의 최근 전적을 검색해 옵니다.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 최근 전적 검색 성공
 *       400:
 *         description: 잘못된 인자 전달
 */
router.get('/match/:id',async(req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");

    try{
        const user_id = req.params.id;

        const connection = await db.return_connection();
        
        let SQL = "select match_id, ifnull(loser,'') as loser, ifnull(winner,'') as winner, losescore, winscore, challenger, contender, applymessage, matchDate, creationDate from matches  ";
        SQL += "left join challenge on match_id = challenge_id  ";
        SQL += "where contender = (select name from userinfo where id = ?) or challenger = (select name from userinfo where id = ?) order by matchDate desc;";        
 
        connection.query(SQL, [user_id, user_id], function(err,results,field){
            if(err){
                console.error(err);
                return res.status(400).json({
                    "type": "/errors/incorrect-SQL-pass",
                    "title": "Incorrect query or SQL disconnect.",
                    "status": 400,
                    "detail": err.toString()
                })
            }
            return res.status(200).json({
                status: "ok",
                message: "유저 최근 전적",
                matchlist: results
            })
        })
    }
    //API 처리 중 에러 발생 시
    catch(err){
        console.error(err);
        return res.status(500).json({
            "type": "/errors/incorrect-server-pass",
            "title": "Internal Server Error.",
            "status": 500,
            "detail": err.toString()
        })
    }
});

module.exports = router;