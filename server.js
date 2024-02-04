const express = require('express')
const app = express()

app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({extended:true}))


const { MongoClient, ObjectId } = require('mongodb')

let db
const url = 'mongodb+srv://kimgagnyeon:qwer1234@kimgangyeon.yzyyteo.mongodb.net/?retryWrites=true&w=majority'
new MongoClient(url).connect().then((client)=>{
  console.log('DB연결성공');
  db = client.db('forum');
  app.listen(8080, () => {
    console.log('http://localhost:8080 에서 서버 실행중')
    })
}).catch((err)=>{
    console.log(err)
})

app.get('/', (요청, 응답) => {
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
            await db.collection('post').insertOne({ title : 요청.body.title, content : 요청.body.content })
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
        let result =  await db.collection('post').findOne({ _id : new ObjectId(요청.params.id) })
        console.log(요청.param)
        if (result == null) {
            응답.status(400).send('url이상해')
        }
        응답.render('detail.ejs', {result : result})
    } catch(e){
        console.log(e)
        응답.status(400).send('url이상해')
    }
    
})