#include "N20Epp.h"
#include <fcntl.h>
#include <stdio.h>
#include "com_jb_t508aq_pinpad_N20Epp.h"
#include <android/log.h>

#define TRANS_VOID_SALE		  			4   //消费撤销
#define TRANS_APP_PRE_AUTH			    20	//预授权完成请求
//POS Entry Mode(fTransMode)
#define CARD_MANUAL             0
#define CARD_SWIPED             1

#define KEY_TYPE_MASTER      0x01
#define KEY_TYPE_MAC         0x02
#define KEY_TYPE_PIN         0x03
#define KEY_TYPE_DUKPT_MAC   0x04
#define KEY_TYPE_DUKPT_PIN   0x05
#define KEY_TYPE_FIXED_MAC   0x10
#define KEY_TYPE_FIXED_PIN   0x11

EPP_CFG* hPinPad = NULL;

int pinpad_open(const char *filename) {
	hPinPad = epp_open(filename, O_RDWR);

	if (NULL == hPinPad)
		return EPP_PORT_OPEN_ERROR;

	return EPP_SUCCESS;
}

int pinpad_check_conn() {
	int iret;
	char szVerInfo[128];

	iret = epp_get_system_info(hPinPad, 0x11, szVerInfo);
	if (iret)
		return iret;

	return EPP_SUCCESS;
}

int pinpad_inject_masterkey(uchar masterindex, char desflag, uchar *keydata,
		int datalen) {
	EppAppKey_t appkey;
	int iret;
	char logbuf[2048] = { 0 };
	int i, j;

	__android_log_print(ANDROID_LOG_INFO, "N20Epp",
			"pinpad_inject_masterkey---masterindex:[%d]", masterindex);

	if (keydata == NULL)
		return EPP_INPUT_PARAM_ERROR;

	memset(&appkey, 0, sizeof(EppAppKey_t));
	appkey.KeyType = 0x01;
	appkey.Mode = 0x02;
	if (desflag == '1')
		appkey.KeyLen = 8;
	else
		appkey.KeyLen = 16;

	appkey.KeyIndex = masterindex;
	appkey.MasterKeyIndex = 1;
	memcpy(appkey.KeyData, keydata, datalen);

	for (i = 0, j = 0; i < datalen; i++, j = j + 2) {
		sprintf(&logbuf[j], "%02x", keydata[i]);
	}

	__android_log_print(ANDROID_LOG_INFO, "N20Epp",
			"pinpad_inject_masterkey---data buf:[%s]", logbuf);

	iret = epp_download_appkey(hPinPad, &appkey);

	__android_log_print(ANDROID_LOG_INFO, "N20Epp",
			"pinpad_inject_masterkey---iret:[%d]", iret);

	return iret;
}

