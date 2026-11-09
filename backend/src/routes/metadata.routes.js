const express=require('express');
const metadata=require('../data/metadata.json');
const router=express.Router();
for(const [route,key] of [['/age-groups','age_groups'],['/skills','skills'],['/form-data','formData']])router.get(route,(_req,res)=>res.json({success:true,data:metadata[key]}));
module.exports=router;
