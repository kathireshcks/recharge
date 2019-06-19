const express=require('express');
const mongo=require("../common/mongo");
const app=express.Router();
const async=require('async');
const uuid=require('uuid/v4');

app.get('/test',function(req,res){
    res.send("Api is working");
});

app.post('/create/shop',function(req,res){
    console.log("*********** /create/shop **********");
    console.log(`body : ${JSON.stringify(req.body)}`);

    let request=req.body;

    let shop={};

    shop._id = uuid();
    shop.name = request.name;
    shop.email = request.email;
    shop.accounts = {};
    shop.accounts.country_id=request.country_id;
    shop.accounts.mobile_number=request.mobile_number;
    shop.accounts.country_code=request.country_code;
    shop.credit_balance=0;
    shop.wallet_balance=0;
    shop.region=request.region;
    shop.status=true;
    shop.isDeleted=false;
    shop.isMobile=false;
    shop.brands="test";
    shop.createdAt=new Date();
    shop.updatedAt=new Date();

    mongo.insertcommon("shop",shop,function(err,result){
        if(err)
            res.status(400).send({error:err});
        else
            res.status(200).send({result:"Shop created Succssfully"}); 
    })
})


app.post('/create/country',function(req,res){
    console.log("*********** /create/country **********");
    console.log(`body : ${JSON.stringify(req.body)}`);

    let request=req.body;

    let country={};

    country._id = uuid();
    country.name = request.name;
    country.iso = request.iso;
    country.currency=request.currency;;
    country.rate=request.rate;;
    country.currency_iso=request.currency_iso;
    country.zero_decimal=request.zero_decimal;;
    country.country_code=request.country_code;;
    country.isDeleted=false;;
    country.status=true;
    country.createdAt=new Date();
    country.updatedAt=new Date();

    mongo.insertcommon("countries",country,function(err,result){
        if(err)
            res.status(400).send({error:err});
        else
            res.status(200).send({result:"country created Succssfully"}); 
    })
})

app.get('/shopstatus/:shop_id',function(req,res){
    console.log("*********** /shopstatus/:shop_id **********");

    mongo.retrivecommon("shop",{_id:req.params.shop_id},function(err,result){
        if(err)
            res.status(400).send({error:err});
        else{
            let response={};
            response.exist=result[0].status && !result[0].isDeleted?"Exist":"Not-Exist";
            response.active=!result[0].isDeleted?"Active":"Not-Active";
            
            res.status(200).send(response);
            
        }
    })
})


app.get('/shopcountry/status/:shop_id',function(req,res){
    console.log(`********** /shopcountry/status/:shop_id ***********`);

    new Promise(function(reslove,reject){

        mongo.retrivecommon("shop",{_id:req.params.shop_id},function(err,result){
            if(err)
                reject(err);
            if(result.length)
                reslove(result);
            else    
                res.status(400).send({"error":"No record found"});
        })
    }).then(function(shopdetail){

        let query={};
        query._id=shopdetail[0].accounts.country_id;
        query.country_code=shopdetail[0].accounts.country_code;

        mongo.retrivecommon("countries",query,function(err,result){
            if(err)
                reject(err);
            
            let response={};
            response.exist=result[0].length?"Exist":"Not-Exist";
            response.rate=parseInt(result[0].rate)>0?"Rate is Available":"Rate is Not-Available";

            res.status(200).send(response);
            
        });
    }).catch(function(error){
        console.log(error);
        res.status(400).send({error:error});
    }).catch(function onReject(err){
        console.log(err);
        res.status(400).send({error:err});
    });
    
})

