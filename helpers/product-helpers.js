var db = require('../config/connection')
var collection = require('../config/collection')
var objectId = require('mongodb').ObjectId
var bcrypt = require('bcrypt')
const { promise, reject } = require('bcrypt/promises')
const async = require('hbs/lib/async')
const { ObjectId } = require('mongodb')
module.exports = {

    addproduct: (product) => {
        return new Promise((resolve, reject) => {
            db.get().collection('product').insertOne(product).then((data) => {
                resolve(data.insertedId)
                
            })
        })
    },
    getAllproducts: () => {
        return new Promise(async (resolve, reject) => {

            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)

        })

    },
    DelProduct: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectId(proId) }).then((response) => {

                resolve(response)

            })

        })
    },
    getproduct: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) }).then((product) => {
                resolve(product)

            })
        })
    },
    updateproduct: (proId, product) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION)
                .updateOne({ _id: objectId(proId) }, {
                    $set: {
                        Name: product.Name,
                        category: product.category,
                        price: product.price
                    }
                }).then((products) => {
                    resolve(products)
                })
        })
    },
    AllUsers:()=>{
        return new Promise(async(resolve,reject)=>{
            let users=await db.get().collection(collection.USER_COLLECTION).aggregate([
                {
                $project:{
                    
                    UserName:'$name',
                    Email:'$email'
                }
            }
            ]).toArray()
           
           
           resolve(users)
        })
    },
    orderdetails:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            console.log(userId);
             db.get().collection(collection.CHECKOUT_DETAILS).find({user:ObjectId(userId)}).toArray().then((details)=>{
                resolve(details)
                
             })
            
        })
    },
    AllOrders:()=>{
        return new Promise(async(resolve,reject)=>{
           let orders=await db.get().collection(collection.CHECKOUT_DETAILS).find().toArray()
           resolve(orders)
          
        })
    },
    StatusChange:(details)=>{
    
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CHECKOUT_DETAILS).updateOne({_id:ObjectId(details.id)},{
                $set: { status:details.state }
            }).then(()=>{
                resolve({status:true})
            })
        })
    
    },
    totalProfit:()=>{
        return new Promise(async(resolve,reject)=>{
           let total=await db.get().collection(collection.CHECKOUT_DETAILS).aggregate([
               {
                $project:{ total:{$toInt:'$details.TotalPrice'}}
               },
               {
               $group: {
                _id: "$driver", 
                total1: {$sum: "$total"}
               }
            }
        ]).toArray()
            resolve(total[0].total1)
            
        })
    },
    adminLogin:(adminData)=>{
        
        return new Promise(async(resolve,reject)=>{
           
            let response={}
            let admin=await db.get().collection(collection.ADMIN_COLLECTION).findOne({name:(adminData.name)})
            
            if(admin){
                bcrypt.compare(adminData.paswword,admin.paswword).then((status)=>{
                    if(status){
                        response.admin=admin
                        response.status=true

                    }else{
                        response.status=false
                        
                    }
                    resolve(response)
                })
            }else{
            response.status=false
            resolve(response)
            }
        })
    }

}


