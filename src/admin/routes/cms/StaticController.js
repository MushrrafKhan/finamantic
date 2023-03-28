const {
    models: {Static}
} = require('../../../../lib/models');
const {showDate, uploadImageLocal} = require('../../../../lib/util');
require('../../../../lib/models')

class staticController{
    async aboutusPage(req,res,next){
            const cms = await Static.findOne({slug:"about-us"});
            res.render("cms/aboutus",{cms});
    }
    async privacypolicyPage(req,res,next){
        const cms = await Static.findOne({slug:"privacy-policy"});
        res.render("cms/privacy",{cms});       
    }
    async termAndCondition(req,res,next){
        const cms = await Static.findOne({slug:"terms-conditions"});
        res.render("cms/termAndCondition",{cms});       
    }
    async faq(req,res,next){
        const cms = await Static.findOne({slug:"faq"});
        res.render("cms/faq",{cms});       
    }
    async cmsdata(req,res,next){
            const id = req.params.id;
            let originalString = req.body.description;
            // let strippedString = originalString.replace(/(<([^>]+)>)/gi, "");
            const cms = await Static.findOneAndUpdate({_id:req.params.id},{description:originalString},{new:true});            
            if(cms.title == "About Us update"){
                return res.render("cms/aboutus",{cms})         
            }else if(cms.title == "Privacy Policy"){
                res.render("cms/privacy",{cms});         
            }
            else if(cms.title == "Terms & Conditions"){
                res.render("cms/termAndCondition",{cms});         
            }
            else if(cms.title == "FAQ"){
                res.render("cms/faq",{cms});         
            }
    }

    
}

module.exports = new staticController;