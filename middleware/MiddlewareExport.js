const { AdminAuthentication } = require('../middleware/Authorization');
const { UserAuthentication, ArtistAuthentication, ProfessionalAuthentication, GuestAuthentication } = require('../middleware/Authentication');
const { uploadMiddleWare } = require('../middleware/FileUpload');
const { SubscriptionChecker } = require('../middleware/SubscriptionChecker');
const { WalletChecker } = require('../middleware/WalletChecker');
const { EventCreationChecker } = require('../middleware/EventCreation');
const { EventCollaborationChecker } = require('../middleware/EventCollaboration');
const { JobCreationChecker } = require('../middleware/JobCreation');
const { JobApplyChecker } = require('../middleware/JobApply');
const { PostCreationChecker } = require('../middleware/PostCreation');
module.exports = {
    AdminAuthentication,
    UserAuthentication,
    ArtistAuthentication,
    ProfessionalAuthentication,
    GuestAuthentication,
    uploadMiddleWare,
    SubscriptionChecker,
    WalletChecker,
    EventCreationChecker,
    EventCollaborationChecker,
    JobCreationChecker,
    JobApplyChecker,
    PostCreationChecker
}