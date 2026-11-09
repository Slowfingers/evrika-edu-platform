require('dotenv').config();
const express=require('express');
const cors=require('cors');
const app=express();
const allowedOrigins=(process.env.FRONTEND_URL||'http://localhost:5173,http://127.0.0.1:5173').split(',').map(value=>value.trim());
app.use(cors({origin:allowedOrigins,methods:['GET','HEAD','OPTIONS'],allowedHeaders:['Content-Type','Authorization']}));
app.use(express.json({limit:'100kb'}));
app.get('/test',(_req,res)=>res.json({status:'OK',message:'EvrikaEdu Backend работает!',timestamp:new Date().toISOString()}));
app.use('/api/cards',require('./routes/card.routes'));
app.use('/api/metadata',require('./routes/metadata.routes'));
app.get('/',(_req,res)=>res.json({message:'EvrikaEdu Backend API',version:'1.0.0',endpoints:{cards:'/api/cards',metadata:'/api/metadata'}}));
app.use((_req,res)=>res.status(404).json({success:false,error:'Маршрут не найден'}));
app.use((error,_req,res,_next)=>{const status=error.status===400?400:error.status===413?413:500;res.status(status).json({success:false,error:status===400?'Неверный JSON':status===413?'Слишком большой запрос':'Ошибка сервера'});});
if(require.main===module){
 const port=process.env.PORT||10000;
 const server=app.listen(port,process.env.HOST||'0.0.0.0',()=>console.log(`EvrikaEdu API: ${port}`));
 for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{server.close(()=>process.exit(0));setTimeout(()=>process.exit(1),5000).unref();});
}
module.exports=app;
