const express = require('express');
const router = express.Router();
const UserController = require('./UserController');
const { validate } = require('../../util/validations');
const validations = require('./UserValidations');
const { verifyToken } = require('../../util/auth');


router.get( "/my-profile", verifyToken,UserController.profileAccountInfo);
router.get("/all-user",verifyToken,UserController.allUser)
router.post('/home-screen',verifyToken,UserController.homeScreen);
router.post("/goalImg",verifyToken,UserController.goalImg)
router.get("/share-with",verifyToken,UserController.searchPartner);
router.post("/add-goal",verifyToken,UserController.addGoal);
router.get("/goals",verifyToken,UserController.allGoals);
router.post("/view-goal",verifyToken,UserController.viewGoal);
router.post("/frnd-view-goal",verifyToken,UserController.frndViewGoal);
router.post('/goalsCate-wise',verifyToken,UserController.goalInCategory);
router.post('/update-profile',verifyToken,UserController.updateProfile);
router.post('/enable-notification',verifyToken,UserController.enableNotification);
router.get('/getTransaction',verifyToken,UserController.getTransaction);
router.post('/inviteFriend',verifyToken,UserController.inviteFrndContact);
router.post('/inviteFrndEmail',verifyToken,UserController.inviteFrndEmail);
router.get('/categories',verifyToken,UserController.categoryList);
router.post('/changepassword', verifyToken, UserController.updatePassword);
router.get('/getChapter-list',verifyToken,UserController.booksAndPrayer);
router.post('/chapter-details',verifyToken,UserController.chaterDetails);
router.post('/prayer',verifyToken,UserController.prayerChapterWise);
router.post('/chapter-questions',verifyToken,UserController.chapterQuestions);
router.get('/reflection-question',verifyToken,UserController.chapterReflectionQuestion);
router.post('/chapter-answer',verifyToken,UserController.chapterAnswer);
router.post('/reflection-answer',verifyToken,UserController.reflectionAnswer);
router.post('/share-chapter-partner',verifyToken,UserController.shareChPartner);
router.get('/get-partner-chapter',verifyToken,UserController.getPartnerChpDetail);
router.post('/give-ans-partnerQues',verifyToken,UserController.givePartnerAns);
router.get('/getSharedChapter',verifyToken,UserController.getSharedChapter);
router.post('/getPartnerAns',verifyToken,UserController.getPartnersAns);
router.get('/notification',verifyToken,UserController.notification);
router.post('/subscription-list',verifyToken,UserController.subscriptionlist);
router.post('/subscription-add', verifyToken, UserController.subscriptionAdd)
router.post('/linkAcc',verifyToken,UserController.linkAccount)
router.post('/staticPages',UserController.staticPages);
router.post('/expense',verifyToken,UserController.expenses);
router.get('/ansPartner',verifyToken,UserController.ansPartner);
router.get('/user-share-list', verifyToken, UserController.shareListing)

router.get('/myAnswer',verifyToken,UserController.myAnsChapterList);
router.post('/myChapterAnswer',verifyToken,UserController.showMyAnswer);
router.post('/myChapterAnswer2',verifyToken,UserController.showMyAnswer2);

router.post('/share-chapter-single-partner', verifyToken, UserController.shareChPartner2);


router.get('/privacy_policy', UserController.privacy_policyPage);
router.get('/terms_conditions', UserController.termsAndconditionPage);
router.get('/about_us', UserController.Aboutus);
router.get('/support', UserController.Support);


router.get("/html_page/:slug",UserController.html_page)


module.exports = router;