int pinpad_inject_workkey(uchar masterindex, uchar pinindex, uchar macindex,
		uchar desindex, char desflag, uchar *keydata, int datalen) {
	EppAppKey_t appkey;
	int iret, cnt;
	char szBuff[1024];
	int iPinKeyLen, iMacKeyLen;
	char logbuf[2048] = { 0 };
	int i, j;

	__android_log_print(ANDROID_LOG_INFO, "N20Epp",
			"pinpad_inject_masterkey---masterindex:[%d]", masterindex);
	__android_log_print(ANDROID_LOG_INFO, "N20Epp",
			"pinpad_inject_masterkey---pinindex:[%d]", pinindex);
	__android_log_print(ANDROID_LOG_INFO, "N20Epp",
			"pinpad_inject_masterkey---macindex:[%d]", macindex);
	__android_log_print(ANDROID_LOG_INFO, "N20Epp",
			"pinpad_inject_masterkey---desindex:[%d]", desindex);

	if (NULL == keydata)
		return EPP_INPUT_PARAM_ERROR;

	if (datalen == 24) //单倍长密钥
			{
		iPinKeyLen = 8;
		iMacKeyLen = 8;
	} else if (datalen >= 40) {
		iPinKeyLen = 16;
		iMacKeyLen = 8; //MacKey仍然是单倍长,运算时仍然是单DES
	}

	//设置PIN密钥
	memset(&appkey, 0, sizeof(EppAppKey_t));
	appkey.KeyType = 0x03;
	appkey.Mode = 0x00;
	appkey.KeyLen = iPinKeyLen;
	appkey.KeyIndex = pinindex;
	appkey.MasterKeyIndex = masterindex;
	memset(szBuff, 0, sizeof(szBuff));
	memcpy(appkey.KeyData, keydata, 16);

	__android_log_print(ANDROID_LOG_INFO, "N20Epp",
			"pinpad_inject_workkey---KeyType :[%02x]", appkey.KeyType);
	__android_log_print(ANDROID_LOG_INFO, "N20Epp",
			"pinpad_inject_workkey---Mode :[%02x]", appkey.Mode);
	__android_log_print(ANDROID_LOG_INFO, "N20Epp",
			"pinpad_inject_workkey---KeyLen :[%02x]", appkey.KeyLen);
	__android_log_print(ANDROID_LOG_INFO, "N20Epp",
			"pinpad_inject_workkey---KeyIndex :[%02x]", appkey.KeyIndex);
	__android_log_print(ANDROID_LOG_INFO, "N20Epp",
			"pinpad_inject_workkey---MasterKeyIndex :[%02x]",
			appkey.MasterKeyIndex);

	for (i = 0, j = 0; i < appkey.KeyLen; i++, j = j + 2) {
		sprintf(&logbuf[j], "%02x", appkey.KeyData[i]);
	}

	__android_log_print(ANDROID_LOG_INFO, "N20Epp",
			"pinpad_inject_workkey---pin key :[%s]", logbuf);

	iret = epp_download_appkey(hPinPad, &appkey);

	__android_log_print(ANDROID_LOG_INFO, "N20Epp",
			"pinpad_inject_workkey---pin key iret:[%d]", iret);
	if (iret)
		return EPP_INJECT_PIN_KEY_ERROR;

	//Pin CheckValue
	memset(szBuff, 0, sizeof(szBuff));
	iret = epp_get_tdea(hPinPad, 5, 3, pinindex,
			"\x00\x00\x00\x00\x00\x00\x00\x00", 8, szBuff);
	__android_log_print(ANDROID_LOG_INFO, "N20Epp",
			"pinpad_inject_workkey---pin key chk value iret:[%d]", iret);
	if (iret)
		return EPP_GET_PIN_CHK_ERROR;

	//与CheckValue比较
	if (datalen == 24) //单倍长密钥
		cnt = 8;
	else if (datalen >= 40)
		cnt = 16;

	for (i = 0, j = 0; i < 4; i++, j = j + 2) {
		sprintf(&logbuf[j], "%02x", szBuff[i]);
	}

	__android_log_print(ANDROID_LOG_INFO, "N20Epp",
			"pinpad_inject_workkey---pin key chk value:[%s]", logbuf);

	if (memcmp(szBuff, &keydata[cnt], 4) != 0) //不相等
		return EPP_CMP_PIN_CHK_ERROR;

	//设置MAC密钥
	memset(&appkey, 0, sizeof(EppAppKey_t));
	appkey.KeyType = 0x02;
	appkey.Mode = 0x00;
	appkey.KeyLen = 8;
	appkey.KeyIndex = macindex;
	appkey.MasterKeyIndex = masterindex;

	if (desflag == '1')
		memcpy(appkey.KeyData, &keydata[12], 8);
	else
		memcpy(appkey.KeyData, &keydata[20], 8);

	for (i = 0, j = 0; i < appkey.KeyLen; i++, j = j + 2) {
		sprintf(&logbuf[j], "%02x", appkey.KeyData[i]);
	}

	__android_log_print(ANDROID_LOG_INFO, "N20Epp",
			"pinpad_inject_workkey---mac key:[%s]", logbuf);

	iret = epp_download_appkey(hPinPad, &appkey);
	__android_log_print(ANDROID_LOG_INFO, "N20Epp",
			"pinpad_inject_workkey---mac key iret:[%d]", iret);
	if (iret)
		return EPP_INJECT_MAC_KEY_ERROR;

	//Mac CheckValue
	memset(szBuff, 0, sizeof(szBuff));
	iret = epp_get_tdea(hPinPad, 5, 2, macindex,
			"\x00\x00\x00\x00\x00\x00\x00\x00", 8, szBuff);
	__android_log_print(ANDROID_LOG_INFO, "N20Epp",
			"pinpad_inject_workkey---mac key chk value iret:[%d]", iret);
	if (iret)
		return EPP_GET_MAC_CHK_ERROR;

	//与CheckValue比较
	if (datalen == 24) //单倍长密钥
			{
		cnt = 20;
	} else if (datalen >= 40) {
		cnt = 36;
	}

	for (i = 0, j = 0; i < 4; i++, j = j + 2) {
		sprintf(&logbuf[j], "%02x", szBuff[i]);
	}

	__android_log_print(ANDROID_LOG_INFO, "N20Epp",
			"pinpad_inject_workkey---mac key chk value:[%s]", logbuf);

	if (memcmp(szBuff, &keydata[cnt], 4) != 0) //不相等
		return EPP_CMP_MAC_CHK_ERROR;

	if (datalen > 40) {
		__android_log_print(ANDROID_LOG_INFO, "N20Epp",
				"pinpad_inject_workkey---inject des key");
		//设置磁道密钥
		memset(&appkey, 0, sizeof(EppAppKey_t));
		appkey.KeyType = 0x02;
		appkey.Mode = 0x00;
		appkey.KeyLen = 16;
		appkey.KeyIndex = desindex;
		appkey.MasterKeyIndex = masterindex;
		memset(szBuff, 0, sizeof(szBuff));
		memcpy(appkey.KeyData, &keydata[40], 16);
		iret = epp_download_appkey(hPinPad, &appkey);
		if (iret)
			return EPP_INJECT_DES_KEY_ERROR;

		//Des CheckValue
		memset(szBuff, 0, sizeof(szBuff));
		iret = epp_get_tdea(hPinPad, 5, 2, desindex,
				"\x00\x00\x00\x00\x00\x00\x00\x00", 8, szBuff);
		if (iret)
			return EPP_GET_DES_CHK_ERROR;

		//与CheckValue比较
		if (memcmp(szBuff, &keydata[56], 4) != 0) //不相等
			return EPP_CMP_DES_CHK_ERROR;

		__android_log_print(ANDROID_LOG_INFO, "N20Epp",
				"pinpad_inject_workkey---des key success");
	}

	__android_log_print(ANDROID_LOG_INFO, "N20Epp",
			"pinpad_inject_workkey---finished");

	return EPP_SUCCESS;
}

