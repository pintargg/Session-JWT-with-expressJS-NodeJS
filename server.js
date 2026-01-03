const cors = require('cors')
const dotenv = require('dotenv')
const express = require('express')
const app = express()
const response = require('./response')
const bodyParser = require('body-parser')
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const port = 3000
const db = require('./connection')

app.use(cors())
dotenv.config()

const varenv = process.env

app.use(bodyParser.json())
app.use(express.json())


// app.get('/asal', (req, res) => {
//     const secretKey = req.headers['secret-key']
//     if (secretKey === varenv.SECRET) {
//         response(200, varenv.SECRET, 'Berhasil', res)
//     } else {
//         response(401, null, "GAGAL - UNAUTHORIZED", res)
//     }
// })

app.post('/register', async (req, res) => {
    if(!req.body || Object.keys(req.body).length === 0) {
        return response(404, null, 'No Data Provided', res)
    }
    const { username, password } = req.body

    if (!username || !password) {
        return response(403, null, 'Username and password are required', res)
    }  

    const hashedPassword = await bcrypt.hash(password, 10)
    const sql = 'INSERT INTO users (username, password) VALUES (?, ?)'

    db.query(sql, [username, hashedPassword], (err, result) => {
        if(err) {
            if(err.code === 'ER_DUP_ENTRY') {
                return response(409, null,  'Username already exists', res)
            } else {
                return response(500, null, "SERVER ERROR", res)
            }
        }
        response(200, null, 'REGISTERED SUCCESSFULLY', res)
    })
})

app.post('/login', (req, res) => {
    const { username, password } = req.body
    
    const sql = 'SELECT * FROM users WHERE username = ?'
    db.query(sql, [username], async (err, results) => {
        if(err) {
            return response(500, null, "SERVER ERROR", res)
        }
        if(results.length === 0) {
            return response(404, null, 'User not found', res)
        }
        
        const user = results[0]

        console.log(user)
        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch) {
            return response(401, null, 'Invalid credentials', res)
        }
        const token = jwt.sign({ id: user.id, username: user.username }, varenv.JWT_SECRET, { expiresIn: '1h' })
        response(200, { token }, 'LOGIN SUCCESSFUL', res)
    })
})

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    // Format header biasanya: "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).send('Akses ditolak (Token tidak ada)');

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).send('Token tidak valid');
        
        // Jika valid, simpan data user ke request object agar bisa dipakai di route selanjutnya
        req.user = user;
        next();
    });
}

app.get('/dashboard', authenticateToken, (req, res) => {
    // req.user berasal dari middleware authenticateToken
    response(200, { message: 'Ini adalah data rahasia dashboard', user: req.user }, 'Dashboard accessed', res);
});

app.post('/buy', (req, res) => {
    const { session_id, product_category } =  req.body
    const sql = "INSERT INTO transactions (session_id, product_category) VALUES (?, ?)"
    db.query(sql, [session_id, product_category], (err, result) => {
        if(err)  return response(500, err, "SERVER ERROR", res)
        response(200, product_category, "Transaction successful", res)
    })
})

    
app.listen(port, () => {
    console.log(`SERVER RUNNING ON PORT ${port}`)
})