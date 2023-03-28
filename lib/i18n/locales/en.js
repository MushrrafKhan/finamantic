const locale = {
    GENERAL_ERROR: 'An error occurred.',
    UNAUTHORIZED: 'Unauthorized access.',
    USER_NOT_FOUND: 'This email address isn\'t registered with us.',
    SOCIAL_USER_NOT_FOUND: 'This user isn\'t registered with us.',
    EMAIL_VERIFY_SUCCESS: 'Email  Verified.',
    EMAIL_VERIFY_FAIL: 'Email Verification Failed.',
    EMAIL_VERIFY_MAIL: 'Email Verification email',

    INVALID_CREDENTIALS: 'Invalid email or password.',
    PASSWORD_CHANGED: 'Password changed.',
    PASSWORD_MATCH_FAILURE: 'Entered password doesn\'t match the old password.',
    PROFILE_UPDATED: 'Profile updated.',
    LOGIN_SUCCESS: 'Logged-In.',
    LOGOUT_SUCCESS: 'Logged-Out.',
    passwordPattern: 'at least 8 characters with at least 1 alphabet and 1 digit',
    PAGE_NOT_EXISTS: 'Page not exists.',
    PAGE_STATUS_UPDATED: 'Page status updated.',
    PAGE_UPDATED: 'Page updated.',
    PAGE_DESCRIPTION_REQUIRED: 'Page Description is Required.',
    YOUR_ACCOUNT_SUSPENDED: 'Your account is suspended.',
    INVALID_RESET_PASS_REQUEST: 'Invalid reset password request.',
    INVALID_OTP: 'Invalid OTP.',
    INVALID_REQUEST: 'Invalid Request.',
    FORGOT_PASSWORD_MAIL_SUCCESS: 'Forgot password email sent.',
    EMAIL_RESET_PASSWORD: 'Reset password email.',
    SETTINGS_PAGE_NOT_FOUND: 'Settings page not found.',
    SETTINGS_UPDATE_SUCCESS: 'Settings Updated.',
    USER_ADD_SUCCESS: 'User added.',
    USER_NOT_EXISTS: 'User not exists.',
    USER_STATUS_UPDATED: 'User updated successfully.',
    USER_DELETE_SUCCESS: 'User delete successfully.',
    USER_UPDATED_SUCCESS: 'User updated.',    
    CATEGORIES_NOT_EXISTS: 'Category not exists.',
    CATEGORIES_ADD_SUCCESS: 'Category added.',
    CATEGORIES_UPDATED_SUCCESS: 'Category updated.',
    CATEGORIES_STATUS_UPDATE_SUCCESS: 'Category status update.',
    CATEGORIES_DELETE_SUCCESS: 'Category delete.',
    OTP_VERIFY_SUCCESS:"OTP verify.",
    RESET_EMAIL_FORGOT:"We have sent reset password instructions to your email address!",

    PRODUCT_NOT_EXISTS: 'Product not exists.',
    PRODUCT_ADD_SUCCESS: 'Product added.',
    PRODUCT_UPDATED_SUCCESS: 'Product updated.',
    PRODUCT_STATUS_UPDATE_SUCCESS: 'Product status update.',
    PRODUCT_DELETE_SUCCESS: 'Product delete.',

    STORE_NOT_EXISTS: 'Store not exists.',
    STORE_ADD_SUCCESS: 'Store added.',
    STORE_UPDATED_SUCCESS: 'Store updated.',
    STORE_STATUS_UPDATE_SUCCESS: 'Store status update.',
    STORE_DELETE_SUCCESS: 'Store delete.',


    RESTAURANT_NOT_EXISTS: 'Restaurant not exists.',
    RESTAURANT_ADD_SUCCESS: 'Restaurant added.',
    RESTAURANT_UPDATED_SUCCESS: 'Restaurant updated.',
    RESTAURANT_STATUS_UPDATE_SUCCESS: 'Restaurant status update.',
    RESTAURANT_DELETE_SUCCESS: 'Restaurant delete.',
    RESTAURANT_ADD_FORM: {
        name: {
            required: 'Name is required.'
        },
        alias: {
            required: 'Alias is required.'
        },
        image_url: {
            required: 'Image Url is required.'
        },
        url: {
            required: 'Url is required.'
        },
        categories: {
            required: 'Categories Name is required.'
        },
        rating: {
            required: 'Rating is required.'
        },
        coordinates: {
            required: 'Lat/Long is required.'
        },
        transactions: {
            required: 'Transactions is required.'
        },
        price: {
            required: 'Price is required.'
        },
        location: {
            required: 'Location is required.'
        },
        phone: {
            required: 'Mobile number is required.'
        }
    },

    EMAIL_EXISTS:"This email address already exists.",
    SUCCESS:"Success",
    ADDRESS_KEY_EXISTS:"Address type already exists",

    STATIC_PAGE_EDIT: {
        title: {
            required: 'Page title is required',
            minlength: 'Page title is required to be minimum 3 chars',
            maxlength: 'Page title is required to be maximum 30 chars',
        }
    },
    ADMIN_LOGIN_FORM: {
        email: {
            required: 'Email is required.',
            minlength: 'Email is required to be minimum 3 chars.',
            maxlength: 'Email is required to be maximum 80 chars.',
        },
        password: {
            required: 'Password is required.',
        },
    },
    ADMIN_FORGOT_PASSWORD_FORM: {
        email: {
            required: 'Email is required.',
            minlength: 'Email is required to be minimum 3 chars.',
            maxlength: 'Email is required to be maximum 80 chars.',
        },
    },
    ADMIN_RESET_PASSWORD_FORM: {
        newPassword: {
            required: 'Password is required.',
            pattern: 'Password must contain at least 8 characters with at least 1 alphabet and 1 digit.'
        },
        confirmPassword: {
            required: 'Confirm Password is required.',
            pattern: 'Confirm Password must match new password.'
        },
        otp: {
            required: 'OTP is required.',
            minlength: 'OTP is required to be minimum 4 chars.',
            maxlength: 'OPT is required to be maximum 4 chars.',
        },
    },
    PROFILE_FORM: {
        firstName: {
            required: 'First name is required.',
            minlength: 'First name is required to be minimum 3 chars.',
            maxlength: 'First name is required to be minimum 30 chars.',
        },
        lastName: {
            required: 'Last name is required.',
            minlength: 'Last name is required to be minimum 3 chars.',
            maxlength: 'Last name is required to be minimum 30 chars.',
        },
        email: {
            required: 'Email is required.',
            minlength: 'Email is required to be minimum 3 chars.',
            maxlength: 'Email is required to be maximum 80 chars.',
            pattern: 'Please enter a valid email.',
            remote: 'This email is already Exists.',
        },
        contactNumber: {
            required: 'Contact number is required.',
            pattern: 'Contact number is required to be a valid number.',
        }
    },
    CHANGE_PASSWORD: {
        currentPassword: {
            required: 'Current password is required.',
        },
        newPassword: {
            required: 'New password is required.',
            minlength: 'New password is required to be minimum 8 chars.',
            maxlength: 'New password is required to be maximum 30 chars.',
            pattern: 'New password must contain at least 1 alphabet and 1 digit.',
        },
        confirmPassword: {
            required: 'Confirm Password is required.',
            equalTo: 'Confirm Password must match new password.',
        },
    },
    CHANGE_SETTINGS: {
        androidAppVersion: {
            required: 'Android app version is required.',
            pattern: 'Android app version is required to be a semantic version.'
        },
        iosAppVersion: {
            required: 'iOS app version is required.',
            pattern: 'iOS app version is required to be a semantic version.'
        },
        androidForceUpdate:{
            required: 'Android force update is required'
        },
        iosForceUpdate:{
            required: 'iOS force update is required'
        }
    },
    ADD_CATEGORIES_FORM: {
        name: {
            required: 'Name is required.',
            minlength: 'Name is required to be minimum 3 chars.',
            maxlength: 'Name is required to be maximum 30 chars.',
            pattern: 'Name may contain alphabet\'s, number and space only.'
        }
    },

    MOBILE_EXISTS:'Contact number already exists',
    MOBILE_NO_EXISTS:'Mobile number already exists',

    monday:"Monday",
    tuesday:"Tuesday",
    wednesday:"Wednesday",
    thursday:"Thursday",
    friday:"Friday",
    saturday:"Saturday",
    sunday:"Sunday"

};

