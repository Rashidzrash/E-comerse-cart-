var db = require('../config/connection')
var collection = require('../config/collection')
var bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectId
const { ObjectId } = require('bson')
const { PRODUCT_COLLECTION } = require('../config/collection')
const { response } = require('express')
const { checkout } = require('../routes/user')
const async = require('hbs/lib/async')
var Razorpay = require('razorpay')
const { promise, reject } = require('bcrypt/promises')
const { resolve } = require('path')

var instance = new Razorpay({
    key_id: 'rzp_test_rVaG1PeRrnd8Em',
    key_secret: 'T8johyE8qToUugDz2MvNGQgQ',
});


module.exports = {
    dosignup: (userdata) => {
        return new Promise(async (resolve, reject) => {
            userdata.password = await bcrypt.hash(userdata.password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userdata).then((data) => {
                resolve(data)
            })
        })
    },
    dologin: (userdata) => {
        return new Promise(async (resolve, reject) => {

            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userdata.email })
            if (user) {

                bcrypt.compare(userdata.password, user.password).then((status) => {
                    if (status) {
                        response.user = user
                        response.status = true
                        resolve(response)
                    }
                    else {
                        response.status = false
                        response.err = null
                        resolve(response)
                    }

                })
            } else {
                response.status = false
                response.err = null
                resolve(response)
            }
        })
    },
    cartProduct: (userId, proID) => {
        let proObj = {
            item: ObjectId(proID),
            quantity: 1

        }
        return new Promise(async (resolve, reject) => {

            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            if (userCart) {
                let proExistValue = userCart.product.findIndex(product => product.item == proID)

                if (proExistValue != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: ObjectId(userId), 'product.item': ObjectId(proID) },
                            {
                                $inc: { 'product.$.quantity': 1 }

                            }
                        ).then(() => {
                            resolve()
                        })
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(userId) }, {
                        $push: {
                            product: proObj
                        }
                    }).then((result) => {
                        resolve(result)
                    })
                }
            } else {
                let cartObj = {
                    user: ObjectId(userId),
                    product: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((result) => {
                    resolve(result)
                })
            }

        })

    },
    AllCartProduct: (userId) => {
        return new Promise(async (resolve, reject) => {
            let CartItem = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind: '$product'
                },
                {
                    $project: {
                        item: '$product.item',
                        quantity: '$product.quantity',


                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'productDetils'
                    }
                },

                {
                    $project: {

                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$productDetils', 0] },
                    }
                }, {
                    $project: {

                        item: 1,
                        quantity: 1,
                        product: 1,
                        total: { $multiply: ['$quantity', { $toInt: '$product.price' }] },

                    }
                }

                // 
                // {
                //     $lookup:{
                //         from:collection.PRODUCT_COLLECTION,
                //         let :{proList:'$product'},
                //         pipeline:[
                //             {
                //                 $match:{
                //                     $expr:{
                //                         $in:['$_id','$$proList']
                //                     }
                //                 }
                //             }
                //         ],
                //         as:'cartItems'
                //     }
                // }


            ]).toArray()

            resolve(CartItem)
        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {

            let count = 0
            db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $project: { total: { $sum: '$product.quantity' } }

                },
            ]).toArray().then((cart) => {
                if (cart.length > 0) {

                    resolve(cart[0].total)
                } else {

                    resolve(count)
                }
            })

        })
    },
    changeProdQuantity: (proDetails) => {
        let proID = proDetails.product
        let cartID = proDetails.cart
        let count = parseInt(proDetails.count)
        return new Promise((resolve, reject) => {
            if (proDetails.quantity != 1 || count == 1) {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectId(cartID), 'product.item': ObjectId(proID) },
                    {
                        $inc: { 'product.$.quantity': count }

                    }
                ).then(() => {
                    resolve(true)
                })
            }
        })


    },
    delProduct: (details) => {
        let cartId = details.cart
        let proId = details.product


        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectId(cartId) },
                {
                    $pull: { product: { item: ObjectId(proId) } }
                }).then(() => {
                    resolve(true)
                })
        })
    },
    TotalPrice: (userId) => {
        return new Promise(async (resolve, reject) => {
            let totalprice = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind: '$product'
                },
                {
                    $project: {
                        item: '$product.item',
                        quantity: '$product.quantity',



                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'productDetils'
                    }
                },

                {
                    $project: {

                        item: 1,
                        quantity: 1,

                        product: { $arrayElemAt: ['$productDetils', 0] }


                    }
                },
                {
                    $group: {
                        _id: 10,
                        total: { $sum: { $multiply: ['$quantity', { $toInt: '$product.price' }] } },


                    }
                }
            ]).toArray()
            resolve(totalprice[0])

        })
    },
    CheckoutDetails: (CheckoutDetails, cart, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CHECKOUT_DETAILS).insertOne({ user: ObjectId(userId), details: CheckoutDetails, ProductDetalis: cart, status: 'Placed', Date: new Date() }).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: ObjectId(userId) })
                resolve()
            })
        })
    },
    orderHistory: (userId) => {
        return new Promise(async (resolve, reject) => {
            let history = await db.get().collection(collection.CHECKOUT_DETAILS).find({ user: ObjectId(userId) }).toArray()

            resolve(history)
        })
    },
    orderDetails: (userId) => {
        return new Promise(async (resolve, reject) => {
            let history = await db.get().collection(collection.CHECKOUT_DETAILS).findOne({ _id: ObjectId(userId) })

            resolve(history)
        })
    },
    Razorpay: (user, Price) => {
        console.log(user);
        return new Promise((resolve, reject) => {
            var options = {
                amount: Price * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: '' + user
            };
            instance.orders.create(options, function (err, order) {
                console.log(order);
                resolve(order)
            });
        })
    },
    verifyPayment: (details) => {
        console.log(details);
        return new Promise((resolve, reject) => {
            let body = details['response[razorpay_order_id]'] + "|" + details['response[razorpay_payment_id]'];
            const crypto = require("crypto");
            const expectedSignature = crypto.createHmac('sha256', 'T8johyE8qToUugDz2MvNGQgQ')
                .update(body)
                .digest('hex');
            if (expectedSignature == details['response[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },
    changePaymentStatus: (orderId, status) => {
        return new Promise((resolve, reject) => {

            db.get().collection(collection.CHECKOUT_DETAILS).updateOne({ _id: ObjectId(orderId) },
                {
                    $set: { status: 'Palced' }
                }).then(() => {
                    resolve()
                })

        })
    },
    sorting:(category1)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).find({category:category1}).toArray().then((data)=>{
                resolve(data)
            })
        })
    }



}