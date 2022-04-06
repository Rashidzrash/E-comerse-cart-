const { response, json } = require('express');
var express = require('express');
const { helpers } = require('handlebars');
const async = require('hbs/lib/async');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')
var userHelper = require('../helpers/users-helpers')
/* GET home page. */
let err
let cartcount
let CheckoutDetail
const verifylogin = (req, res, next) => {

  if (req.session.loggenIn) {

    next()
  } else {
    res.redirect('/login')
  }

}

router.get('/', function (req, res, next) {
  let user = req.session.user
  productHelper.getAllproducts().then(async (product) => {
    if (user) {

      cartcount = await userHelper.getCartCount(req.session.user._id)
    }
    res.render('users/View-products', { product, admin: false, user, cartcount });
  })
});
router.get('/login', function (req, res) {
  if (req.session.loggenIn) {
    res.redirect('/')
  } else {
    res.render('users/login', { signup: true, err })
    err = null
  }
})
router.get('/signup', function (req, res) {
  res.render('users/signup', { signup: true })
})
router.post('/signup', function (req, res) {
  userHelper.dosignup(req.body).then((response) => {
    res.redirect('/login')
  })
})
router.post('/login', function (req, res) {

  userHelper.dologin(req.body).then((result) => {

    if (result.status) {
      req.session.loggenIn = true
      req.session.user = result.user
      res.redirect('/')
    } else {
      result.err = 'Invalid username or Password'

      err = result.err
      res.redirect('/login')
  }
  })

})
router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})
router.get('/cart', verifylogin, (req, res) => {
  let user = req.session.user
  userHelper.AllCartProduct(req.session.user._id).then(async (cartItems) => {
    cartcount = await userHelper.getCartCount(req.session.user._id)
    if (cartItems.length > 0) {
      let totalprice = await userHelper.TotalPrice(req.session.user._id)
      let total = parseInt(totalprice.total) + 10
      res.render('users/cart', { item: true, user, cartItems, cartcount, totalprice, total })
    } else {
      res.render('users/cart', { item: false, user, cartcount })
    }
})

})
router.get('/add-to-cart/:id', (req, res) => {
 userHelper.cartProduct(req.session.user._id, req.params.id).then(() => {
    res.json({ status: true })
  })
})
router.post('/product-quantity', (req, res) => {

  userHelper.changeProdQuantity(req.body).then((response) => {

    res.json(response)
  })
})
router.post('/del-product', (req, res) => {

  userHelper.delProduct(req.body).then((response) => {

    res.json(response)
  })
})
router.get('/checkout', verifylogin, async (req, res) => {

  cartcount = await userHelper.getCartCount(req.session.user._id)
  let user = req.session.user
  let cart = await userHelper.AllCartProduct(req.session.user._id)
  let subtotal = await userHelper.TotalPrice(req.session.user._id)
  let total1 = parseInt(subtotal.total) + 10


  res.render('users/checkout', { user, cartcount, cart, subtotal, total1 })
})
router.post('/checkout-Details', async (req, res) => {
  CheckoutDetail = req.body
  if (req.body.paymentMethod === 'COD') {
    let cart = await userHelper.AllCartProduct(req.session.user._id)
    userHelper.CheckoutDetails(req.body, cart, req.session.user._id).then((c) => {
      res.json({ orderSuccess: true })
    })
  } else {
    userHelper.Razorpay(req.session.user, req.body.TotalPrice).then((order) => {

      res.json(order)
    })
  }
})

router.get('/order-success', verifylogin, async (req, res) => {
  let user = req.session.user
  let cart = await userHelper.AllCartProduct(req.session.user._id)
  cartcount = await userHelper.getCartCount(req.session.user._id)
  userHelper.orderHistory(req.session.user._id).then((history) => {
    if (history.length > 0) {
      let totalOrders=history.length
      res.render('users/orders', { totalOrders,orders: true, user, cart, history, cartcount })
    } else {
      res.render('users/orders', { user, cartcount })
    }
  })
})
router.get('/orders-details/:id', verifylogin, async (req, res) => {
  cartcount = await userHelper.getCartCount(req.session.user._id)
  userHelper.orderDetails(req.params.id).then((history) => {

    let subtotal = history.details.TotalPrice - 10

    res.render('users/order-details', { history, subtotal, cartcount, user: req.session.user })
  })
})
router.post('/verifyPayment', (req, res) => {

  userHelper.verifyPayment(req.body).then(async (response) => {
    let cart = await userHelper.AllCartProduct(req.session.user._id)
    userHelper.CheckoutDetails(CheckoutDetail, cart, req.session.user._id).then(() => {
      res.json({ status: true })
    })
  }).catch((err) => {

    res.json({ status: false, errMsg: '' })
  })
})
router.get('/sorting/:category',async(req,res)=>{
 let user=req.session.user
  if (user) {

    cartcount = await userHelper.getCartCount(req.session.user._id)
  }
  userHelper.sorting(req.params.category).then((product)=>{
    res.render('users/category',{product,cartcount,user})
  })
})


module.exports = router;
