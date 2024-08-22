import CryptoJS from "crypto-js";

const encryptToken = (token, secretKey) =>{
    return CryptoJS.AES.encrypt(token, secretKey).toString();
}

const decryptToken = (encryptedToken, secretKey) => {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
};

export {encryptToken, decryptToken}
  