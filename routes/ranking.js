const mysql = require('mysql');
const router = require('express').Router();
const db = require('../db.js');

/**
 * @swagger
 * tags:
 *   name: Ranking
 *   description: 랭킹 관련 API
 */

// 전체 랭킹 조회
/**
 * @swagger
 * /ranking:
 *   get:
 *     summary: 전체 랭킹 조회
 *     description: 전체 랭킹을 조회하여 결과를 배열로 반환합니다.
 *     tags: [Ranking]
 *     responses:
 *       200:
 *         description: 랭킹 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   tier:
 *                     type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal Server Error
 */
router.get('/', async(req,res)=> {
    res.header("Access-Control-Allow-Origin", "*");

    try{
        const SQL = "SELECT GROUP_CONCAT(DISTINCT name ORDER BY name) AS name, CASE WHEN tier = 'Currrent_King' THEN 'current_king' WHEN tier = 'Zate_Keeper' THEN 'gatekeeper' ELSE tier END AS tier FROM userinfo GROUP BY tier;";
        const connection = await db.return_connection();

        connection.query(SQL, function(err,results,field){
            if(err){
                console.error(err);
                return res.status(400).json({
                    "type": "/errors/incorrect-SQL-pass",
                    "title": "Incorrect query or SQL disconnect.",
                    "status": 400,
                    "detail": err.toString()
                })
            }
            res.status(200).json(results);
        })
    }
    catch(e){
        console.error(e.toString());
        return res.status(500).json({
            "type": "/errors/incorrect-server-pass",
            "title": "Internal Server Error.",
            "status": 500,
            "detail": e.toString()
        })
    }
});

// 승률 업데이트
/**
 * @swagger
 * /ranking/updateWinrate/{name}:
 *   put:
 *     summary: 승률 업데이트
 *     description: name 유저의 승률을 변경합니다.
 *     tags: [Ranking]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: Username to update winrate
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Winrate updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal Server Error
 */
router.put('/updateWinrate/:name', async(req,res)=> {
    res.header("Access-Control-Allow-Origin", "*");

    const connection = await db.return_connection();
    const encodedUsername = req.params.name;
    
    try {
        if (!encodedUsername) {
            return res.status(400).json({
                status: 'error',
                message: 'Name parameter is required.',
            });
        }
        // 디코딩된 사용자 이름
        const username = decodeURIComponent(encodedUsername);

        // 해당 사용자의 승리, 패배, 승리한 매치의 패배 판 수, 패배한 매치의 승리 판 수를 가져오는 쿼리
        const userStatsQuery = `
            SELECT
            COALESCE(SUM(CASE WHEN winner = ? THEN winscore ELSE 0 END), 0) as wins,
            COALESCE(SUM(CASE WHEN loser = ? THEN losescore ELSE 0 END), 0) as losses,
            COALESCE(SUM(CASE WHEN winner = ? THEN losescore ELSE 0 END), 0) as win_losses,
            COALESCE(SUM(CASE WHEN loser = ? THEN winscore ELSE 0 END), 0) as loss_losses
            FROM matches
            WHERE winner = ? OR loser = ?;
        `;

        const results = await new Promise((resolve, reject) => {
            connection.query(userStatsQuery, [username, username, username, username, username, username], (err, results, field) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        const wins = results[0].wins;
        const losses = results[0].losses;
        const win_losses = results[0].win_losses;
        const loss_losses = results[0].loss_losses;

        // Winrate 계산
        const denominator = wins + losses + win_losses + loss_losses;
        const winrate = denominator !== 0 ? ((wins + losses) / denominator) * 100 : 0;

        // userinfo 테이블의 Winrate 값을 업데이트하는 쿼리
        const updateQuery = 'UPDATE userinfo SET Winrate = ? WHERE name = ?';

        await new Promise((resolve, reject) => {
            connection.query(updateQuery, [winrate, username], (err, results, field) => {
                if (err) reject(err);
                else resolve();
            });
        });

        res.status(200).json({
            status: 'ok',
            message: `Winrate of ${username} updated successfully.`
        });
    }
    catch (e) {
        console.error(e.toString());
        res.status(500).json({
            type: '/errors/incorrect-server-pass',
            title: 'Internal Server Error.',
            status: 500,
            detail: e.toString(),
        });
    }
});

// 상위 랭킹 사용자 조회
/**
 * @swagger
 * /ranking/rank:
 *   get:
 *     summary: 상위 랭킹 사용자 조회
 *     description: 랭킹중 상위 유저에 대한 정보를 조회합니다.
 *     tags: [Ranking]
 *     responses:
 *       200:
 *         description: Top ranking users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   id:
 *                     type: string
 *                   champion:
 *                     type: string
 *                   tier:
 *                     type: string
 *                   winrate:
 *                     type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal Server Error
 */
router.get('/rank', async(req,res)=> {
    res.header("Access-Control-Allow-Origin", "*");

    try{
        const SQL = "select name,id,champion,tier,winrate from userinfo order by tier limit 10;";
        const connection = await db.return_connection();

        connection.query(SQL, function(err,results,field){
            if(err){
                console.error(err);
                return res.status(400).json({
                    "type": "/errors/incorrect-SQL-pass",
                    "title": "Incorrect query or SQL disconnect.",
                    "status": 400,
                    "detail": err.toString()
                })
            }
            res.status(200).json(results);
        })
    }
    catch(e){
        console.error(e.toString());
        return res.status(500).json({
            "type": "/errors/incorrect-server-pass",
            "title": "Internal Server Error.",
            "status": 500,
            "detail": e.toString()
        })
    }
});

module.exports = router;