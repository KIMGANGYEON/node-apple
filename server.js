const express = require('express')
const app = express()
const { MongoClient, ObjectId } = require('mongodb')
const methodOverride = require('method-override')
const bcrypt = require('bcrypt')
require('dotenv').config()

const { createServer } = require('http')
const { Server } = require('socket.io')
const server = createServer(app)
const io = new Server(server) 

app.use(methodOverride('_method'))
app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({extended:true}))

const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const MongoStore = require('connect-mongo')

app.use(passport.initialize())
app.use(session({
  secret: '암호화에 쓸 비번',
  resave : false,
  saveUninitialized : false,
  cookie : {maxAge : 60 * 60 * 1000},
  store : MongoStore.create({
    mongoUrl : 'mongodb+srv://kimgagnyeon:qwer1234@kimgangyeon.yzyyteo.mongodb.net/?retryWrites=true&w=majority',
    dbName : 'forum'
  })
}))

app.use(passport.session()) 


let connectDB = require('./database.js')

let db;
connectDB.then((client)=>{
  console.log('DB연결성공');
  db = client.db('forum');
  app.listen(process.env.PORT, () => {
    console.log('http://localhost:8080 에서 서버 실행중')
    })
}).catch((err)=>{
    console.log(err)
})

// function 함수(요청, 응답, next){
//     if(!요청.user){
//         응답.send('로그인~~')
//     }
//     next()
// }

app.get('/', (요청, 응답) => {
    // 함수(요청, 응답)
    응답.send('반가웡2')
})

app.get('/list', async (요청, 응답) => {
    let result = await db.collection('post').find().toArray()
    console.log(result[0].title)
    // 응답.send('반가웡2')
    응답.render('list.ejs', { posts : result })
})

app.get('/time', (요청,응답) => {
    응답.render('time.ejs', {data : new Date()})
})


// app.get('/news', (요청, 응답) => {
//     db.collection('post').insertOne({title : '저쩌꾸'})
//     // 응답.send('비가와용')
// })

app.get('/index', (요청, 응답) => {
    응답.sendFile(__dirname + '/index.html')
})

app.get('/write', (요청, 응답) => {
    응답.render('write.ejs')
})

app.post('/add', async(요청, 응답) => {
    console.log(요청.body)
    

    try {
        if(요청.body.title == ''){
            응답.send('제목입력해')
            
        } else {
            await db.collection('post').insertOne({ 
                title : 요청.body.title, 
                content : 요청.body.content,
                user : 요청.user._id,
                username : 요청.user.username
            })
            응답.redirect('/list')
        }
    } catch(e) {
        console.log(e)
        응답.status(500).send('서버에러~')
    }

})

app.get('/detail/:id', async(요청, 응답)=>{
   
    // ({ _id : new ObjectId
    //     ('65bf5af5048d79fc8d203f51') })

    try {
        let result2 = await db.collection('comment').find({ parentId : new ObjectId(요청.params.id) }).toArray()

        let result =  await db.collection('post').findOne({ _id : new ObjectId(요청.params.id) })
        console.log(요청.params)
        if (result == null) {
            응답.status(400).send('url이상해')
        }
        응답.render('detail.ejs', {result : result, result2 : result2})
    } catch(e){
        console.log(e)
        응답.status(400).send('url이상해')
    }
    
})

app.get('/edit/:id', async(요청, 응답)=>{

    let result = await db.collection('post').findOne({_id : new ObjectId(요청.params.id)})
    console.log(result)
    응답.render('edit.ejs', {result : result})
})

app.put('/edit', async(요청, 응답)=>{

    await db.collection('post').updateOne({ _id : 1 },
    {$inc : { like : -2 }}
    )

//     await db.collection('post').updateOne({ _id : new ObjectId(요청.body.id) },
//     {$set : { title : 요청.body.title, content : 요청.body.content}})

//     console.log(요청.body)
//     응답.redirect('/list')
})

// app.post('/abc', async(요청, 응답)=>{

//     console.log('hi')
//     console.log(요청.body)
// })