const validationKeys = {
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email Address',
    contactNumber: 'Contact number',
    password: 'Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    emailPattern: 'a valid email address',
    passwordPattern: 'at least 8 characters with at least 1 alphabet and 1 digit',
    contactNumberPattern: 'a valid number',
    countryCodePattern: 'plus sign followed by digits',
    mobilePattern: 'only digits',
    phonePattern: 'only digits',
    otpPattern: 'only digits',
    numberPattern: 'only digits',
    name: 'Name',
    title: 'Title',
    description: 'Description',
    dateFrom: 'From date',
    dateTo: 'To date',
    countryCode: 'Country code',
    mobile: 'Mobile',
    address: 'Address',
    age: 'Age',
    gender: 'Gender',
    vehicleType: 'Vehicle type',
    licenceNo: 'Licence Number',
    licenceIssuedAt: 'Licence issued at',
    licenceExpiresOn: 'Licence expires on',
};

const key = keyName => validationKeys[keyName.replace(/\.[\d]+/, '')] || keyName;

/**
 * @see https://github.com/hapijs/joi/blob/master/lib/language.js
 */
const validationMessages = {
    any: {
        required: ({ path }) => `${key(path.join('.'))} is required.`,
        unknown: ({ path }) => `${key(path.join('.'))} is not allowed.`,
        invalid: ({ path }) => `${key(path.join('.'))} contains an invalid value.`,
        empty: ({ path }) => `${key(path.join('.'))} is required.`,
        allowOnly: ({ context, path }) =>
            `${key(path.join('.'))} must be one of ${context.valids.map(item => key(item)).join(', ')}`,
    },

    string: {
        regex: {
            name: ({ context, path }) => `${key(path.join('.'))} must contain ${key(context.name)}`,
        },
        min: ({ context, path }) => `${key(path.join('.'))} must be at least ${context.limit} characters in length.`,
        max: ({ context, path }) => `${key(path.join('.'))} must be under ${context.limit} characters in length.`,
        hex: ({ path }) => `${key(path.join('.'))} must only contain hexadecimal characters.`,
        length: ({ path }) => `${key(path.join('.'))} length must be 4 characters long.`,
    },

    number: {
        base: ({ path }) => `${key(path.join('.'))} must be a number`,
        min: ({ context, path }) => `${key(path.join('.'))} must be larger than or equal to ${context.limit}.`,
        max: ({ context, path }) => `${key(path.join('.'))} must be less than or equal to ${context.limit}.`,
    },

    objectId: {
        valid: ({ path }) => `${key(path.join('.'))} needs to be a valid Object ID`,
    },

    object: {
        base: ({ path }) => `${key(path.join('.'))} must be an object`,
        xor: ({ context }) => `only one of ${context.peers.map(peer => key(peer)).join(', ')} is allowed.`,
        with: ({ context }) => `${key(context.peer)} is required with ${key(context.main)}.`,
        without: ({ context }) => `${key(context.peer)} needs to be removed with ${key(context.main)}.`,
        and: ({ context }) =>
            `${context.missing.map(peer => key(peer)).join(', ')} required with ${context.present
               .map(peer => key(peer))
               .join(', ')}.`,
    },

    array: {
        min: ({ path, context }) => `${key(path.join('.'))} must contain at least ${context.limit} items.`,
        max: ({ path, context }) => `${key(path.join('.'))} must contain at most ${context.limit} items.`,
    },

    custom: {
        sameAs: (key1, key2) => `${key(key1)} must match the ${key(key2)} field.`,
    },

    date: {
        valid: key1 => `${key(key1)} needs to be a valid date`,
    },
};

locale.validationKeys = validationKeys;
locale.validation = validationMessages;

module.exports = Object.freeze(locale);