app.post('/recharge',function(req,res){
    console.log(`********** /recharge ***********`);
    console.log(`body : ${JSON.stringify(req.body)}`);

    let request=req.body;

    
    async.waterfall([
        function(callback){

            mongo.retrivecommon("shop",{email:request.email},function(err,result){
                if(err)
                    callback(err);
                
                if(result.length)
                {
                    if(request.amount< parseFloat(result[0].wallet_balance))
                        callback(null,result);
                    else
                        callback("Your wallet balance is very low please recharge");
                }else
                    callback("No Shop Found");
            })
        },

        function(shopdetail,callback){
            let query={};
            query._id=shopdetail[0].accounts.country_id;
            query.country_code=shopdetail[0].accounts.country_code;

            mongo.retrivecommon("countries",query,function(err,result){
                if(err)
                    callback(err);
            
                if(result.length)
                {
                    callback(null,shopdetail,result);
                }else
                    callback("No Shop Found");
            })
        },

        function(shopdetail,countrydetail,callback){

            let transaction={};
            transaction._id=uuid();
            transaction.transaction_number="1234";
            transaction.transaction_type=4;
            transaction.shop_id=shopdetail[0]._id;
            transaction.updated_balance=parseFloat(shopdetail[0].wallet_balance)-request.amount;
            transaction.amount=request.amount;
            transaction.amount_currency=request.amount*parseFloat(countrydetail[0].rate);
            transaction.checksum="test";
            transaction.status=true;
            transaction.customer_mobile=request.mobilenumber;
            transaction.product_mrp=20;
            transaction.recharge_type="123";
            transaction.country_id=countrydetail[0]._id;
            transaction.brand_id=shopdetail[0]._id;
            transaction.timestamps=new Date();

            mongo.insertcommon("transaction",transaction,function(err,result){
                if(err)
                    callback(err);
                
                callback(null,shopdetail,countrydetail,result);

            })

        },

        function(shopdetail,countrydetail,transactiondetail,callback){

            let topup={};
            topup._id=uuid();
            topup.shop_id=shopdetail[0]._id;
            topup.transaction_id=transactiondetail._id;
            topup.product_amount=transactiondetail.product_mrp;
            topup.product_amount_currency=parseFloat(countrydetail[0].rate)-transactiondetail.product_mrp;
            topup.reward_amount=1;
            topup.reward_amount_currency=1*parseFloat(countrydetail[0].rate);
            topup.grand_buyrate=request.amount;
            topup.grand_buyrate_currency=request.amount*parseFloat(countrydetail[0].rate);
            topup.processing_fee=2;
            topup.processing_fee_currency=2*parseFloat(countrydetail[0].rate);
            topup.status=true;
            topup.timestamps=new Date();

            mongo.insertcommon("topup",topup,function(err,result){
                if(err)
                    callback(err);
                
                callback(null,shopdetail,countrydetail,transactiondetail,result);

            })

        },

        
        function(shopdetail,countrydetail,transactiondetail,topupdetail,callback){

            let rewards={};
            rewards._id=uuid();
            rewards.name=shopdetail[0].name;
            rewards.credit=topupdetail.reward_amount;
            rewards.credit_currency=topupdetail.reward_amount*parseFloat(countrydetail[0].rate);
            rewards.shop_id=shopdetail[0]._id;
            rewards.reward_type="recharge";
            rewards.status=true;
            rewards.timestamps=new Date();

            mongo.insertcommon("rewards",rewards,function(err,result){
                if(err)
                    callback(err);
                
                callback(null,shopdetail,countrydetail,transactiondetail,topupdetail,result);

            })

        },

        function(shopdetail,countrydetail,transactiondetail,topupdetail,rewards,callback){

            let query={};
            query._id=shopdetail[0]._id;

            let set={};
            set.$set={};
            set.$set.credit_balance=parseFloat(shopdetail[0].credit_balance)+rewards.credit;
            set.$set.wallet_balance=parseFloat(shopdetail[0].wallet_balance)-request.amount;
            set.$set.updatedAt=new Date();

            mongo.updatecommon("shop",query,set,function(err,result){
                if(err)
                    callback(err);
                
                callback(null,result);

            })

        },

    ],function(err,data){
        if(err)
            res.status(400).send({error:err});
        else
            res.status(200).send({result:"Successfully Rechargered"});
    })
})



app.put('/update/balance',function(req,res){
    console.log(`********** /update/balance ***********`);
    console.log(`body : ${JSON.stringify(req.body)}`);

    let request=req.body;


    new Promise(function(reslove,reject){
        mongo.retrivecommon("shop",{email:request.email},function(err,result){
            if(err)
                reject(err);
            if(result.length)
                reslove(result);
            else    
                res.status(400).send({"error":"No record found"});
        })
    }).then(function(data){

        let query={};
        query.email=request.email;

        let set={};
        set.$set={};
        if(request.credit_balance)
            set.$set.credit_balance=parseFloat(data[0].credit_balance)+request.credit_balance;
        if(request.wallet_balance)
            set.$set.wallet_balance=parseFloat(data[0].wallet_balance)+request.wallet_balance;
        set.$set.updatedAt=new Date();

        mongo.updatecommon("shop",query,set,function(err,result){
            if(err)
                res.status(400).send({"error":err});
            else
                res.status(200).send({"result":"cretited your wallet"});
        })

    })
    

})

module.exports=app;