app.delete('/delete', async(요청, 응답)=> {
    await db.collection('post').deleteOne({_id : new ObjectId(요청.query.docid),
    user : new ObjectId(요청.user._id) })
    응답.send('삭제완료')
})



app.get('/list/:id', async (요청, 응답) => {
    let result = await db.collection('post').find().skip((요청.params.id - 1) * 5).limit(5).toArray()  
    응답.render('list.ejs', { posts : result })
    console.log(요청.params.id)
})

app.get('/list/next/:id', async (요청, 응답) => {
    let result = await db.collection('post').find({_id : {$gt : new ObjectId(요청.params.id)}}).limit(5).toArray()  
    응답.render('list.ejs', { posts : result })
    console.log(요청.params.id)
})

// app.get('/list/2', async (요청, 응답) => {
//     let result = await db.collection('post').find().skip(5).limit(5).toArray()  
//     응답.render('list.ejs', { posts : result })
// })

passport.use(new LocalStrategy(async (입력한아이디, 입력한비번, cb) => {
    let result = await db.collection('user').findOne({ username : 입력한아이디})
    if (!result) {
      return cb(null, false, { message: '아이디 DB에 없음' })
    }

    if (await bcrypt.compare(입력한비번, result.password)) {
      return cb(null, result)
    } else {
      return cb(null, false, { message: '비번불일치' });
    }
  }))

  passport.serializeUser((user, done) => {
    process.nextTick(() => {
      done(null, { id: user._id, username: user.username })
    })
  })

  
  passport.deserializeUser(async(user, done) => {
    let result = await db.collection('user').findOne({_id : new ObjectId(user.id)})
    delete result.password
    process.nextTick(() => {
        done(null, user)
    })
  })



app.get('/login', async (요청, 응답) => {

    응답.render('login.ejs')
    
})
app.post('/login', async (요청, 응답, next) => {

   passport.authenticate('local', (error, user, info)=>{
    if (error) return 응답.status(500).json(error)
    if(!user) return 응답.status(401).json(info.message)
    요청.login(user, (err)=>{
        if(err) return next(err)
        응답.redirect('/')
})
   })(요청, 응답, next)
})

app.get('/register', (요청, 응답) => {
    응답.render('register.ejs')
})

app.post('/register', async (요청, 응답) => {

    let hash = await bcrypt.hash(요청.body.password, 15)
    console.log(hash)

    await db.collection('user').insertOne({
        username : 요청.body.username,
        password : hash
    })
    응답.redirect('/')
})

app.use('/', require('./routes/shop.js'))


app.get('/search', async (요청, 응답) => {
    console.log(요청.query.val)
    let 검색조건 = [
        {$search : {
            index : 'title_index',
            text : { query : 요청.query.val, path : 'title' }
          }},
          {$limit : { _id : 1 }}
    ]
    let result = await db.collection('post').aggregate(검색조건).toArray()

    // let result = await db.collection('post').find({$text : { $search : 요청.query.val }}).explain('executionsStats')
    // let result = await db.collection('post').find({title : {$regex : 요청.query.val}}).toArray()
    응답.render('search.ejs', {posts : result})
})

app.post('/comment', async(요청, 응답) => {
    await db.collection('comment').insertOne({
        content : 요청.body.content,
        writerId : new ObjectId(요청.user.id),
        writer : 요청.user.username,
        parentId : new ObjectId(요청.body.parentId)
    })
    응답.redirect('back')
})


app.get('/chat/request', async (요청, 응답)=>{
    await db.collection('chartroom').insertOne({
        member : [요청.user._id, 요청.query.writerId],
        // new ObjectId (요청.query.writerId)
        date : new Date()
    })
    응답.render('/chat/list')
})


app.get('/chat/list', async (요청, 응답)=>{
    await db.collection('chatroom').find({
        member : 요청.user._id
    }).toArray()
    응답.render('chatList.ejs', {result : result})
})

app.get('/chat/detail/:id', async (요청, 응답)=>{
    let result = await db.collection('chatroom').findOne({_id : 
       new ObjectId(요청.params.id)})
    응답.render('chatDetail.ejs', {result : result})
})