package com.cloudpos.apidemo.jniinterface;

import android.util.Log;

public class PinpadInterface 
{
	static {
		try {
			System.loadLibrary("jni_cloudpos_pinpad");
        } catch (Throwable e) {
            Log.e("jni", "i can't find this so!");
            e.printStackTrace();
        }
	}
	public final static int KEY_TYPE_DUKPT = 0;
	public final static int KEY_TYPE_TDUKPT = 1;
	public final static int KEY_TYPE_MASTER = 2;
	public final static int KEY_TYPE_PUBLIC = 3;
	public final static int KEY_TYPE_FIX = 5;
	
	public final static int MAC_METHOD_X99 = 0;
	public final static int MAC_METHOD_ECB = 1;
	/*
	 * open the device
	 * return value : 0 : success
	 * 				  < 0 : error code
	 */
	public native static int PinpadOpen();
	/*
	 * close the devicePinpadSelectKey
	 * return value : 0 : success
	 * 				  < 0 : error code
	 */
	public native static int PinpadClose();
	/*
	 * show text in the first line
	 * param[in] : int nLineIndex : line index, from top to down
	 * param[in] : char* strText : encoded string
	 * param[in] : int nLength : length of string
	 * param[in] : int nFlagSound : 0 : no voice prompt, 1 : voice prompt
	 * return value : < 0 : error code, maybe, your display string is too long!
	 * 				  >= 0 : success
	 */
	public native static int PinpadShowText(int nLineIndex, byte arryText[], int nTextLength, int nFlagSound);
	/*
	 * select master key and user key
	 * @param[in] : int nKeyType : 0 : dukpt, 1: Tdukpt, 2 : master key, 3 : public key, 4 : fix key
	 * @param[in] : int nMasterKeyID : master key ID , [0x00, ..., 0x09], make sense only when nKeyType is master-session pair,
	 * @param[in] : int nUserkeyID : user key ID, [0x00, 0x01], 		  make sense only when nKeyType is master-session pair,
	 * @param[in] : int nAlgorith : 1 : 3DES
	 * 							   0 : DES
	 * return value : < 0 : error code
	 * 				  >= 0 : success
	 */
	public native static int PinpadSelectKey(int nKeyType, int nMasterKeyID, int nUserKeyID, int nAlgorith);
	/*
	 * encrypt string using user key
	 * @param[in] : unsigned char* pPlainText : plain text
	 * @param[in] : int nTextLength : length of plain text
	 * @param[out] : unsigned char* pCipherTextBuffer : buffer for saving cipher text
	 * @param[in] : int CipherTextBufferLength : length of cipher text buffer
	 * return value : < 0 : error code
	 * 				  >= 0 : success, length of cipher text length
	 */
	public native static int PinpadEncryptString(byte arryPlainText[], int nTextLength, byte arryCipherTextBuffer[]);
	/*
	 * calculate pin block
	 * @param[in] : unsigned char* pASCIICardNumber : card number in ASCII format
	 * @param[in] : int nCardNumberLength : length of card number
	 * @param[out] : unsigned char* pPinBlockBuffer : buffer for saving pin block
	 * @param[in] : int nPinBlockBufferLength : buffer length of pin block
	 * @param[in] : int nTimeout_MS : timeout waiting for user input in milliseconds, if it is less than zero, then wait forever
	 * param[in]   : int nFlagSound : 0 : no voice prompt, 1 : voice prompt
	 * return value : < 0 : error code
	 * 			      >= 0 : success, length of pin block
	 */
	public native static int PinpadCalculatePinBlock(byte arryASCIICardNumber[], int nCardNumberLength, byte arryPinBlockBuffer[], int nTimeout_MS, int nFlagSound);
	/*
	 * calculate the MAC using current user key
	 * @param[in] : unsigned char* pData : data
	 * @param[in] : int nDataLength : data length
	 * @param[in] : int nMACFlag : 0: X99, 1 : ECB
	 * @param[out] : unsigned char* pMACOut : MAC data buffer
	 * @param[in] : int nMACOutBufferLength : length of MAC data buffer
	 * return value : < 0 : error code
	 * 				  >= 0 : success
	 *
	 */
	public native static int PinpadCalculateMac(byte arryData[], int nDataLength, int nMACFlag, byte arryMACOutBuffer[]);
	/*
	 * update the user key
	 * @param[in] : int nMasterKeyID : master key id
	 * @param[in] : int nUserKeyID : user key id
	 * @param[in] : unsigned char* pCipherNewUserkey : new user key in cipher text
	 * @param[in] : int nCipherNewUserKeyLength : length of new user key in cipher text
	 * return value : < 0 : error code
	 * 				  >= 0 : success
	 */
	public native static int PinpadUpdateUserKey(int nMasterKeyID, int nUserKeyID, byte arryCipherNewUserKey[], int nCipherNewUserKeyLength);
	/*
	 * set the max length of pin
	 * @param[in] : int nLength : length >= 0 && length <= 0x0D
	 * @param[in] : int nFlag : 1, max length
	 * 							0, min length
	 * return value : < 0 : error code
	 * 				  >= 0 : success
	 */
	public native static int PinpadSetPinLength(int nLength, int nFlag);
	/*
	 * update the master key
	 * @param[in] : int nMasterKeyID : master key ID
	 * @param[in] : unsigned char* pOldKey, old key
	 * @param[in] : int nOldKeyLength : length of old key, 8 or 16
	 * @param[in] : unsigned char* pNewLey : new key
	 * @param[in] : int nNewLeyLength : length of new key, 8 or 16
	 * return value : < 0 : error code
	 * 				  >= 0 : success
	 */
	public native static int PinpadUpdateMasterKey(int nMasterKeyID, byte arryOldMasterKey[], int nOldMasterKeyLength,  byte arryNewMasterKey[], int nCipherNewUserKeyLength);
	/*
	 * get serial number
	 * @param[out] : unsigned char* pData : serial number buffer
	 * return value : < 0 : error code
	 * 				  >= 0 : success, length of serial number
	 */
	public native static int getSerialNo(byte arrySerialNo[]);
	
	public native static int PinpadTest();
}
