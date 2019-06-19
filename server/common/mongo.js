const mongodb=require("mongodb").MongoClient;

mongodb.connect("mongodb://localhost:27017",{ useNewUrlParser: true },(err,client)=>{

    if(err)
        console.log(err);
    else
    {
        global.db=client.db("recharge");
        console.log("Mongodb is connected");
    }

})

function retrivecommon(collection,query,callback)
{
    db.collection(collection).find(query).toArray(function(err,output){
        if(err)
            callback(err);
        else
            callback(null,output);
    })
}

function insertcommon(collection,data,callback)
{
    db.collection(collection).insertOne(data,function(err,output){
        if(err)
            callback(err);
        else
            callback(null,data);
    })
}

function updatecommon(collection,query,set,callback)
{
    db.collection(collection).update(query,set,function(err,output){
        if(err)
            callback(err);
        else
            callback(null,output);
    })
}

module.exports.retrivecommon=retrivecommon;
module.exports.insertcommon=insertcommon;
module.exports.updatecommon=updatecommon;