char money2float(char *dest, const char *src) {
	short i, j, len;

	len = strlen(src);
	j = 0;

	if (len == 0) {
		dest[j++] = '0';
		dest[j++] = '.';
		dest[j++] = '0';
		dest[j++] = '0';
	} else if (len == 1) {
		dest[j++] = '0';
		dest[j++] = '.';
		dest[j++] = '0';
		dest[j++] = src[0];
	} else if (len == 2) {
		dest[j++] = '0';
		dest[j++] = '.';
		dest[j++] = src[0];
		dest[j++] = src[1];
	} else {
		for (i = 0; i < len; i++) {
			dest[j++] = src[i];

			if ((len - 3) == i)
				dest[j++] = '.';
		}
	}
	dest[j] = '\0';

	return j;
}

int FindStr(char *Buffer, int BufLen, char *Target, int TargetLen) {
	int i;

	for (i = 0; i < BufLen; i++) {
		if (memcmp(Buffer + i, Target, TargetLen) == 0) {
			return i;
		}
	}
	return -1;
}

int pinpad_get_pinblock(uchar pinindex, short type, char mode, char *amt,
		char *price, char *pan, char *track2, char *pinblock, short *pinblklen) {
	int iret;
	short i;
	int len;
	char szBuffTemp[128];
	char szBuff[128];
	char szPAN[32], szAmtBuf[16] = { 0 }, szTrack2Buf[128] = { 0 };
	char logbuf[2048] = { 0 };
	int j;

	if (NULL == amt || NULL == price || NULL == pan || NULL == track2
			|| NULL == pinblock || NULL == pinblklen)
		return EPP_INPUT_PARAM_ERROR;

	memcpy(szAmtBuf, amt, 12);
	strcpy(szTrack2Buf, track2);

	iret = epp_beep(hPinPad, 1, 500);
	if (iret)
		return iret;

	//清除屏幕
	iret = epp_clear_screen(hPinPad);
	if (iret)
		return iret;

	if (type == TRANS_VOID_SALE || type == TRANS_APP_PRE_AUTH) {
		for (i = 0; i < 12; i++) {
			if (szAmtBuf[i] != '0')
				break;
		}
		memset(szBuff, 0, sizeof(szBuff));
		memset(szBuffTemp, 0, sizeof(szBuffTemp));
		memcpy(szBuffTemp, &szAmtBuf[i], 12 - i);
		money2float(szBuff, szBuffTemp);
	} else {
		memset(szBuff, 0, sizeof(szBuff));
		if (atoi(price) % 100 != 0)
			sprintf(szBuff, "%d.%02d", atoi(price) / 100, atoi(price) % 100);
		else
			sprintf(szBuff, "%d.00", atoi(price) / 100);
	}

	iret = epp_display_string(hPinPad, 10, 0, 16, szBuff, strlen(szBuff));
	if (iret)
		return iret;

	epp_set_pin_input_timeout(hPinPad, 60000);

	memset(szBuffTemp, 0, sizeof(szBuffTemp));
	memcpy(szBuffTemp, "0000000000000000", 16);
	len = 0;
	if (mode == CARD_MANUAL) {
		len = strlen(pan);
		memcpy(&szBuffTemp[4], &pan[len - 13], 12);
	} else {
		iret = FindStr(szTrack2Buf, 37, "=", 1);
		memset(szPAN, 0, sizeof(szPAN));
		memcpy(szPAN, &szTrack2Buf[iret - 1 - 12], 12);
		memcpy(&szBuffTemp[4], szPAN, 12);
	}

	__android_log_print(ANDROID_LOG_INFO, "N20Epp",
			"pinpad_get_pinblock---szBuffTemp:[%s]", szBuffTemp);

	memset(szBuff, 0, sizeof(szBuff)); //gF.TermVar.MasterKeyIndex[0]
	iret = epp_get_pin(hPinPad, KEY_TYPE_PIN, pinindex, 1, 0x00, szBuffTemp,
			"0456789abc\0\0\0", szBuff);
	if (iret) {
		if (iret == -EPP_NO_PIN) {
			*pinblklen = 0;
			return EPP_SUCCESS;
		}

		return iret;
	}

	*pinblklen = 8;

	memset(pinblock, 0, sizeof(pinblock));
	memcpy(pinblock, szBuff, 8);

	memset(logbuf, 0x00, sizeof(logbuf));
	for (i = 0, j = 0; i < 8; i++, j = j + 2) {
		sprintf(&logbuf[j], "%02x", pinblock[i]);
	}

	__android_log_print(ANDROID_LOG_INFO, "N20Epp",
			"pinpad_get_pinblock---pin block:[%s]", logbuf);

	return EPP_SUCCESS;
}

