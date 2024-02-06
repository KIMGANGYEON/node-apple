const router = require('express').Router()


let connectDB = require('./../database.js')

let db;


connectDB.then((client)=>{
  console.log('DB연결성공');
  db = client.db('forum');
}).catch((err)=>{
    console.log(err)
})

router.get('/shop/shirts', async (요청, 응답) =>{
    await db.collection('post').find().toArray()
    응답.send('셔츠파는곳~')
})

router.get('/shop/pants',(요청, 응답) =>{
    응답.send('바지파는 페이지')
})



module.exports = router









