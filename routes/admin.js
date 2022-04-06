var express = require('express');
const { json, redirect } = require('express/lib/response');
const async = require('hbs/lib/async');
const { response } = require('../app');

const { getAllproducts } = require('../helpers/product-helpers');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')

const verifyLogin=(req,res,next)=>{
  if(req.session.adminLoggedIn)
  {
    
    next()
  }else{
    res.redirect('/admin/login')
  }

}
/* GET users listing. */
router.get('/',verifyLogin, function (req, res, next) {
  let admin1=req.session.admin
 
  productHelper.getAllproducts().then((product) => {
    res.render('admin/view-products', { admin1,admin: true, product })
  })
});

router.get('/add-products',verifyLogin, function (req, res) {
  let admin1=req.session.admin
  res.render('admin/add-products', {admin1, admin: true })
})
router.post('/add-products', function (req, res) {

  productHelper.addproduct(req.body).then((id) => {

    let image = req.files.image
    image.mv('./public/images/' + id + '.png', (err) => {
      if (!err) {
        res.redirect('/admin/add-products')
      }
      else {
        console.log(err);
      }
    })
  })
})
router.get('/delete-product/:id', (req, res) => {
  let proId = req.params.id
  productHelper.DelProduct(proId).then((response) => {
    res.redirect('/admin')
  })
})
router.get('/edit-product/:id',verifyLogin, (req, res) => {
  let admin1=req.session.admin
  productHelper.getproduct(req.params.id).then((product) => {
    res.render('admin/edit-product', {admin1, admin: true, product })
  })
})
router.post('/edit-product/:id', (req, res) => {

  productHelper.updateproduct(req.params.id, req.body).then((products) => {
    res.redirect('/admin')
    if (req.files.image) {
      let image = req.files.image
      image.mv('./public/images/' + req.params.id + '.png')
    }
  })
})
router.get('/users',verifyLogin,(req,res)=>{
  let admin1=req.session.admin
  productHelper.AllUsers().then((users)=>{
    res.render('admin/users',{admin1,admin:true,users})
  })
})
router.get('/full-details/:id',(req,res)=>{
  
  productHelper.orderdetails(req.params.id).then((ordersDetails)=>{
    
  })
})
router.get('/All-Orders',verifyLogin,async(req,res)=>{
  let admin1=req.session.admin
  let totalProfit=await productHelper.totalProfit()
  
  productHelper.AllOrders().then((orders)=>{
    let totalOrders=orders.length
    
    res.render('admin/All-Orders',{admin1,totalProfit,totalOrders,orders,admin:true})
  })
})
router.post('/status-change',(req,res)=>{
  
  productHelper.StatusChange(req.body).then((response)=>{
    res.json(response)
  })
})
router.get('/login',(req,res)=>{
  let err=req.session.err
   res.render('admin/admin-login',{err,admin:true,login:true})
   req.session.err=null
  
})
router.post('/admin-Login',(req,res)=>{
  console.log(req.body);
  productHelper.adminLogin(req.body).then((response)=>{
    if(response.status){
      req.session.adminLoggedIn=true
      req.session.admin=response.admin
      res.redirect('/admin')
    }else{
      req.session.err='Invalid username or Password'
      res.redirect('/admin/login')
    }
  })
})
router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/admin/login')
})

module.exports = router;