int pinpad_get_mac(uchar macindex, uchar *data, short len, uchar *mac) {

	int iret;
	uchar tempbuff[100];
	char szBuff[2048], logbuf[2048] = { 0 };
	int MacNum = 0, i, j;

	if (NULL == data || NULL == mac)
		return EPP_INPUT_PARAM_ERROR;

	memset(szBuff, 0, sizeof(szBuff));
	memcpy(szBuff, data, len);

	if (len % 8 != 0)
		MacNum = ((8 - (len % 8)) + len);
	else
		MacNum = len;

	for (i = 0, j = 0; i < MacNum; i++, j = j + 2) {
		sprintf(&logbuf[j], "%02x", szBuff[i]);
	}

	__android_log_print(ANDROID_LOG_INFO, "N20Epp",
			"epp_get_mac---data buf:[%s]", logbuf);

	memset(tempbuff, 0, sizeof(tempbuff));
	iret = epp_get_mac(hPinPad, 2, macindex, 3, szBuff, MacNum, tempbuff);
	__android_log_print(ANDROID_LOG_INFO, "N20Epp", "epp_get_mac---iret:[%d]",
			iret);

	memset(logbuf, 0x00, sizeof(logbuf));
	for (i = 0, j = 0; i < MacNum; i++, j = j + 2) {
		sprintf(&logbuf[j], "%02x", tempbuff[i]);
	}

	__android_log_print(ANDROID_LOG_INFO, "N20Epp", "epp_get_mac---mac:[%s]",
			logbuf);
	if (iret)
		return iret;

	memcpy(mac, tempbuff, 8);
	return EPP_SUCCESS;
}

