process.env.Name="Recharge shop";

const express=require("express");
const bodyparser=require("body-parser");

const api=require("./api/api");

const app=express();
const port=8100;

app.use(bodyparser.json());

app.use('/api',api);

app.get("/",function(req,res){
    console.log("Server Running fine");
    res.send({sucess:"true"});
});

app.listen(port,()=>{
    console.log(`Server Running port is :${port}`);
});