int pinpad_encrypted_track(uchar desindex, uchar *data, int datalen,
		uchar *endata) {
	int iret;
	char szBuff[1024];
	char logbuf[2048] = { 0 };
	int i, j;

	__android_log_print(ANDROID_LOG_INFO, "N20Epp",
			"pinpad_encrypted_track---desindex:[%d]", desindex);

	if (NULL == data || NULL == endata)
		return EPP_INPUT_PARAM_ERROR;

	memset(szBuff, 0, sizeof(szBuff));
	iret = epp_get_tdea(hPinPad, 5, 2, desindex, data, 8, szBuff);
	if (iret)
		return iret;

	memset(logbuf, 0x00, sizeof(logbuf));
	for (i = 0, j = 0; i < 8; i++, j = j + 2) {
		sprintf(&logbuf[j], "%02x", szBuff[i]);
	}
	__android_log_print(ANDROID_LOG_INFO, "N20Epp",
			"pinpad_encrypted_track---encrypted data:[%s]", logbuf);

	memcpy(endata, szBuff, 8);
	return EPP_SUCCESS;
}

int pinpad_confirm_amt(char *amt, int len) {
	int iret;

	iret = epp_beep(hPinPad, 1, 500);
	if (iret)
		return iret;

	iret = epp_clear_screen(hPinPad);
	if (iret)
		return iret;

	iret = epp_display_string(hPinPad, 0, 0, 16, amt, len);
	if (iret)
		return iret;

	return EPP_SUCCESS;
}

int pinpad_close() {
	return epp_close(hPinPad);
}

int pinpad_get_string(int iMode, int iMinLen, int iMaxlen, int iTimeOutMs, char *strBuff) {
	int ac = epp_kb_get_string(hPinPad, iMode, iMinLen, iMaxlen, iTimeOutMs, strBuff);
	return ac;
}

JNIEXPORT jint JNICALL Java_com_jb_t508aq_pinpad_N20Epp_pinpad_1get_1string
  (JNIEnv *env, jobject thiz, jint iMode, jint iMinLen, jint iMaxlen, jint iTimeOutMs, jbyteArray input){
	char *inputdata = NULL;
	inputdata = (char*) (*env)->GetByteArrayElements(env, input, NULL);
	int ac = pinpad_get_string(iMode,iMinLen,iMaxlen,iTimeOutMs,inputdata);
	return ac;
}

int pinpad_display_string(int x, int y, int size, char *cont, int len) {
	int iret = epp_display_string(hPinPad, 10, 0, 8, cont, len);
	return iret;
}
JNIEXPORT jint JNICALL Java_com_jb_t508aq_pinpad_N20Epp_pinpad_1display_1string(
		JNIEnv *env, jobject thiz, jint x, jint y, jint size,
		jcharArray showcen, jint len) {
	char *showdata = NULL;
	showdata = (char*) (*env)->GetByteArrayElements(env, showcen, NULL);
	int ac = pinpad_display_string(x, y, size, showdata, len);
	return ac;
}
int pinpad_clear() {
	//清除屏幕
	int iret = epp_clear_screen(hPinPad);
	if (iret)
		return iret;
}
JNIEXPORT jint JNICALL Java_com_jb_t508aq_pinpad_N20Epp_pinpad_1clear(JNIEnv *env,
		jobject thiz) {
	int ac = pinpad_clear();
	return ac;
}

/*
 * Class:     cn_gzjb_n20epp_N20Epp
 * Method:    pinpad_open
 * Signature: ([C)I
 */
JNIEXPORT jint JNICALL Java_com_jb_t508aq_pinpad_N20Epp_pinpad_1open(JNIEnv *env,
		jobject thiz, jcharArray strPortName) {
	int iret;
	char* pPortName = NULL;
	pPortName = (char*) (*env)->GetByteArrayElements(env, strPortName, NULL);
	iret = pinpad_open(pPortName);
	(*env)->ReleaseByteArrayElements(env, strPortName, pPortName, 0);
	return iret;
}

/*
 * Class:     cn_gzjb_n20epp_N20Epp
 * Method:    pinpad_check_conn
 * Signature: ()I
 */
JNIEXPORT jint JNICALL Java_com_jb_t508aq_pinpad_N20Epp_pinpad_1check_1conn(
		JNIEnv *env, jobject thiz) {
	int iret;
	iret = pinpad_check_conn();
	return iret;
}

/*
 * Class:     cn_gzjb_n20epp_N20Epp
 * Method:    pinpad_inject_masterkey
 * Signature: (BB[BI)I
 */
JNIEXPORT jint JNICALL Java_com_jb_t508aq_pinpad_N20Epp_pinpad_1inject_1masterkey(
		JNIEnv *env, jobject thiz, jbyte masterindex, jbyte desflag,
		jbyteArray arrKeydata, jint datalen) {
	int iret;
	char *keydata = NULL;
	keydata = (char*) (*env)->GetByteArrayElements(env, arrKeydata, NULL);
	iret = pinpad_inject_masterkey(masterindex, desflag, keydata, datalen);
	(*env)->ReleaseByteArrayElements(env, arrKeydata, keydata, 0);
	return iret;
}

/*
 * Class:     cn_gzjb_n20epp_N20Epp
 * Method:    pinpad_inject_workkey
 * Signature: (BBBBB[CI)I
 */
JNIEXPORT jint JNICALL Java_com_jb_t508aq_pinpad_N20Epp_pinpad_1inject_1workkey(
		JNIEnv *env, jobject thiz, jbyte masterindex, jbyte pinindex,
		jbyte macindex, jbyte desindex, jbyte desflag, jcharArray arrKeydata,
		jint datalen) {
	int iret;
	char *keydata = NULL;
	keydata = (char*) (*env)->GetByteArrayElements(env, arrKeydata, NULL);
	iret = pinpad_inject_workkey(masterindex, pinindex, macindex, desindex,
			desflag, keydata, datalen);
	(*env)->ReleaseByteArrayElements(env, arrKeydata, keydata, 0);
	return iret;

}

/*
 * Class:     cn_gzjb_n20epp_N20Epp
 * Method:    pinpad_get_pinblock
 * Signature: (BSB[C[C[C[C[B[S)I
 */
JNIEXPORT jint JNICALL Java_com_jb_t508aq_pinpad_N20Epp_pinpad_1get_1pinblock(
		JNIEnv *env, jobject thiz, jbyte pinindex, jshort type, jbyte mode,
		jcharArray jArrAmt, jcharArray jArrPrice, jcharArray jArrPan,
		jcharArray jArrTrack2, jbyteArray jArrPinblock, jshortArray sArrPinlen) {
	int iret;
	char *amt = NULL;
	char *price = NULL;
	char *pan = NULL;
	char *track2 = NULL;
	char *pinblock = NULL;
	short *pinblklen = NULL;

	amt = (char*) (*env)->GetByteArrayElements(env, jArrAmt, NULL);
	price = (char*) (*env)->GetByteArrayElements(env, jArrPrice, NULL);
	pan = (char*) (*env)->GetByteArrayElements(env, jArrPan, NULL);
	track2 = (char*) (*env)->GetByteArrayElements(env, jArrTrack2, NULL);
	pinblock = (char*) (*env)->GetByteArrayElements(env, jArrPinblock, NULL);
	pinblklen = (short*) (*env)->GetShortArrayElements(env, sArrPinlen, NULL);

	iret = pinpad_get_pinblock(pinindex, type, mode, amt, price, pan, track2,
			pinblock, pinblklen);

	(*env)->ReleaseByteArrayElements(env, jArrAmt, amt, 0);
	(*env)->ReleaseByteArrayElements(env, jArrPrice, price, 0);
	(*env)->ReleaseByteArrayElements(env, jArrPan, pan, 0);
	(*env)->ReleaseByteArrayElements(env, jArrTrack2, track2, 0);
	(*env)->ReleaseByteArrayElements(env, jArrPinblock, pinblock, 0);
	(*env)->ReleaseShortArrayElements(env, sArrPinlen, pinblklen, 0);

	return iret;
}

/*
 * Class:     cn_gzjb_n20epp_N20Epp
 * Method:    pinpad_get_mac
 * Signature: (B[BS[B)I
 */
JNIEXPORT jint JNICALL Java_com_jb_t508aq_pinpad_N20Epp_pinpad_1get_1mac(JNIEnv *env,
		jobject thiz, jbyte macindex, jbyteArray jArrData, jshort len,
		jbyteArray jArrMac) {
	int iret;
	char *data = NULL;
	uchar *mac = NULL;

	data = (char*) (*env)->GetByteArrayElements(env, jArrData, NULL);
	mac = (char*) (*env)->GetByteArrayElements(env, jArrMac, NULL);

	iret = pinpad_get_mac(macindex, data, len, mac);

	(*env)->ReleaseByteArrayElements(env, jArrData, data, 0);
	(*env)->ReleaseByteArrayElements(env, jArrMac, mac, 0);
	return iret;
}

/*
 * Class:     cn_gzjb_n20epp_N20Epp
 * Method:    pinpad_encrypted_track
 * Signature: (B[BI[B)I
 */
JNIEXPORT jint JNICALL Java_com_jb_t508aq_pinpad_N20Epp_pinpad_1encrypted_1track(
		JNIEnv *env, jobject thiz, jbyte desindex, jbyteArray jArrData,
		jint len, jbyteArray jArrEnData) {
	int iret;
	char *data = NULL;
	char *endata = NULL;

	data = (char*) (*env)->GetByteArrayElements(env, jArrData, NULL);
	endata = (char*) (*env)->GetByteArrayElements(env, jArrEnData, NULL);

	iret = pinpad_encrypted_track(desindex, data, len, endata);

	(*env)->ReleaseByteArrayElements(env, jArrData, data, 0);
	(*env)->ReleaseByteArrayElements(env, jArrEnData, endata, 0);
	return iret;
}

/*
 * Class:     cn_gzjb_n20epp_N20Epp
 * Method:    pinpad_confirm_amt
 * Signature: ([CI)I
 */
JNIEXPORT jint JNICALL Java_com_jb_t508aq_pinpad_N20Epp_pinpad_1confirm_1amt(
		JNIEnv *env, jobject thiz, jcharArray jArrAmt, jint len) {
	int iret;
	char *amt = NULL;

	amt = (char*) (*env)->GetByteArrayElements(env, jArrAmt, NULL);
	iret = pinpad_confirm_amt(amt, len);
	(*env)->ReleaseByteArrayElements(env, jArrAmt, amt, 0);
	return iret;
}

/*
 * Class:     cn_gzjb_n20epp_N20Epp
 * Method:    pinpad_close
 * Signature: ()I
 */
JNIEXPORT jint JNICALL Java_com_jb_t508aq_pinpad_N20Epp_pinpad_1close(JNIEnv *env,
		jobject thiz) {
	return pinpad_close();
}
